import type { ServiceOptions } from './Service'
import { Service } from './Service'

export type MiddlewareNext = () => Promise<void> | void

export type Middleware<T> = (context: T, next: MiddlewareNext) => Promise<void> | void

export type MiddlewareCoordinatorOptions = ServiceOptions

export class MiddlewareCoordinator<T> extends Service {
  protected middlewares: Set<Middleware<T>>

  constructor(options?: MiddlewareCoordinatorOptions) {
    super(options)
    this.middlewares = new Set<Middleware<T>>()
  }

  public use(middleware: Middleware<T>) {
    if (typeof middleware === 'function') {
      this.middlewares.add(middleware)
    }
  }

  public async execute(context: T) {
    const stack = this.middlewares.values()
    const next = async () => {
      const result = stack.next()
      if (!result.done && result.value) {
        try {
          await result.value(context, next)
        } catch (error) {
          this.logger.fail(`Error executing middleware stack: ${error}`)
          throw error
        }
      }
    }

    await next()
  }
}
