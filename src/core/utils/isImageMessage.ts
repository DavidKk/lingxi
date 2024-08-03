import type { GeminiContent } from '@/core/types'

export function isImageMessage(contents: GeminiContent[]) {
  for (const content of contents) {
    for (const part of content.parts) {
      if ('inlineData' in part) {
        return true
      }
    }
  }

  return false
}
