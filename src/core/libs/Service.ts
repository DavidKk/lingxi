import { SERVER_NAME } from '@/core/constants/conf'
import { Logger } from './Logger'

export interface ServiceOptions {
  name?: string
  logger?: Logger
}

export interface IServerConfiguration {
  loggerGetter: () => Logger
}

const ServerConfiguration: IServerConfiguration = {
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

export abstract class Service {
  static configure(options?: Partial<IServerConfiguration>) {
    const { loggerGetter } = options || {}
    if (typeof loggerGetter === 'function') {
      ServerConfiguration.loggerGetter = loggerGetter
    }
  }

  protected name: string
  protected logger: Logger

  constructor(options?: ServiceOptions) {
    const { name, logger } = options || {}

    this.name = name || 'anonymous'
    this.logger = logger instanceof Logger ? logger : ServerConfiguration.loggerGetter()
  }
}
