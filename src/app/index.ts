import fs from 'fs'
import path from 'path'
import { combineChatMiddlewares, WeChat, Robot, combineWechatyMiddlewares, combineMiddlewares, command } from '@/core'
import type { WeChatOptions, RobotOptions, MessageMiddleware, RequestMiddleware, QrcodeMiddleware, CommandMiddleware } from '@/core'
import { DEFAULT_COMMANDS, DEFAULT_MENTIONS, DEFAULT_QRCODES, DEFAULT_WEBHOOKS } from './constants/conf'

export interface AppOptions extends WeChatOptions, RobotOptions {
  commands?: string
  mentions?: string
  webhooks?: string
  qrcodes?: string
}

export class App extends WeChat {
  protected robot: Robot
  protected commandDir: string
  protected mentionDir: string
  protected webhookDir: string
  protected qrcodeDir: string

  constructor(options?: AppOptions) {
    super(options)

    const { commands, mentions, webhooks, qrcodes } = options || {}
    this.commandDir = typeof commands === 'string' ? commands : DEFAULT_COMMANDS
    this.mentionDir = typeof mentions === 'string' ? mentions : DEFAULT_MENTIONS
    this.webhookDir = typeof webhooks === 'string' ? webhooks : DEFAULT_WEBHOOKS
    this.qrcodeDir = typeof qrcodes === 'string' ? qrcodes : DEFAULT_QRCODES
    this.robot = new Robot(options)
  }

  public async start() {
    await this.loadQrcode()
    await this.loadCommands()
    await this.loadMentions()
    await this.loadWebhoks()
    this.saveChatHistory()
    await super.start()
  }

  protected async loadWebhoks() {
    const middlewares = await this.load<RequestMiddleware>(this.webhookDir)
    if (!middlewares.length) {
      return
    }

    const wechatyMiddleware = combineWechatyMiddlewares(...middlewares)
    this.apiServer.post('/webhook', wechatyMiddleware(this.wechaty))
  }

  protected async loadMentions() {
    const middlewares = await this.load<MessageMiddleware>(this.mentionDir)
    if (!middlewares.length) {
      return
    }

    const mentionsMiddleware = combineChatMiddlewares(...middlewares)
    this.use('message', mentionsMiddleware(this.robot))
  }

  protected async loadCommands() {
    const middlewares = await this.load<CommandMiddleware>(this.commandDir)
    if (!middlewares.length) {
      return
    }

    const helpCommandMiddleware = this.help(middlewares)
    const commandMiddleware = combineChatMiddlewares(helpCommandMiddleware, ...middlewares)
    this.use('message', commandMiddleware(this.robot))
  }

  protected async loadQrcode() {
    const middlewares = await this.load<QrcodeMiddleware>(this.qrcodeDir)
    if (!middlewares.length) {
      return
    }

    const middleware = combineMiddlewares(...middlewares)
    this.use('qrcode', middleware)
  }

  protected async load<R>(folder: string): Promise<R[]> {
    const commands = path.join(__dirname, folder)
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

  protected saveChatHistory() {
    this.use('message', (context) => {
      const { ssid, user, message } = context
      this.robot.hear(context, ssid, user, message)
    })
  }

  protected help(commands: CommandMiddleware[]) {
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
