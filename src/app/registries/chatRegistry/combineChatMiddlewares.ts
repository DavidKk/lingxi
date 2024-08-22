import { combineMiddlewares } from '@/core/utils'
import type { ChatMiddlewareFactory, ChatMiddlewareFactoryPayload } from './types'

export function combineChatMiddlewares(...chatMiddlewares: ChatMiddlewareFactory[]) {
  return function combinedChatMiddleware(payload: ChatMiddlewareFactoryPayload) {
    const middlewares = Object.values(chatMiddlewares).map((fn) => fn(payload))
    return combineMiddlewares(...middlewares)
  }
}
