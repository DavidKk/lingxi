import { WechatyBuilder, ScanStatus } from 'wechaty'
import type { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import type { WechatyEventListenerHeartbeat } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import { Logger } from '../Logger'
import { MiddlewareStack } from '../MiddlewareStack'
import { WECHAT_ROBOT_OPTIONS } from './constants/conf'
import type { EventType, EventHandler, MessageContext, QrcodeContext, MiddlewareStackMap, MiddlewareType } from './types'

export class Robot {
  protected logger: Logger
  protected robot: WechatyInterface
  protected middlewares: MiddlewareStackMap

  constructor() {
    this.logger = new Logger()
    this.robot = WechatyBuilder.build(WECHAT_ROBOT_OPTIONS)
    this.middlewares = {
      qrcode: new MiddlewareStack<QrcodeContext>(),
      message: new MiddlewareStack<MessageContext>(),
    }

    this.listen('scan', this.handleScan.bind(this))
    this.listen('login', this.handleLogin.bind(this))
    this.listen('logout', this.handleLogout.bind(this))
    this.listen('heartbeat', this.handleHeartBeat.bind(this))
    this.listen('message', this.handleMessage.bind(this))
  }

  public use<T extends MiddlewareType>(type: T, middleware: Parameters<MiddlewareStackMap[T]['use']>[0]) {
    const middlewareStack = this.middlewares[type]
    middlewareStack.use(middleware as any)
  }

  public async start() {
    try {
      this.logger.info('Robot start...')
      await this.robot.start()
      this.logger.ok('Robot has started.')
    } catch (error) {
      this.logger.fail(`Robot start failed: ${error}`)
    }
  }

  public async stop() {
    if (!this.robot) {
      return
    }

    this.logger.info('Robot stop.')
    await this.robot.stop()
    this.logger.ok('Robot has shutdown.')
  }

  protected listen<E extends EventType>(event: E, handler: EventHandler[E]) {
    this.robot.on(event, handler)
    return () => this.robot.off(event, handler)
  }

  protected handleMessage(messager: MessageInterface) {
    this.logger.info(`received message: ${messager}`)
    const message = messager.text()
    const context = { message, messager }
    this.middlewares.message.execute(context)
  }

  protected handleScan(qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      this.logger.info(`wait for user scan qrcode. qrcode: ${qrcode}`)
      return
    }

    if (status === ScanStatus.Cancel) {
      this.logger.info('user canceled.')
      return
    }

    if (status === ScanStatus.Confirmed) {
      this.logger.info('user confired.')
      return
    }

    if (status === ScanStatus.Scanned) {
      this.logger.info('user scanned.')
      return
    }

    if (status === ScanStatus.Unknown) {
      this.logger.info('unknown error.')
      return
    }
  }

  protected handleLogin(user: ContactSelfInterface) {
    this.logger.info(`${user} logined.`)
  }

  protected handleLogout(user: ContactSelfInterface) {
    this.logger.info(`${user} logout.`)
  }

  protected handleHeartBeat(data: WechatyEventListenerHeartbeat) {
    this.logger.info(`ping wechat. data:${JSON.stringify(data)}`)
  }
}
