import type { ImageMessageContext } from '../types'

export function isImageMessageContext(context: any): context is ImageMessageContext {
  return 'isImageMessage' in context && !!context.isImageMessage
}
