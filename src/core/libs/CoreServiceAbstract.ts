import type { Class } from 'utility-types'
import { withConfigurable, createSingleton } from '../utils'
import { SERVER_NAME } from '../constants/conf'
import { Logger } from './Logger'

export interface CoreServiceOptions {
  name?: string
  logger?: Logger
}

export interface ICoreServiceConfiguration {
  getLogger: () => Logger
}

export abstract class CoreServiceAbstract extends withConfigurable<ICoreServiceConfiguration, Record<never, unknown>>(class {}) {
  protected name: string
  protected logger: Logger

  constructor(options?: CoreServiceOptions) {
    super()

    const { name, logger } = options || {}
    this.name = name || 'anonymous'
    this.logger = logger instanceof Logger ? logger : CoreServiceAbstract.getConfig().getLogger()
  }

  protected initService(Service: Class<CoreServiceAbstract>) {
    return new Service({ name: this.name, logger: this.logger })
  }
}

// 设置默认配置
CoreServiceAbstract.configure({
  getLogger: createSingleton(() => new Logger({ name: SERVER_NAME })),
})
