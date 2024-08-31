import type { Middleware, MiddlewareNext } from '@/core/libs/MiddlewareCoordinator'

export function combineMiddlewares<T>(...middlewares: Middleware<T>[]): Middleware<T> {
  return async function combinedMiddleware(context: T, next: MiddlewareNext) {
    async function dispatch(index: number): Promise<void> {
      if (index === middlewares.length) {
        return next()
      }

      const middleware = middlewares[index]
      await middleware(context, () => dispatch(index + 1))
    }

    await dispatch(0)
  }
}
