import { Logger } from './Logger'
import type { MiddlewareCoordinator } from './MiddlewareCoordinator'
import { CoreService, type CoreServiceOptions } from './CoreService'

export interface ContextualServiceOptions extends CoreServiceOptions {}

export abstract class ContextualService<T extends Record<string, MiddlewareCoordinator<any>>> extends CoreService {
  protected middlewares: T

  /** 注册中间件 */
  public use<N extends keyof T>(type: N, middleware: Parameters<T[N]['use']>[0]) {
    const middlewareStack = this.middlewares[type]
    middlewareStack.use(middleware)
  }

  /** 创建上下文 */
  protected createContext<P extends Record<string, any>>(passthrough: P) {
    const { logger: inputLogger } = passthrough || {}
    const logger = inputLogger instanceof Logger ? inputLogger : this.logger.clone({ traceId: true })
    return { logger, ...passthrough }
  }
}
