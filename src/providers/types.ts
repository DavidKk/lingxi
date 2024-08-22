import type { HttpRequestContext } from './HttpProvider'
import type { WeChatyMessageContext, WeChatyQrcodeContext, WeChatyReplyMessage, WeChatySayMessage } from './WeChatyProvider'

/** 服务请求上下文 */
export type RequestContext<T = any> = HttpRequestContext<T>

/** 二维码上下文 */
export type QrcodeContext = WeChatyQrcodeContext

/** 消息上下文 */
export type MessageContext = WeChatyMessageContext

/** 聊天消息体 */
export type SayMessage = WeChatySayMessage

/** 回复聊天消息体 */
export type ReplyMessage = WeChatyReplyMessage
