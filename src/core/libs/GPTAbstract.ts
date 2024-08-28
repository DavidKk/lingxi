import { CoreServiceAbstract } from './CoreServiceAbstract'
import type { ChatClientAbstract } from './ChatClientAbstract'
import { GPTSession, type GPTSessionOptions } from './GPTSession'
import type { Context } from '../types'

export interface GPTAbstractContext extends Context {
  client: ChatClientAbstract<any>
}

export abstract class GPTAbstract extends CoreServiceAbstract {
  abstract chat(context: GPTAbstractContext): Promise<string | void>
  static readonly SUPPORT_MODELS: readonly string[] = Object.freeze([])
  public get supportModels(): string[] {
    return Object.getPrototypeOf(this).constructor.SUPPORT_MODELS
  }

  /** 会话 */
  protected sessions = new Map<string, GPTSession>()

  /** 获取会话中的系统配置 */
  public getSessionSystemSettings(ssid: string) {
    const session = this.sessions.get(ssid)!
    if (!session) {
      return null
    }

    return session.systemSettings
  }

  /** 确保拥有会话，如果会话不存在则创建会话 */
  protected ensureSession(ssid: string, options?: GPTSessionOptions) {
    if (this.sessions.has(ssid)) {
      return
    }

    const session = new GPTSession(ssid, options)
    this.sessions.set(ssid, session)
  }
}
