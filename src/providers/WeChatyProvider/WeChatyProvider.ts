import { ScanStatus, WechatyBuilder } from 'wechaty'
import * as PUPPET from 'wechaty-puppet'
import type { WechatyOptions } from 'wechaty'
import type { ContactInterface, ContactSelfInterface, MessageInterface, WechatyInterface } from 'wechaty/impls'
import type { WechatyEventListeners } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import type { FileBox } from 'file-box'
import { MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import { ChatClientAbstract, type ChatClientAbstractMessage } from '@/core/libs/ChatClientAbstract'
import type { ContextualServiceOptions } from '@/core/libs/ContextualServiceAbstract'
import { format, stringifyBytes, isYes, stringifyLength } from '@/core/utils'
import { MAX_FILE_SIZE } from '@/core/constants/conf'
import type { Yes } from '@/core/types'
import { isFileBox, isImageMessageContext, isTextMessageContext, replyText, sendFile, sendText } from './utils'
import { WECHATY_DEFAULT_OPTIONS } from './constants'
import type { WechatMiddlewareRegistry, WeChatyImageMessageContext, WeChatyMessageContext, WeChatyQrcodeContext, WeChatyTextMessageContext } from './types'

export interface WeChatySayMessage extends ChatClientAbstractMessage {
  star?: Yes
  alias?: string
}

export interface WeChatyReplyMessage extends Omit<ChatClientAbstractMessage, 'content'> {
  shouldReply?: Yes
  content: string | FileBox | FileBox[] | false | undefined
}

export interface WeChatyProviderOptions extends ContextualServiceOptions {
  wechatyOptions?: WechatyOptions
}

export class WeChatyProvider extends ChatClientAbstract<WechatMiddlewareRegistry> {
  protected wechaty: WechatyInterface
  protected wechatyOptions: WechatyOptions
  protected isScanQrcode = false

  public get status() {
    const status = super.status
    const logined = this.wechaty?.isLoggedIn
    return { ...status, logined }
  }

  constructor(options?: WeChatyProviderOptions) {
    super()

    const { wechatyOptions = WECHATY_DEFAULT_OPTIONS } = options || {}
    this.wechaty = WechatyBuilder.build(wechatyOptions)

    this.middlewares = {
      scanQRCode: new MiddlewareCoordinator<WeChatyQrcodeContext>({ name: 'QrcodeMiddleware' }),
      chatMessage: new MiddlewareCoordinator<WeChatyMessageContext>({ name: 'MessageMiddleware' }),
    }

    this.mounted()
  }

  protected mounted() {
    this.listen('scan', this.onScan.bind(this))
    super.mounted()
  }

  /** 发送消息 */
  public async say<T>(_: WeChatyMessageContext, payload: T & WeChatySayMessage) {
    const { star, alias, message } = payload
    if (star) {
      await this.sayToStar(message)
      return
    }

    if (alias) {
      await this.sayToAlias(alias, message)
      return
    }

    throw new Error('No alias or star provided.')
  }

  /** 回复消息 */
  public async reply<T>(context: WeChatyMessageContext, payload: T & WeChatyReplyMessage) {
    if (!(await this.shouldReply(context))) {
      this.logger.debug('In chat room, but not mention me, skip mention.')
      return
    }

    const { shouldReply, content } = payload

    // 批量发送文件
    if (Array.isArray(content)) {
      const files = content.filter((file) => isFileBox(file))
      for (const file of files) {
        await sendFile(context, file)
      }

      return
    }

    // 发送文件
    if (isFileBox(content)) {
      await sendFile(context, content)
      return
    }

    // 发送文字内容
    if (typeof content === 'string') {
      let replied = false
      if (isYes(shouldReply)) {
        replied = await replyText(context, content)
      }

      if (replied === false) {
        await sendText(context, content)
      }

      return
    }

    // 处理不支持
    this.logger.fail(`Unknown content reply message fail. content: ${content}.`)
  }

  /** 是否应该回复 */
  public async shouldReply(context: WeChatyMessageContext) {
    const { isRoom, messager } = context
    if (isRoom && !(await messager.mentionSelf())) {
      return false
    }

    return true
  }

  /** 与所有星标好友聊天 */
  protected async sayToStar(message: string) {
    const contacts = await this.wechaty.Contact.findAll()
    if (!contacts.length) {
      this.logger.warn(`Can not find any contacts.`)
      return
    }

    const stars = contacts.filter((contact) => contact.star())
    if (!stars) {
      this.logger.warn(`Can not find stared contacts.`)
      return
    }

    const names = stars.map((contact) => contact.name())
    this.logger.info(`Say to ${names}: ${message}`)

    const senders = stars.map((contact) => contact.say(message))
    const results = await Promise.allSettled(senders)

    for (const index in results) {
      const name = names[index]
      const result = results[index]
      if (result.status === 'fulfilled') {
        this.logger.ok(`Say to ${name} successed.`)
      } else {
        this.logger.fail(`Say to ${name} failed: ${result.reason}`)
      }
    }
  }

  /** 与指定备注好友聊天 */
  protected async sayToAlias(alias: string, message: string) {
    const contacts = await this.wechaty.Contact.findAll()
    if (!contacts.length) {
      this.logger.warn(`Can not find any contacts.`)
      return
    }

    let matchContact: ContactInterface | undefined
    for (const contact of contacts) {
      if ((await contact.alias()) === alias) {
        matchContact = contact
        break
      }
    }

    if (typeof matchContact === 'undefined') {
      this.logger.warn(`Can not find contact by alias: ${alias}.`)
      return
    }

    this.logger.info(`Say to ${alias}: ${message}`)

    await matchContact.say(message)
    this.logger.ok(`Say to ${alias} successed.`)
  }

  /** 聆听聊天日志 */
  public hear(context: WeChatyMessageContext) {
    if (isTextMessageContext(context)) {
      const { ssid, user, content, logger } = context
      if (!content) {
        logger.debug('Message is empty, skip.')
        return
      }

      logger.info(`Heard "${user}" said "${content}"`)
      this.history.push(ssid, { role: 'user', type: 'text', user, content })
      return
    }

    if (isImageMessageContext(context)) {
      const { ssid, user, mimeType, content: data, logger } = context
      if (!data) {
        logger.debug('Message is empty, skip.')
        return
      }

      logger.info(`Heard "${user}" send a image. base64 size: ${stringifyLength(data.length)}.`)

      const content = { mimeType, data }
      this.history.push(ssid, { role: 'assistant', type: 'image', user, content })
      return
    }
  }

  /** 启动服务 */
  public async start() {
    this.logger.info('WeChat start...')

    await this.wechaty.start()
    this.isServing = true

    this.logger.ok('WeChat has started.')
  }

  /** 关闭 */
  public async stop() {
    if (!this.wechaty) {
      return
    }

    this.logger.info('WeChat stop.')
    await this.wechaty.stop()

    this.isServing = false
    this.isScanQrcode = false

    this.logger.ok('WeChat has shutdown.')
  }

  /** 重启 */
  public async restart() {
    this.logger.info('WeChat restart.')

    await this.wechaty.reset()
    await this.start()
  }

  /** 处理聊天事件 */
  protected async onMessage(messager: MessageInterface) {
    const context = await this.createMessageContext(messager)
    if (!context) {
      this.logger.debug('Message context is empty, skip.')
      return
    }

    // 聆听聊天日志
    this.hear(context)

    const { logger } = context
    if (!context.content) {
      logger.debug('Message is empty, skip.')
      return
    }

    if (isImageMessageContext(context)) {
      await this.onImageMessage(context)
      return
    }

    this.onTextMessage(context)
  }

  /** 处理图片信息 */
  protected async onImageMessage(context: WeChatyImageMessageContext) {
    const { user, fileSize, logger } = context
    logger.info(`Received image message by "${user}". size: ${stringifyBytes(fileSize)}.`)

    this.middlewares.chatMessage.execute(context)
  }

  /** 处理文字信息 */
  protected onTextMessage(context: WeChatyTextMessageContext) {
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
    this.middlewares.chatMessage.execute(context)
  }

  /** 处理登录时二维码扫描事件 */
  protected onScan(qrcode: string, status: ScanStatus) {
    const context = this.createContext({ qrcode })

    const { logger } = context
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
      logger.info(`Wait for user scan qrcode. qrcode: ${qrcode}`)

      this.middlewares.scanQRCode.execute(context)
      this.isLoginning = true
      return
    }

    if (status === ScanStatus.Scanned) {
      logger.info('user scanned.')

      this.isScanQrcode = true
      return
    }

    if (status === ScanStatus.Confirmed) {
      logger.info('user confired.')

      this.isLoginning = false
      return
    }

    if (status === ScanStatus.Cancel) {
      logger.info('user canceled.')

      this.isLoginning = false
      return
    }

    if (status === ScanStatus.Unknown) {
      logger.fail('unknown error.')

      this.isLoginning = false
      return
    }
  }

  /** 处理登录后事件 */
  protected onLogin(user: ContactSelfInterface) {
    this.logger.info(`${user} logined.`)
    this.isLoginning = false
  }

  /** 处理退出事件 */
  protected onLogout(user: ContactSelfInterface) {
    this.logger.info(`${user} logout.`)
  }

  /** 处理错误事件 */
  protected onError(error: Error) {
    this.logger.fail(`Some errors occurred in Wechaty\n${error}.`, { verbose: false })
  }

  /** 处理心跳事件 */
  protected async onHeartbeat() {
    this.logger.debug(format(`Ping wechat. status: %j.`, this.status))

    const { started, logined, loginning } = this.status
    if (started && !logined && !loginning) {
      this.isScanQrcode = false
      await this.restart()
    }
  }

  /** 监听事件 */
  protected listen<E extends keyof WechatyEventListeners>(event: E, handler: WechatyEventListeners[E]) {
    this.wechaty.on(event, handler)
    return () => this.wechaty.off(event, handler)
  }

  /** 创建消息上下文 */
  protected async createMessageContext(messager: MessageInterface) {
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

      const imageContext: WeChatyImageMessageContext = { ...meta, ...context }
      return imageContext
    }

    logger.debug('Received text message.')

    const context = await this.createTextContext(messager)
    const textContext: WeChatyTextMessageContext = { ...meta, ...context }
    return textContext
  }

  /** 创建图片上下文 */
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

  /** 创建文本上下文 */
  protected async createTextContext(messager: MessageInterface) {
    const content = await messager.mentionText()
    return { isTextMessage: true, content }
  }
}
