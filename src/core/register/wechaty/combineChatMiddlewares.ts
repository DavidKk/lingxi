import type { Robot } from '@/core/services/Robot'
import type { MessageMiddleware } from '@/core/types'
import { combineMiddlewares } from '@/core/utils/combineMiddlewares'

export function combineChatMiddlewares(...chatMiddlewares: MessageMiddleware[]) {
  return function combinedChatMiddleware(robot: Robot) {
    const middlewares = Object.values(chatMiddlewares).map((fn) => fn(robot))
    return combineMiddlewares(...middlewares)
  }
}
