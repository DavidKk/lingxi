import type { HistoryImageContent, HistoryRecord, HistoryRole } from '@/core/libs/History/types'
import { GEMINI_API_SERVER_CHAT_PATH, GEMINI_API_SERVER_FLASH_PATH } from './constants'
import type { GeminiChatModel, GeminiContent } from './types'

export function exchangeModelPath(model: GeminiChatModel) {
  switch (model) {
    case 'gemini-pro':
      return GEMINI_API_SERVER_CHAT_PATH
    case 'gemini-1.5-flash':
      return GEMINI_API_SERVER_FLASH_PATH
  }
}

export function convertRecordsToContents(records: HistoryRecord[]): GeminiContent[] {
  return Array.from(
    (function* () {
      for (const record of records) {
        const { role: hRole, type, content } = record
        if (type === 'image' && typeof content === 'object') {
          const part = convertImageToContentPart(content)
          const parts = [part]
          const role = convertRoleToContentRole(hRole)
          yield { role, parts }
        }

        if (type === 'text' && typeof content === 'string') {
          const part = convertTextToContentPart(content)
          const parts = [part]
          const role = convertRoleToContentRole(hRole)
          yield { role, parts }
        }
      }
    })()
  )
}

export function convertImageToContentPart(content: HistoryImageContent) {
  const { mimeType, data } = content
  const inlineData = { mimeType, data }
  return { inlineData }
}

export function convertTextToContentPart(content: string) {
  return { text: content }
}

export function convertRoleToContentRole(role: HistoryRole) {
  switch (role) {
    case 'system':
      return 'model'
    case 'human':
      return 'user'
  }
}

/** 是否为图片信息 */
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
