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
import type { CommandMiddlewareFactory, ChatMiddlewareFactory } from './registries/chatRegistry'
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

export interface AppOptions {
  commands?: string
  mentions?: string
  webhooks?: string
}

export class App extends Telepathy<MiddlewareRegistry, Notifier, Gpts> {
  protected commandDir: string
  protected mentionDir: string
  protected webhookDir: string

  protected httpServer: HttpProvider
  protected commands: string[]

  constructor(options?: AppOptions) {
    super()

    const { commands, mentions, webhooks } = options || {}

    this.httpServer = new HttpProvider({ logger: this.logger })
    this.commands = []

    this.commandDir = typeof commands === 'string' ? commands : DEFAULT_COMMANDS_DIR
    this.mentionDir = typeof mentions === 'string' ? mentions : DEFAULT_MENTIONS_DIR
    this.webhookDir = typeof webhooks === 'string' ? webhooks : DEFAULT_WEBHOOKS_DIR
  }

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
    await this.httpServer.stop()
    await super.stop()
  }

  /** 重启 */
  public async restart() {
    await this.httpServer.stop()
    await this.httpServer.serve()
    await super.restart()
  }

  /** 注册发送二维码扫描消息 */
  @Once
  protected applySendScanQRcode() {
    const notifiers = this.notifiers.filter((notifier) => !notifier.supports.includes('html'))
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

  /** 加载聊天文件 */
  protected async loadMentions() {
    const middlewares = await this.load<ChatMiddlewareFactory>(this.mentionDir)
    if (!middlewares.length) {
      this.logger.warn(`no mentions found from ${this.mentionDir}`)
      return
    }

    const gpt = this.getGPT()
    const mentionsMiddleware = combineChatMiddlewares(...middlewares)
    for (const client of this.clients) {
      const payload = { client, gpt }
      client.use('chatMessage', mentionsMiddleware(payload))
    }

    this.logger.info(`Load ${middlewares.length} mentions.`)
  }

  /** 加载指令文件 */
  protected async loadCommands(cwd = this.commandDir) {
    const middlewares = await this.load<CommandMiddlewareFactory>(cwd)
    if (!middlewares.length) {
      this.logger.warn(`no commands found from ${cwd}`)
      return
    }

    const helpCommandMiddleware = this.help(middlewares)
    const commands = [helpCommandMiddleware, ...middlewares]

    const gpt = this.getGPT()
    const commandMiddleware = combineChatMiddlewares(...commands)
    for (const client of this.clients) {
      const payload = { client, gpt }
      client.use('chatMessage', commandMiddleware(payload))
    }

    commands.forEach((module) => this.commands.push(module.command))
    this.logger.info(`Load ${commands.length} commands.`)
  }

  /** 加载 webhooks 文件 */
  protected async loadWebhoks(cwd = this.webhookDir) {
    const middlewares = await this.load<HttpMiddleware<SayMessage>>(cwd)
    if (!middlewares.length) {
      this.logger.warn(`no webhooks found from ${cwd}`)
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

    this.logger.info(`Load ${middlewares.length} webhooks.`)
  }

  /** 加载文件 */
  protected async load<R>(cwd: string): Promise<R[]> {
    const commands = path.join(__dirname, cwd)
    const files = await fs.promises.readdir(commands)
    const promises = files.map(async (file) => {
      if (file.endsWith('.d.ts')) {
        return
      }

      if (file.endsWith('.js') || file.endsWith('.ts')) {
        const { default: module } = await import(path.join(commands, file))
        return module
      }
    })

    const modules = await Promise.all(promises)
    return modules.filter(Boolean)
  }

  /** 打印帮助文档 */
  protected help(commands: CommandMiddlewareFactory[]) {
    const helpCommand = command(
      {
        command: '/help',
        description: 'list all commands.',
      },
      async (context) => {
        const { isRoom, messager } = context
        const shouldReply = isRoom ? await messager.mentionSelf() : true
        if (!shouldReply) {
          return
        }

        const usages = [...commands, helpCommand].map(({ command, description }) => `- ${command} ${description ? `"${description}"` : ''}`)
        const content = `Available commands:\n${usages.join('\n')}`
        return content
      }
    )

    return helpCommand
  }
}
