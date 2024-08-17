import { SERVER_NAME } from '@/core/constants/conf'
import { Logger } from './Logger'
import type { Class } from 'utility-types'

export interface CoreServiceOptions {
  name?: string
  logger?: Logger
}

export interface ICoreServiceConfiguration {
  loggerGetter: () => Logger
}

const CoreServiceConfiguration: ICoreServiceConfiguration = {
  loggerGetter: (() => {
    let root: Logger

    return () => {
      if (!(root instanceof Logger)) {
        root = new Logger({ name: SERVER_NAME })
      }

      return root
    }
  })(),
}

export abstract class CoreService {
  static configure(options?: Partial<ICoreServiceConfiguration>) {
    const { loggerGetter } = options || {}
    if (typeof loggerGetter === 'function') {
      CoreServiceConfiguration.loggerGetter = loggerGetter
    }
  }

  protected name: string
  protected logger: Logger

  constructor(options?: CoreServiceOptions) {
    const { name, logger } = options || {}

    this.name = name || 'anonymous'
    this.logger = logger instanceof Logger ? logger : CoreServiceConfiguration.loggerGetter()
  }

  protected initService(Service: Class<CoreService>) {
    return new Service({ name: this.name, logger: this.logger })
  }
}
