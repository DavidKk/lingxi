import type { MessageInterface } from 'wechaty/impls'
import type { MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import type { Context, MiddlewareRegistry, Satisfies } from '@/core/types'

export interface WeChatyBasicContext extends Context {
  /**
   * 频道号
   * @description
   * 群名或用户名，主要用于区分聊天频道
   */
  ssid: string
  /** 发言用户 */
  user: string
  /** 是否为群聊 */
  isRoom: boolean
  /** 是否为自己的信息 */
  isSelf: boolean
  /** 是否为星标用户 */
  isStar: boolean
  /** 信息对象 */
  messager: MessageInterface
}

/** 图片消息上下文 */
export interface WeChatyImageMessageContext extends WeChatyBasicContext {
  /** 是否为图片类型 */
  isImageMessage: boolean
  /** 文件类型 */
  mimeType: string
  /** 文件大小 */
  fileSize: number
  /** 内容 */
  content: string
}

/** 文本消息上下文 */
export interface WeChatyTextMessageContext extends WeChatyBasicContext {
  /** 是否为文本类型 */
  isTextMessage: boolean
  /** 内容 */
  content: string
}

/** 微信消息上下文 */
export type WeChatyMessageContext = WeChatyImageMessageContext | WeChatyTextMessageContext

/** QRCode 上下文 */
export interface WeChatyQrcodeContext extends Context {
  qrcode: string
}

/** 中间件注册器 */
export type WechatMiddlewareRegistry = Satisfies<
  Partial<MiddlewareRegistry>,
  {
    scanQRCode: MiddlewareCoordinator<WeChatyQrcodeContext>
    chatMessage: MiddlewareCoordinator<WeChatyMessageContext>
  }
>
