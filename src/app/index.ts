import fs from 'fs'
import path from 'path'
import { combineChatMiddlewares, WeChat, Robot, combineWechatyMiddlewares, combineMiddlewares, command, isTextMessageContext } from '@/core'
import type { WeChatOptions, RobotOptions, MessageMiddleware, RequestMiddleware, QrcodeMiddleware, CommandMiddleware } from '@/core'
import { DEFAULT_COMMANDS_DIR, DEFAULT_MENTIONS_DIR, DEFAULT_QRCODES_DIR, DEFAULT_WEBHOOKS_DIR, WEBHOOK_BASE_PATH } from './constants/conf'
import { trimCommands } from '@/core/utils/trimCommands'

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
  protected commands: string[]

  constructor(options?: AppOptions) {
    super(options)

    const { commands, mentions, webhooks, qrcodes } = options || {}

    this.commandDir = typeof commands === 'string' ? commands : DEFAULT_COMMANDS_DIR
    this.mentionDir = typeof mentions === 'string' ? mentions : DEFAULT_MENTIONS_DIR
    this.webhookDir = typeof webhooks === 'string' ? webhooks : DEFAULT_WEBHOOKS_DIR
    this.qrcodeDir = typeof qrcodes === 'string' ? qrcodes : DEFAULT_QRCODES_DIR

    this.robot = new Robot(options)
    this.commands = []
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
      this.logger.warn(`no webhooks found from ${this.webhookDir}`)
      return
    }

    this.logger.info(`Load ${middlewares.length} webhooks.`)
    const wechatyMiddleware = combineWechatyMiddlewares(...middlewares)
    this.apiServer.post(WEBHOOK_BASE_PATH, wechatyMiddleware(this.wechaty))
  }

  protected async loadMentions() {
    const middlewares = await this.load<MessageMiddleware>(this.mentionDir)
    if (!middlewares.length) {
      this.logger.warn(`no mentions found from ${this.mentionDir}`)
      return
    }

    this.logger.info(`Load ${middlewares.length} mentions.`)
    const mentionsMiddleware = combineChatMiddlewares(...middlewares)
    this.use('message', mentionsMiddleware(this.robot))
  }

  protected async loadCommands() {
    const middlewares = await this.load<CommandMiddleware>(this.commandDir)
    if (!middlewares.length) {
      this.logger.warn(`no commands found from ${this.commandDir}`)
      return
    }

    this.logger.info(`Load ${middlewares.length} commands.`)
    const helpCommandMiddleware = this.help(middlewares)
    const commands = [helpCommandMiddleware, ...middlewares]
    const commandMiddleware = combineChatMiddlewares(...commands)
    this.use('message', commandMiddleware(this.robot))

    commands.forEach((module) => this.commands.push(module.command))
  }

  protected async loadQrcode() {
    const middlewares = await this.load<QrcodeMiddleware>(this.qrcodeDir)
    if (!middlewares.length) {
      this.logger.warn(`no qrcodes found from ${this.qrcodeDir}`)
      return
    }

    this.logger.info(`Load ${middlewares.length} qrcodes.`)
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
      const { content } = context
      if (isTextMessageContext(context)) {
        const trimedCommandMessage = this.trimCommands(content)
        this.robot.hear({ ...context, content: trimedCommandMessage })
        return
      }

      this.robot.hear(context)
    })
  }

  protected trimCommands(message: string) {
    return trimCommands(message, ...this.commands)
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
