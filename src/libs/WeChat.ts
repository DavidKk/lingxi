import { WechatyBuilder, ScanStatus, type WechatyOptions } from 'wechaty'
import type { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import type { WechatyEventListenerHeartbeat } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import { Logger } from '@/libs/Logger'
import { MiddlewareCoordinator } from '@/libs/MiddlewareCoordinator'
import { WECHATY_DEFAULT_OPTIONS } from '@/constants/conf'
import type { MessageContext, QrcodeContext, MiddlewareRegistry, MiddlewareType, EventType, EventHandler } from '@/types'

export interface WeChatOptions {
  wechatyOptions: WechatyOptions
}

export class WeChat {
  protected logger: Logger
  protected wechaty: WechatyInterface
  protected wechatyOptions: WechatyOptions
  protected middlewares: MiddlewareRegistry

  protected _isScanQrcode: boolean
  protected _isLoginning: boolean
  protected _isStarted: boolean

  public get status() {
    const started = this._isStarted
    const logined = !!this.wechaty?.isLoggedIn
    const loginning = this._isLoginning
    return { started, logined, loginning }
  }

  constructor(options?: WeChatOptions) {
    const { wechatyOptions = WECHATY_DEFAULT_OPTIONS } = options || {}
    this._isScanQrcode = false
    this._isLoginning = false
    this._isStarted = false

    this.logger = new Logger({ showTime: true })
    this.wechaty = WechatyBuilder.build(wechatyOptions)

    this.middlewares = {
      qrcode: new MiddlewareCoordinator<QrcodeContext>(),
      message: new MiddlewareCoordinator<MessageContext>(),
    }

    this.listen('scan', this.handleScan.bind(this))
    this.listen('login', this.handleLogin.bind(this))
    this.listen('logout', this.handleLogout.bind(this))
    this.listen('heartbeat', this.handleHeartBeat.bind(this))
    this.listen('error', this.handleError.bind(this))
    this.listen('message', this.handleMessage.bind(this))
  }

  /** 注册中间件 */
  public use<T extends MiddlewareType>(type: T, middleware: Parameters<MiddlewareRegistry[T]['use']>[0]) {
    const middlewareStack = this.middlewares[type]
    middlewareStack.use(middleware as any)
  }

  /** 启动服务 */
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

  /** 关闭 */
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

  /** 重启 */
  public async restart() {
    this.logger.info('WeChat restart.')

    await this.wechaty.reset()
    await this.start()
  }

  /** 创建上下文 */
  protected createContext<T extends Record<string, any>>(passthrough: T) {
    const logger = this.logger
    return { logger, ...passthrough }
  }

  /** 处理聊天事件 */
  protected async handleMessage(messager: MessageInterface) {
    const message = messager.text()
    const room = messager.room()
    const talker = messager.talker()
    const user = talker.name()
    const isSelf = talker.self()
    const isRoom = !!room
    const ssid = room?.id || talker.id

    if (!ssid) {
      this.logger.warn('Ssid does not exist, skip.')
      return
    }

    if (!message) {
      this.logger.warn('Message is empty, skip.')
      return
    }

    this.logger.info(`Received message is ${message} by ${user} #${ssid}.`)

    const context = this.createContext({ ssid, isRoom, isSelf, user, message, messager })
    this.middlewares.message.execute(context)
  }

  /** 处理登录时二维码扫描事件 */
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
      this.logger.fail('unknown error.')

      this._isLoginning = false
      return
    }
  }

  /** 处理登录后事件 */
  protected async handleLogin(user: ContactSelfInterface) {
    this.logger.info(`${user} logined.`)

    this._isLoginning = false
  }

  /** 处理退出事件 */
  protected handleLogout(user: ContactSelfInterface) {
    this.logger.info(`${user} logout.`)
  }

  /** 处理错误事件 */
  protected handleError(error: Error) {
    this.logger.fail(`Some errors occurred in Wechaty\n${error}`)
  }

  /** 处理心跳事件 */
  protected async handleHeartBeat() {
    const status = this.status
    this.logger.info(`ping wechat. status: ${JSON.stringify(this.status)}`)

    if (status.started && !status.logined && !status.loginning) {
      this._isScanQrcode = false
      await this.restart()
    }
  }

  /** 监听事件 */
  protected listen<E extends EventType>(event: E, handler: EventHandler[E]) {
    this.wechaty.on(event, handler)
    return () => this.wechaty.off(event, handler)
  }
}
