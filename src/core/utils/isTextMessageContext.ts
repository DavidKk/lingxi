import type { TextMessageContext } from '@/core/types'

export function isTextMessageContext(context: any): context is TextMessageContext {
  return 'isTextMessage' in context && !!context.isTextMessage
}
