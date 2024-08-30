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
  protected _name: string
  protected logger: Logger

  public get name() {
    return this._name
  }

  constructor(options?: CoreServiceOptions) {
    super()

    const { name, logger } = options || {}

    this._name = name || 'anon'
    this.logger = logger instanceof Logger ? logger : CoreServiceAbstract.getConfig().getLogger()
  }
}

// 设置默认配置
CoreServiceAbstract.configure({
  getLogger: createSingleton(() => new Logger({ name: SERVER_NAME, showTime: true })),
})
