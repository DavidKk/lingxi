import path from 'path'
import { dateToStringWithTimezone } from '../../utils'
import { CoreServiceAbstract } from '../CoreServiceAbstract'
import { LimitedArray } from '../LimitedArray'
import { Writer } from '../Writer'
import { HISTORY_MAX_RECORD, HISTORY_BUFFER_MAX_SIZE, HISTORY_FILE_MAX_SIZE, HISTORY_FILE_MAX_NUMBER, HISTORY_FILE_PATH } from './constants'
import type { HistoryRecord, HistoryRecords } from './types'

export interface HistoryOptions {
  maxSize?: number
  /** 是否保存为文件 */
  saveFile?: boolean
}

/**
 * 历史记录管理类
 */
export class History extends CoreServiceAbstract {
  /** 存储历史记录的集合 */
  protected records: HistoryRecords
  /** 每个用户历史记录的最大容量 */
  protected maxSize: number
  /** 是否保存文件 */
  protected saveFile: boolean
  /** Writer 实例 */
  protected writers: Record<string, Writer>

  constructor(options?: HistoryOptions) {
    super()

    const { maxSize = HISTORY_MAX_RECORD, saveFile = true } = options || {}
    this.records = {}
    this.maxSize = maxSize
    this.saveFile = saveFile
    this.writers = {}
  }

  /** 获取指定用户的历史记录个数 */
  public count(ssid: string) {
    if (!(this.records[ssid] instanceof LimitedArray)) {
      return 0
    }

    const records = this.records[ssid]
    return records.length
  }

  /** 向指定用户的历史记录中添加一条记录 */
  public push(ssid: string, history: HistoryRecord) {
    if (!this.records[ssid]) {
      this.records[ssid] = new LimitedArray(this.maxSize)
    }

    this.records[ssid].push(history)

    // 将历史记录写入文件
    this.writeHistoryToFile(ssid, history)
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

  /** 将聊天记录写入文件 */
  protected writeHistoryToFile(ssid: string, history: HistoryRecord) {
    if (!this.saveFile) {
      return
    }

    const time = dateToStringWithTimezone(new Date())
    const recordStr = JSON.stringify({ ...history, time })
    this.getWriter(ssid)?.write(recordStr)
  }

  /** 获取聊天记录写手 */
  protected getWriter(ssid: string) {
    if (this.writers[ssid]) {
      return this.writers[ssid]
    }

    const output = path.join(HISTORY_FILE_PATH, ssid)
    const writer = new Writer(
      { output },
      {
        maxFileSize: HISTORY_FILE_MAX_SIZE,
        maxFileNumber: HISTORY_FILE_MAX_NUMBER,
        maxBufferSize: HISTORY_BUFFER_MAX_SIZE,
      }
    )

    this.writers[ssid] = writer
    return writer
  }
}
