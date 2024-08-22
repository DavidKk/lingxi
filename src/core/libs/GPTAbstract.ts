import { CoreServiceAbstract } from './CoreServiceAbstract'
import type { ChatClientAbstract } from './ChatClientAbstract'
import type { Context } from '../types'

export interface GPTAbstractContext extends Context {
  client: ChatClientAbstract<any>
}

export abstract class GPTAbstract extends CoreServiceAbstract {
  static GPT_NAME: string
  abstract chat(context: GPTAbstractContext): Promise<string | void>

  public get gptName() {
    return Object.getPrototypeOf(this).constructor.GPT_NAME
  }
}
