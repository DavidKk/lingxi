import { Logger } from './Logger'
import type { MiddlewareCoordinator, ExtractMiddlewareCoordinatorContext, Middleware } from './MiddlewareCoordinator'
import { CoreServiceAbstract, type CoreServiceOptions } from './CoreServiceAbstract'

export interface ContextualServiceOptions extends CoreServiceOptions {}

export abstract class ContextualServiceAbstract<T extends Record<string, MiddlewareCoordinator<any>>> extends CoreServiceAbstract {
  protected middlewares: T

  /** 注册中间件 */
  public use<N extends keyof T>(type: N, middleware: Middleware<ExtractMiddlewareCoordinatorContext<T[N]>>) {
    const middlewareStack = this.middlewares[type]
    middlewareStack.use(middleware)
  }

  /** 创建上下文 */
  protected createContext<P extends Record<string, any>>(passthrough: P) {
    const { logger: inLogger } = passthrough || {}
    const finalLogger = inLogger instanceof Logger ? inLogger : this.logger
    const logger = finalLogger.clone({ traceId: true, saveFile: true })
    return { logger, ...passthrough }
  }
}
