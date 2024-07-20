export type MiddlewareNext = () => Promise<void> | void

export type Middleware<T> = (context: T, next: MiddlewareNext) => Promise<void> | void
