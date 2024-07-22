import type { MiddlewareStack } from '@/libs/MiddlewareStack'
import type { MessageContext, QrcodeContext } from '@/types'

export type MiddlewareNext = () => Promise<void> | void
export type Middleware<T> = (context: T, next: MiddlewareNext) => Promise<void> | void
export type MessageMiddleware<T extends MessageContext = MessageContext> = Middleware<T>
export type QrcodeMiddleware<T extends QrcodeContext = QrcodeContext> = Middleware<T>

export interface MiddlewareStackMap {
  qrcode: MiddlewareStack<QrcodeContext>
  message: MiddlewareStack<MessageContext>
}

export type MiddlewareType = keyof MiddlewareStackMap
