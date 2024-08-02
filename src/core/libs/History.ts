import { MAX_HISTORY_RECORD } from '../constants/conf'
import { LimitedArray } from './LimitedArray'

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

export interface HistoryOptions {
  maxSize?: number
}

/**
 * 历史记录管理类
 */
export class History {
  /** 存储历史记录的集合 */
  protected records: HistoryRecords
  /** 每个用户历史记录的最大容量 */
  protected maxSize: number

  constructor(options?: HistoryOptions) {
    const { maxSize = MAX_HISTORY_RECORD } = options || {}
    this.records = {}
    this.maxSize = maxSize
  }

  /** 向指定用户的历史记录中添加一条记录 */
  public push(ssid: string, history: HistoryRecord) {
    if (!this.records[ssid]) {
      this.records[ssid] = new LimitedArray(this.maxSize)
    }

    this.records[ssid].push(history)
  }

  /** 获取指定用户的部分历史记录 */
  public slice(ssid: string, start?: number, end?: number) {
    if (!this.records[ssid]) {
      return []
    }

    return this.records[ssid].slice(start, end)
  }

  /** 清除聊天记录 */
  public clear(ssid: string) {
    if (!this.records[ssid]) {
      this.records[ssid] = new LimitedArray(this.maxSize)
    }

    this.records[ssid].clear()
  }

  /** 更新最大聊天记录条数 */
  public updateCapacity(ssid: string, maxSize: number) {
    if (!this.records[ssid]) {
      this.records[ssid] = new LimitedArray(this.maxSize)
    }

    this.records[ssid].updateCapacity(maxSize)
  }
}
