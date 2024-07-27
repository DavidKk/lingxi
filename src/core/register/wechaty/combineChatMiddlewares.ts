import type { Robot } from '../../libs/Robot'
import type { MessageMiddleware } from '../../types'
import { combineMiddlewares } from '../../utils/combineMiddlewares'

export function combineChatMiddlewares(...chatMiddlewares: MessageMiddleware[]) {
  return function combinedChatMiddleware(robot: Robot) {
    const middlewares = Object.values(chatMiddlewares).map((fn) => fn(robot))
    return combineMiddlewares(...middlewares)
  }
}
