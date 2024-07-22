import type { Middleware, MiddlewareNext } from '@/libs/MiddlewareCoordinator'

export function combineMiddlewares<T>(...middlewares: Middleware<T>[]): Middleware<T> {
  return async (context: T, next: MiddlewareNext) => {
    const dispatch = async (index: number): Promise<void> => {
      if (index === middlewares.length) {
        return next()
      }

      const middleware = middlewares[index]
      await middleware(context, () => dispatch(index + 1))
    }

    await dispatch(0)
  }
}
