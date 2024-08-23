import { CoreServiceAbstract, type CoreServiceOptions } from './CoreServiceAbstract'

export type MiddlewareNextResult = Promise<void> | void
export type MiddlewareNext = () => MiddlewareNextResult

export type MiddlewareResult = Promise<void> | void
export type Middleware<T> = (context: T, next: MiddlewareNext) => MiddlewareResult

/** 提取 MiddlewareCoordinator 中的上下文 */
export type ExtractMiddlewareCoordinatorContext<T> = T extends MiddlewareCoordinator<infer A> ? A : never

export interface MiddlewareCoordinatorOptions<T> extends CoreServiceOptions {
  middlewares?: Middleware<T>[]
}

export class MiddlewareCoordinator<T> extends CoreServiceAbstract {
  protected middlewares: Set<Middleware<T>>

  constructor(options?: MiddlewareCoordinatorOptions<T>) {
    super(options)

    const { middlewares = [] } = options || {}
    this.middlewares = new Set<Middleware<T>>(middlewares)
  }

  public get size() {
    return this.middlewares.size
  }

  public use(middleware: Middleware<T>) {
    if (typeof middleware !== 'function') {
      return
    }

    this.middlewares.add(middleware)
  }

  public async execute(context: T) {
    const stack = this.middlewares.values()
    const next = async () => {
      const result = stack.next()
      if (result.done || !result.value) {
        return
      }

      const apply = this.ensureNextCalled(result.value)
      await apply(context, next)
    }

    await next()
  }

  protected ensureNextCalled(middleware: Middleware<T>) {
    return async (context: T, next: MiddlewareNext) => {
      let nextCalled = false

      try {
        await middleware(context, () => {
          nextCalled = true
          return next()
        })
      } finally {
        if (nextCalled) {
          return
        }

        this.logger.debug('Next function was not called in middleware')
      }
    }
  }
}
