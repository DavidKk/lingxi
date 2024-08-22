import type { LimitedArray } from '../LimitedArray'

/** 历史记录角色 */
export type HistoryRole = 'human' | 'system'

/** 历史记录类型 */
export type HistoryType = 'text' | 'image'

export interface HistoryImageContent {
  mimeType: string
  data: string
}

export type HistoryContent = string | HistoryImageContent

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
