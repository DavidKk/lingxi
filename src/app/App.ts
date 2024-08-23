import fs from 'fs'
import path from 'path'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import { Telepathy } from '@/core/libs/Telepathy'
import type { Middleware, MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import type { MiddlewareRegistry as IMiddlewareRegistry, Satisfies } from '@/core/types'
import { renderQrcodeEmailContent } from '@/core/templates/renderQrcodeEmailContent'
import { SERVER_NAME } from '@/core/constants/conf'
import { Once } from '@/core/decorators/once'
import type { Notifier } from '@/notifiers/types'
import { HttpProvider } from '@/providers/HttpProvider'
import type { MessageContext, QrcodeContext, RequestContext, SayMessage } from '@/providers/types'
import type { Gpts } from '@/services/types'
import { DEFAULT_COMMANDS_DIR, DEFAULT_MENTIONS_DIR, DEFAULT_WEBHOOKS_DIR } from './constants/dir'
import type { HttpMiddleware } from './registries/httpRegistry'
import { WEBHOOK_BASE_PATH } from './constants/conf'
import type { CommandMiddlewareFactory, ChatMiddlewareFactory, ChatMiddlewareFactoryPayload } from './registries/chatRegistry'
import { command, combineChatMiddlewares } from './registries/chatRegistry'
import type { ChatClientAbstract } from '@/core/libs/ChatClientAbstract'

export type MiddlewareRegistry = Partial<
  Satisfies<
    IMiddlewareRegistry,
    {
      scanQRCode: MiddlewareCoordinator<QrcodeContext>
      chatMessage: MiddlewareCoordinator<MessageContext>
      httpGET: MiddlewareCoordinator<RequestContext>
      httpPOST: MiddlewareCoordinator<RequestContext>
    }
  >
>

export class App extends Telepathy<MiddlewareRegistry, Notifier, Gpts> {
  protected httpServer = new HttpProvider({ logger: this.logger })

  /** 启动 */
  public async start() {
    await this.loadWebhoks()
    await this.httpServer.serve()

    this.applySendScanQRcode()
    await this.loadCommands()
    await this.loadMentions()
    await super.start()
  }

  /** 暂停 */
  public async stop() {
    this.httpServer && (await this.httpServer.stop())
    await super.stop()
  }

  /** 重启 */
  public async restart() {
    this.httpServer && (await this.httpServer.stop())
    this.httpServer && (await this.httpServer.serve())
    await super.restart()
  }

  /** 注册发送二维码扫描消息 */
  @Once
  protected applySendScanQRcode() {
    const notifiers = this.notifiers.filter((notifier) => notifier.supports.includes('html'))
    this.use('scanQRCode', this.createQrcodeMiddleware(notifiers))
    this.logger.info('Apply send scan qrcode middleware.')
  }

  /** 创建二维码扫描通知中间件 */
  protected createQrcodeMiddleware(notifiers: Notifier[]): Middleware<QrcodeContext> {
    return function middleware(context) {
      const { qrcode: input, logger } = context
      qrcodeTerminal.generate(input, { small: true }, (qrcode) => {
        logger.info('Please scan the QR code authorized to login.')
        // eslint-disable-next-line no-console
        console.log(qrcode)
      })

      if (!notifiers?.length) {
        logger.warn('no notifiers found')
        return
      }

      qrcode.toDataURL(input, async (error, url) => {
        if (error) {
          logger.fail(`Generate qrcode failed: ${error}`)
          return
        }

        const body = renderQrcodeEmailContent(url)
        const promises = notifiers.map((notifier) => notifier.send({ title: `${SERVER_NAME} Launch`, body, contentType: 'html' }))
        await Promise.allSettled(promises)
      })
    }
  }

  /** 创建中间件工厂函数参入 */
  protected createMiddlewareFactoryPayload(client: ChatClientAbstract<any>): ChatMiddlewareFactoryPayload {
    const gpt = this.getGPTService()
    return { client, gpt, telepathy: this }
  }

  /** 加载聊天文件 */
  protected async loadMentions() {
    const middlewares = await this.load<ChatMiddlewareFactory>(DEFAULT_MENTIONS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`no mentions found from ${DEFAULT_MENTIONS_DIR}`)
      return
    }

    const mentionsMiddlewareFactory = combineChatMiddlewares(...middlewares)
    for (const client of this.clients) {
      const payload = this.createMiddlewareFactoryPayload(client)
      client.use('chatMessage', mentionsMiddlewareFactory(payload))
    }

    this.logger.info(`Load ${middlewares.length} mentions.`)
  }

  /** 加载指令文件 */
  protected async loadCommands() {
    const middlewares = await this.load<CommandMiddlewareFactory>(DEFAULT_COMMANDS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`no commands found from ${DEFAULT_COMMANDS_DIR}`)
      return
    }

    const helpCommandMiddlewareFactory = this.applyHelpCommand(middlewares)
    const commands = [helpCommandMiddlewareFactory, ...middlewares]

    const commandMiddlewareFactory = combineChatMiddlewares(...commands)
    for (const client of this.clients) {
      const payload = this.createMiddlewareFactoryPayload(client)
      client.use('chatMessage', commandMiddlewareFactory(payload))
    }
  }

  /** 加载 webhooks 文件 */
  protected async loadWebhoks() {
    const middlewares = await this.load<HttpMiddleware<SayMessage>>(DEFAULT_WEBHOOKS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`no webhooks found from ${DEFAULT_WEBHOOKS_DIR}`)
      return
    }

    for (const middleware of middlewares) {
      for (const client of this.clients) {
        const [pattern, handle] = middleware(client)
        if (!pattern.startsWith(WEBHOOK_BASE_PATH)) {
          this.logger.warn(`Invalid webhook pattern: ${pattern}`)
          continue
        }

        this.httpServer.post(pattern, handle)
      }
    }
  }

  /** 加载文件 */
  protected async load<R>(dir: string): Promise<R[]> {
    const SUPPORTS_EXT = ['.js', '.ts', '.mjs', '.cjs']
    const EXCLUDES_EXT = ['.d.ts']

    const cwd = path.join(__dirname, dir)
    const files = await fs.promises.readdir(cwd)
    const promises = files.map(async (file) => {
      let absPath = path.join(cwd, file)

      const stat = await fs.promises.stat(absPath)
      if (stat.isDirectory()) {
        const entries = SUPPORTS_EXT.map((ext) => path.join(absPath, `index${ext}`))
        const entry = entries.find((file) => fs.existsSync(file))

        if (entry) {
          absPath = entry
        }
      }

      if (EXCLUDES_EXT.some((ext) => absPath.endsWith(ext))) {
        return
      }

      if (!SUPPORTS_EXT.some((ext) => absPath.endsWith(ext))) {
        return
      }

      this.logger.debug(`Load "${path.relative(__dirname, absPath)}" file`)
      const { default: module } = await import(absPath)
      return module
    })

    const modules = await Promise.all(promises)
    return modules.filter(Boolean).flat()
  }

  /** 打印帮助文档 */
  protected applyHelpCommand(commands: CommandMiddlewareFactory[]) {
    const helpCommand = command(
      {
        command: '/help',
        description: 'list all commands.',
      },
      async () => {
        const usages = [...commands, helpCommand].map(({ command, description }) => `- ${command} ${description ? `"${description}"` : ''}`)
        const content = `Available commands:\n${usages.join('\n')}`
        return content
      }
    )

    return helpCommand
  }
}
