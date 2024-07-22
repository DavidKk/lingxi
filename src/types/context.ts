import type { MessageInterface } from 'wechaty/impls'
import type { Logger } from '@/libs/Logger'

export interface Context {
  logger: Logger
}

export interface MessageContext extends Context {
  self: boolean
  user: string
  message: string
  messager: MessageInterface
}

export interface QrcodeContext extends Context {
  qrcode: string
}
