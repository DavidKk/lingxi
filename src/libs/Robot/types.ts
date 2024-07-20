import type { MessageInterface } from 'wechaty/impls'
import type { WechatyEventListeners } from 'wechaty/dist/esm/src/schemas/wechaty-events'
import type { MiddlewareStack } from '../MiddlewareStack'

export type EventHandler = WechatyEventListeners
export type EventType = keyof EventHandler

export interface MessageContext {
  messager: MessageInterface
  message: string
}

export interface QrcodeContext {
  qrcode: string
}

export interface MiddlewareStackMap {
  qrcode: MiddlewareStack<QrcodeContext>
  message: MiddlewareStack<MessageContext>
}

export type MiddlewareType = keyof MiddlewareStackMap
