import type { LimitedArray } from '../LimitedArray'

/** 历史记录角色 */
export type HistoryRole = 'user' | 'assistant' | 'system'

/** 历史记录类型 */
export type HistoryType = 'text' | 'image'

/** 图片内容 */
export interface HistoryImageContent {
  mimeType: string
  data: string
}

/** 文本内容 */
export type HistoryTextContent = string

/** 历史记录内容 */
export type HistoryContent = HistoryTextContent | HistoryImageContent

/** 历史记录 */
export interface HistoryRecord {
  /** 角色 */
  role: HistoryRole
  /** 用户 */
  user: string
  /** 信息类型 */
  type: HistoryType
  /** 信息 */
  content: HistoryContent
}

/** 历史记录集合 */
export type HistoryRecords = Record<string, LimitedArray<HistoryRecord>>
