import { CoreServiceAbstract, type CoreServiceOptions } from './CoreServiceAbstract'

export interface SystemSettings {
  /** 情景定义 */
  instructions?: string
}

export interface GPTSessionOptions extends CoreServiceOptions {
  systemSettings?: SystemSettings
}

export class GPTSession extends CoreServiceAbstract {
  protected readonly ssid: string
  protected _systemSettings: SystemSettings

  constructor(ssid: string, options?: GPTSessionOptions) {
    super()

    this.ssid = ssid
    this._systemSettings = options?.systemSettings || {}
  }

  public get systemSettings() {
    return this._systemSettings
  }

  public set systemSettings(settings) {
    if (typeof settings === 'object' && settings == null) {
      return
    }

    const { instructions } = settings
    if (typeof instructions === 'string') {
      this._systemSettings.instructions = instructions
    }
  }

  public clone() {
    return new GPTSession(this.ssid, {
      systemSettings: this.systemSettings,
    })
  }
}
