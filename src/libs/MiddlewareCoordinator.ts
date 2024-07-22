export type MiddlewareNext = () => Promise<void> | void

export type Middleware<T> = (context: T, next: MiddlewareNext) => Promise<void> | void

export class MiddlewareCoordinator<T> {
  protected middlewares = new Set<Middleware<T>>()

  public use(middleware: Middleware<T>) {
    if (typeof middleware === 'function') {
      this.middlewares.add(middleware)
    }
  }

  public execute(context: T) {
    const stack = this.middlewares.values()

    const next = () => {
      const result = stack.next()
      if (!result.done && result.value) {
        result.value(context, next)
      }
    }

    next()
  }
}
