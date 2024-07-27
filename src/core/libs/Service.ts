import { SERVER_NAME } from '../constants/conf'
import { Logger } from './Logger'

export interface ServiceOptions {
  name?: string
  logger?: Logger
}

export abstract class Service {
  protected name: string
  protected logger: Logger

  constructor(options?: ServiceOptions) {
    const { name, logger } = options || {}

    this.name = name || 'anonymous'
    this.logger = logger instanceof Logger ? logger : new Logger({ name: SERVER_NAME })
  }
}
