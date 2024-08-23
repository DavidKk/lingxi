import { CoreServiceAbstract } from './CoreServiceAbstract'
import type { ChatClientAbstract } from './ChatClientAbstract'
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
}
