import type { MessageInterface } from 'wechaty/impls'
import type { Logger } from '@/libs/Logger'

export interface Context {
  logger: Logger
}

export interface MessageContext extends Context {
  /**
   * 频道号
   * @description
   * 群名或用户名，主要用于区分聊天频道
   */
  ssid: string
  /** 发言用户 */
  user: string
  /** 内容 */
  message: string
  /** 是否为自己的信息 */
  isSelf: boolean
  messager: MessageInterface
}

export interface QrcodeContext extends Context {
  qrcode: string
}
