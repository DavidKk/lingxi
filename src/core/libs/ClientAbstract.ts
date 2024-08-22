import type { MiddlewareRegistry } from '../types/middleware'
import { ContextualServiceAbstract } from './ContextualServiceAbstract'

export abstract class ClientAbstract<T extends Partial<MiddlewareRegistry>> extends ContextualServiceAbstract<T> {
  abstract start(): Promise<void>
  abstract stop(): Promise<void>
  abstract restart(): Promise<void>
}
