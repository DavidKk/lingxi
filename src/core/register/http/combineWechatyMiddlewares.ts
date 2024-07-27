import type { WechatyInterface } from 'wechaty/impls'
import type { RequestMiddleware } from '../../types/middleware'
import { combineMiddlewares } from '../../utils/combineMiddlewares'

export function combineWechatyMiddlewares(...wechatyMiddlewares: RequestMiddleware[]) {
  return function wechatyCombinedMiddleware(wechaty: WechatyInterface) {
    const middlewares = Object.values(wechatyMiddlewares).map((fn) => fn(wechaty))
    return combineMiddlewares(...middlewares)
  }
}
