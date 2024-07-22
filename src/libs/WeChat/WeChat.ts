import { WechatyBuilder, ScanStatus } from 'wechaty'
import type { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import type { WechatyEventListenerHeartbeat } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import { Logger } from '@/libs/Logger'
import { MiddlewareStack } from '@/libs/MiddlewareStack'
import type { MessageContext, QrcodeContext, MiddlewareStackMap, MiddlewareType } from '@/types'
import { WECHAT_ROBOT_OPTIONS } from './constants/conf'
import type { EventType, EventHandler } from './types'

export class WeChat {
  protected logger: Logger
  protected wechaty: WechatyInterface
  protected middlewares: MiddlewareStackMap

  protected _isScanQrcode: boolean
  protected _isLoginning: boolean
  protected _isStarted: boolean

  public get status() {
    const started = this._isStarted
    const logined = !!this.wechaty?.isLoggedIn
    const loginning = this._isLoginning
    return { started, logined, loginning }
  }

  constructor() {
    this._isScanQrcode = false
    this._isLoginning = false
    this._isStarted = false

    this.logger = new Logger({ showTime: true })
    this.wechaty = WechatyBuilder.build(WECHAT_ROBOT_OPTIONS)
    this.middlewares = {
      qrcode: new MiddlewareStack<QrcodeContext>(),
      message: new MiddlewareStack<MessageContext>(),
    }

    this.listen('scan', this.handleScan.bind(this))
    this.listen('login', this.handleLogin.bind(this))
    this.listen('logout', this.handleLogout.bind(this))
    this.listen('heartbeat', this.handleHeartBeat.bind(this))
    this.listen('error', this.handleError.bind(this))
    this.listen('message', this.handleMessage.bind(this))
  }

  public use<T extends MiddlewareType>(type: T, middleware: Parameters<MiddlewareStackMap[T]['use']>[0]) {
    const middlewareStack = this.middlewares[type]
    middlewareStack.use(middleware as any)
  }

  public async start() {
    try {
      this.logger.info('WeChat start...')
      await this.wechaty.start()
      this.logger.ok('WeChat has started.')

      this._isStarted = true
    } catch (error) {
      this.logger.fail(`WeChat start failed: ${error}`)
    }
  }

  public async stop() {
    if (!this.wechaty) {
      return
    }

    this.logger.info('WeChat stop.')
    await this.wechaty.stop()
    this.logger.ok('WeChat has shutdown.')

    this._isStarted = false
    this._isScanQrcode = false
  }

  public async restart() {
    await this.wechaty.reset()
    await this.start()
  }

  protected listen<E extends EventType>(event: E, handler: EventHandler[E]) {
    this.wechaty.on(event, handler)
    return () => this.wechaty.off(event, handler)
  }

  protected handleMessage(messager: MessageInterface) {
    const message = messager.text()
    const talker = messager.talker()
    const user = talker.name()
    const self = talker.self()

    if (!message) {
      this.logger.warn('Received message is empty, skip')
      return
    }

    this.logger.info(`Received message: ${JSON.stringify({ user, message }, null, 2)}`)
    const context = this.createContext({ self, user, message, messager })
    this.middlewares.message.execute(context)
  }

  protected createContext<T extends Record<string, any>>(passthrough: T) {
    const logger = this.logger
    return { logger, ...passthrough }
  }

  protected handleScan(qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      this.logger.info(`wait for user scan qrcode. qrcode: ${qrcode}`)
      const context = this.createContext({ qrcode })
      this.middlewares.qrcode.execute(context)

      this._isLoginning = true
      return
    }

    if (status === ScanStatus.Scanned) {
      this.logger.info('user scanned.')

      this._isScanQrcode = true
      return
    }

    if (status === ScanStatus.Confirmed) {
      this.logger.info('user confired.')

      this._isLoginning = false
      return
    }

    if (status === ScanStatus.Cancel) {
      this.logger.info('user canceled.')

      this._isLoginning = false
      return
    }

    if (status === ScanStatus.Unknown) {
      this.logger.info('unknown error.')

      this._isLoginning = false
      return
    }
  }

  protected handleLogin(user: ContactSelfInterface) {
    this.logger.info(`${user} logined.`)

    this._isLoginning = false
  }

  protected handleLogout(user: ContactSelfInterface) {
    this.logger.info(`${user} logout.`)
  }

  protected handleError(error: Error) {
    this.logger.fail(error)
  }

  protected async handleHeartBeat(data: WechatyEventListenerHeartbeat) {
    const status = this.status
    this.logger.info(`ping wechat. data: %o${JSON.stringify(data)}. ${JSON.stringify(this.status, null, 2)}`)

    if (status.started && !status.logined && !status.loginning) {
      this._isScanQrcode = false
      await this.restart()
    }
  }
}
