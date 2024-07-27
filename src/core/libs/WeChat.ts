import { WechatyBuilder, ScanStatus, type WechatyOptions } from 'wechaty'
import type { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import { Logger } from '../libs/Logger'
import { MiddlewareCoordinator } from '../libs/MiddlewareCoordinator'
import { WECHATY_DEFAULT_OPTIONS } from '../constants/conf'
import type { MessageContext, QrcodeContext, WechatMiddlewareRegistry, EventType, EventHandler } from '../types'
import { Server, type ServerOptions } from './Server'
import { ApiServer } from './ApiServer'

export interface WeChatOptions extends ServerOptions {
  wechatyOptions: WechatyOptions
  apiServer?: ApiServer
}

export class WeChat extends Server<WechatMiddlewareRegistry> {
  protected wechaty: WechatyInterface
  protected wechatyOptions: WechatyOptions
  protected apiServer: ApiServer

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
    super()

    const { apiServer, wechatyOptions = WECHATY_DEFAULT_OPTIONS } = options || {}
    this._isScanQrcode = false
    this._isLoginning = false
    this._isStarted = false

    this.logger = new Logger({ showTime: true })
    this.wechaty = WechatyBuilder.build(wechatyOptions)
    this.apiServer = apiServer instanceof ApiServer ? apiServer : new ApiServer({ logger: this.logger })

    this.middlewares = {
      qrcode: new MiddlewareCoordinator<QrcodeContext>({ name: 'QrcodeMiddleware' }),
      message: new MiddlewareCoordinator<MessageContext>({ name: 'MessageMiddleware' }),
    }

    this.listen('scan', this.handleScan.bind(this))
    this.listen('login', this.handleLogin.bind(this))
    this.listen('logout', this.handleLogout.bind(this))
    this.listen('heartbeat', this.handleHeartBeat.bind(this))
    this.listen('error', this.handleError.bind(this))
    this.listen('message', this.handleMessage.bind(this))
  }

  /** 启动服务 */
  public async start() {
    try {
      this.logger.info('WeChat start...')
      await this.apiServer.serve()
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
    await this.apiServer.stop()
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

  /** 处理聊天事件 */
  protected async handleMessage(messager: MessageInterface) {
    const message = messager.text()
    const room = messager.room()
    const talker = messager.talker()
    const user = talker.name()
    const isSelf = talker.self()
    const isStar = !!talker.star()
    const isRoom = !!room
    const ssid = room?.id || talker.id
    const context = this.createContext({ ssid, isRoom, isSelf, isStar, user, message, messager })
    const { logger } = context

    if (!ssid) {
      logger.debug('Ssid does not exist, skip.')
      return
    }

    if (!message) {
      logger.debug('Message is empty, skip.')
      return
    }

    logger.info(`Received message is ${message} by ${user}(${ssid}).`)
    this.middlewares.message.execute(context)
  }

  /** 处理登录时二维码扫描事件 */
  protected handleScan(qrcode: string, status: ScanStatus) {
    const context = this.createContext({ qrcode })
    const { logger } = context

    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      logger.info(`wait for user scan qrcode. qrcode: ${qrcode}`)
      this.middlewares.qrcode.execute(context)
      this._isLoginning = true
      return
    }

    if (status === ScanStatus.Scanned) {
      logger.info('user scanned.')
      this._isScanQrcode = true
      return
    }

    if (status === ScanStatus.Confirmed) {
      logger.info('user confired.')
      this._isLoginning = false
      return
    }

    if (status === ScanStatus.Cancel) {
      logger.info('user canceled.')
      this._isLoginning = false
      return
    }

    if (status === ScanStatus.Unknown) {
      logger.fail('unknown error.')
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
    this.logger.fail(`Some errors occurred in Wechaty\n${error}`, { verbose: false })
  }

  /** 处理心跳事件 */
  protected async handleHeartBeat() {
    const status = this.status
    this.logger.debug(`ping wechat. status: ${JSON.stringify(this.status)}`)

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
