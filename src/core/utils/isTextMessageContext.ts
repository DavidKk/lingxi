import type { TextMessageContext } from '../types'

export function isTextMessageContext(context: any): context is TextMessageContext {
  return 'isTextMessage' in context && !!context.isTextMessage
}
