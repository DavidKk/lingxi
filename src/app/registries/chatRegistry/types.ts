import type { ChatClientAbstract } from '@/core/libs/ChatClientAbstract'
import type { GPTAbstract } from '@/core/libs/GPTAbstract'
import type { Middleware } from '@/core/libs/MiddlewareCoordinator'
import type { MessageContext } from '@/providers/types'

export type ChatContext = MessageContext
export type ChatHandleContext = ChatContext & ChatMiddlewareFactoryPayload
export type ChatHandle = (context: ChatHandleContext) => Promise<any> | any

export interface ChatMiddlewareFactoryPayload {
  client: ChatClientAbstract<any>
  gpt?: GPTAbstract
}

export type ChatMiddlewareFactory = (payload: ChatMiddlewareFactoryPayload) => Middleware<ChatContext>
