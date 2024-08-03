import { WechatyBuilder, ScanStatus, type WechatyOptions } from 'wechaty'
import * as PUPPET from 'wechaty-puppet'
import type { ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import { Logger } from '@/core/libs/Logger'
import { MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import { format } from '@/core/utils/format'
import { stringifyBytes } from '@/core/utils/stringifyBytes'
import { MAX_FILE_SIZE, WECHATY_DEFAULT_OPTIONS } from '@/core/constants/conf'
import type { MessageContext, QrcodeContext, WechatMiddlewareRegistry, EventType, EventHandler, ImageMessageContext, TextMessageContext } from '@/core/types'
import { Server, type ServerOptions } from './Server'
import { ApiServer } from './ApiServer'
import { isImageMessageContext } from '../utils/wechaty'

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
    const context = await this.createMessageContext(messager)
    if (!context) {
      this.logger.debug('Message context is empty, skip.')
      return
    }

    const { logger } = context
    if (!context.content) {
      logger.debug('Message is empty, skip.')
      return
    }

    if (isImageMessageContext(context)) {
      await this.handleImageMessage(context)
      return
    }

    this.handleTextMessage(context)
  }

  /** 处理图片信息 */
  protected async handleImageMessage(context: ImageMessageContext) {
    const { user, fileSize, logger } = context

    logger.info(`Received image message by "${user}". size: ${stringifyBytes(fileSize)}.`)
    this.middlewares.message.execute(context)
  }

  /** 处理文字信息 */
  protected handleTextMessage(context: TextMessageContext) {
    const { ssid, user, content, logger } = context
    if (!ssid) {
      logger.debug('Ssid does not exist, skip.')
      return
    }

    if (!content) {
      logger.debug('Message is empty, skip.')
      return
    }

    logger.info(`Received message "${content}" by "${user}".`)
    this.middlewares.message.execute(context)
  }

  /** 处理登录时二维码扫描事件 */
  protected handleScan(qrcode: string, status: ScanStatus) {
    const context = this.createContext({ qrcode })
    const { logger } = context

    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      logger.info(`Wait for user scan qrcode. qrcode: ${qrcode}`)
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
    this.logger.fail(`Some errors occurred in Wechaty\n${error}.`, { verbose: false })
  }

  /** 处理心跳事件 */
  protected async handleHeartBeat() {
    const status = this.status
    this.logger.debug(format(`Ping wechat. status: %j.`, this.status))

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

  protected async createMessageContext(messager: MessageInterface): Promise<MessageContext | null> {
    const room = messager.room()
    const talker = messager.talker()
    const messageType = messager.type()
    const user = talker.name()
    const isSelf = talker.self()
    const isStar = !!talker.star()
    const isRoom = !!room
    const ssid = room?.id || talker.id
    const logger = this.logger
    const meta = { ssid, user, isRoom, isSelf, isStar, messager, logger }

    if (messageType === PUPPET.types.Message.Image) {
      logger.debug('Received image message.')
      const context = await this.createImageContext(messager)
      if (!context) {
        logger.warn('Image size is too large, skip.')
        return null
      }

      return { ...meta, ...context } as ImageMessageContext
    }

    logger.debug('Received text message.')
    const context = await this.createTextContext(messager)
    return { ...meta, ...context } as TextMessageContext
  }

  protected async createImageContext(messager: MessageInterface) {
    const image = await messager.toFileBox()
    const mimeType = image.mediaType
    const fileSize = image.size
    if (fileSize > MAX_FILE_SIZE) {
      return false
    }

    const content = await image.toBase64()
    return { isImageMessage: true, mimeType, fileSize, content }
  }

  protected async createTextContext(messager: MessageInterface) {
    const content = await messager.mentionText()
    return { isTextMessage: true, content }
  }
}
