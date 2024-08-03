import type { IncomingMessage, ServerResponse } from 'http'
import type { MessageInterface } from 'wechaty/impls'
import type { Logger } from '@/core/libs/Logger'

export interface Context {
  logger: Logger
}

export interface BasicMessageContext extends Context {
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

export interface ImageMessageContext extends BasicMessageContext {
  /** 是否为图片类型 */
  isImageMessage: boolean
  /** 文件类型 */
  mimeType: string
  /** 文件大小 */
  fileSize: number
  /** 内容 */
  content: string
}

export interface TextMessageContext extends BasicMessageContext {
  /** 是否为文本类型 */
  isTextMessage: boolean
  /** 内容 */
  content: string
}

export type MessageContext = ImageMessageContext | TextMessageContext

export interface QrcodeContext extends Context {
  qrcode: string
}

export type ApiRequest = IncomingMessage
export type ApiResponse = ServerResponse & { req: ApiRequest }

export interface RequestContext<T = any> extends Context {
  req: ApiRequest
  res: ApiResponse
  data?: T
}
