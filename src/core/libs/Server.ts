import { Logger } from './Logger'
import type { MiddlewareCoordinator } from './MiddlewareCoordinator'
import { Service, type ServiceOptions } from './Service'

export interface ServerOptions extends ServiceOptions {}

export abstract class Server<T extends Record<string, MiddlewareCoordinator<any>>> extends Service {
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
