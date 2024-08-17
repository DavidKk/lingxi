import type { WechatyInterface } from 'wechaty/impls'
import type { Middleware, MiddlewareCoordinator } from '@/core/libs/MiddlewareCoordinator'
import type { MessageContext, QrcodeContext, RequestContext } from '@/core/types'
import type { Robot } from '@/core/services/Robot'

export type MessageMiddleware<T extends MessageContext = MessageContext> = (robot: Robot) => Middleware<T>
export type QrcodeMiddleware<T extends QrcodeContext = QrcodeContext> = Middleware<T>

export type WechatMiddlewareRegistry = {
  qrcode: MiddlewareCoordinator<QrcodeContext>
  message: MiddlewareCoordinator<MessageContext>
}

export type RequestMiddleware<T extends RequestContext = RequestContext> = (wechaty: WechatyInterface) => Middleware<T>

export type WebhookMiddlewareRegistry = {
  get: MiddlewareCoordinator<RequestContext>
  post: MiddlewareCoordinator<RequestContext>
}
