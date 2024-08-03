import type { ImageMessageContext } from '@/core/types'

export function isImageMessageContext(context: any): context is ImageMessageContext {
  return 'isImageMessage' in context && !!context.isImageMessage
}
