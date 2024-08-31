import fs from 'fs'
import path from 'path'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import { Telepathy } from '@/core/libs/Telepathy'
import type { Middleware, MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import type { ChatClientAbstract } from '@/core/libs/ChatClientAbstract'
import type { MiddlewareRegistry as IMiddlewareRegistry, Satisfies } from '@/core/types'
import { renderQrcodeEmailContent } from '@/core/templates/renderQrcodeEmailContent'
import { SERVER_NAME } from '@/core/constants/conf'
import { Once } from '@/core/decorators/once'
import type { Notifier } from '@/notifiers/types'
import { HttpProvider } from '@/providers/HttpProvider'
import type { MessageContext, QrcodeContext, RequestContext, SayMessage } from '@/providers/types'
import type { Gpts } from '@/services/types'
import { DEFAULT_COMMANDS_DIR, DEFAULT_MENTIONS_DIR, DEFAULT_WEBHOOKS_DIR } from './constants/dir'
import { WEBHOOK_BASE_PATH } from './constants/conf'
import type { HttpMiddleware } from './registries/httpRegistry'
import type { CommandMiddlewareFactory, ChatMiddlewareFactory, ChatMiddlewareFactoryPayload } from './registries/chatRegistry'
import { command, combineChatMiddlewares } from './registries/chatRegistry'

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
    await this.loadWebhooks()
    await this.httpServer.serve()

    this.loadQrcodeScanningNotify()
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

  /** 注册发送二维码扫描消息 */
  @Once
  protected loadQrcodeScanningNotify() {
    const notifiers = this.notifiers.filter((notifier) => notifier.supports.includes('html'))
    for (const notifier of notifiers) {
      this.logger.info(`Register QRcode scanning notifiers: "<Bold:${notifier.name}>"`)
    }

    this.use('scanQRCode', this.createQrcodeMiddleware(notifiers))
    this.logger.debug(`Register <Bold:${notifiers.length}> QRcode scanning notifiers`)
  }

  /** 加载聊天文件 */
  @Once
  protected async loadMentions() {
    const middlewares = await this.load<ChatMiddlewareFactory>(DEFAULT_MENTIONS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`No mentions found from ${DEFAULT_MENTIONS_DIR}`)
      return
    }

    const mentionsMiddlewareFactory = combineChatMiddlewares(...middlewares)
    for (const client of this.clients) {
      const payload = this.createMiddlewareFactoryPayload(client)
      client.use('chatMessage', mentionsMiddlewareFactory(payload))
    }

    this.logger.debug(`Register <Bold:${middlewares.length}> mentions`)
  }

  /** 加载指令文件 */
  @Once
  protected async loadCommands() {
    const middlewares = await this.load<CommandMiddlewareFactory>(DEFAULT_COMMANDS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`No commands found from ${DEFAULT_COMMANDS_DIR}`)
      return
    }

    const helpCommandMiddlewareFactory = this.applyHelpCommand(middlewares)
    const commands = [helpCommandMiddlewareFactory, ...middlewares]
    const commandMiddlewareFactory = combineChatMiddlewares(...commands)

    for (const client of this.clients) {
      const payload = this.createMiddlewareFactoryPayload(client)
      const middlewares = commandMiddlewareFactory(payload)
      client.use('chatMessage', middlewares)
    }

    this.logger.debug(`Register <Bold:${middlewares.length}> commands`)
  }

  /** 加载 webhooks 文件 */
  @Once
  protected async loadWebhooks() {
    const middlewares = await this.load<HttpMiddleware<SayMessage>>(DEFAULT_WEBHOOKS_DIR)
    if (!middlewares.length) {
      this.logger.warn(`No webhooks found from ${DEFAULT_WEBHOOKS_DIR}`)
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

    this.logger.debug(`Register <Bold:${middlewares.length}> webhooks`)
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

      this.logger.debug(`Import "<Bold:${path.relative(__dirname, absPath)}>" file`)
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
        const finalCommands = [...commands, helpCommand]
        const usages = finalCommands.map((item, index) => {
          const No = index + 1
          const { command, usage, description } = item
          return `${No}. ${usage || command} - ${description ? `"${description}"` : ''}`
        })

        return `Available commands:\n${usages.join('\n')}`
      }
    )

    return helpCommand
  }
}
