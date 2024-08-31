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
  static NAME = 'AnonymousService'

  protected _name?: string
  protected logger: Logger

  public get name() {
    if (this._name) {
      return this._name
    }

    return Object.getPrototypeOf(this).constructor.NAME
  }

  constructor(options?: CoreServiceOptions) {
    super()

    const { name, logger } = options || {}
    const configuration = CoreServiceAbstract.getConfig()
    this.logger = logger instanceof Logger ? logger : configuration.getLogger()

    if (name) {
      this._name = name
    }
  }
}

// 设置默认配置
CoreServiceAbstract.configure({
  getLogger: createSingleton(() => new Logger({ name: SERVER_NAME, showTime: true })),
})
