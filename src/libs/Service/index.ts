import { Logger } from '@/libs/Logger'
import { SERVER_NAME } from '@/constants/conf'

export interface ServiceOptions {
  logger?: Logger
}

export class Service {
  protected logger: Logger

  constructor(options?: ServiceOptions) {
    const { logger } = options || {}
    this.logger = logger instanceof Logger ? logger : new Logger({ name: SERVER_NAME })
  }
}
