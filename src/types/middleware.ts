import type { Middleware, MiddlewareCoordinator } from '@/libs/MiddlewareCoordinator'
import type { MessageContext, QrcodeContext } from '@/types'

export type MessageMiddleware<T extends MessageContext = MessageContext> = Middleware<T>
export type QrcodeMiddleware<T extends QrcodeContext = QrcodeContext> = Middleware<T>

export interface MiddlewareRegistry {
  qrcode: MiddlewareCoordinator<QrcodeContext>
  message: MiddlewareCoordinator<MessageContext>
}

export type MiddlewareType = keyof MiddlewareRegistry
