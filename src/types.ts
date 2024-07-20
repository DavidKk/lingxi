import type { MessageInterface } from 'wechaty/impls'
import type { MiddlewareStack } from '@/libs/MiddlewareStack'
import type { Logger } from '@/libs/Logger'

export type MiddlewareNext = () => Promise<void> | void

export type Middleware<T> = (context: T, next: MiddlewareNext) => Promise<void> | void

export interface Context {
  logger: Logger
}

export interface MessageContext extends Context {
  messager: MessageInterface
  message: string
}

export interface QrcodeContext extends Context {
  qrcode: string
}

export interface MiddlewareStackMap {
  qrcode: MiddlewareStack<QrcodeContext>
  message: MiddlewareStack<MessageContext>
}

export type MiddlewareType = keyof MiddlewareStackMap
