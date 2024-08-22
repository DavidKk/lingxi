import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { stringifyDatetime } from '../../utils/stringifyDatetime'
import { ensureFile } from '../../utils/ensureFile'
import { calculateTotalByteLength } from '../../utils/calculateTotalByteLength'
import { M } from '../../constants/size'
import { Logger } from '../Logger'
import { STREAM_RELEASED_EVENT_ACTION, FILE_NAME_FORMATTER, BUFFER_MAX_SIZE, FILE_MAX_SIZE, FILE_MAX_NUMBER } from './constants'

export interface WriterParams {
  /** 输出路径 */
  output: string
}

export interface WriterOptions {
  /** 最大缓存大小 */
  maxBufferSize?: number
  /** 最大文件大小 */
  maxFileSize?: number
  /** 最大文件数 */
  maxFileNumber?: number
  /** 文件后缀，默认为 ".log" */
  fileExt?: string
}

export class Writer {
  /** 日志，saveFile 必须 false 否则死循环 */
  protected logger = new Logger({ showTime: true, saveFile: false })
  /** 事件实例 */
  protected ee = new EventEmitter()
  /** 当前文件日期 */
  protected currentDate: Date = new Date()
  /** 当前文件索引 */
  protected currentIndex = 0
  /** 刷写中，用于加锁，处理多次调用，非多实例 */
  protected flushing = false
  /** 写入流创建中，用于假锁，处理多次创建 */
  protected streamCreating = false
  /** 写入流 */
  protected stream: fs.WriteStream | null = null
  /** 内存缓存 */
  protected buffer: string[] = []
  /** 输出文件路径 */
  protected output: string
  /** 最大文件大小 */
  protected maxFileSize: number
  /** 最大文件数 */
  protected maxFileNumber: number
  /** 最大 BufferSize */
  protected maxBufferSize: number = 1 * M
  /** 文件后缀，默认为 ".log" */
  protected fileExt: string

  /** 当前写入的文件 */
  public get outputDir() {
    return this.output
  }

  constructor(params: WriterParams, options?: WriterOptions) {
    const { output } = params
    const { maxBufferSize = BUFFER_MAX_SIZE, maxFileSize = FILE_MAX_SIZE, maxFileNumber = FILE_MAX_NUMBER, fileExt = '.log' } = options || {}

    this.output = output
    this.maxBufferSize = maxBufferSize
    this.maxFileSize = maxFileSize
    this.maxFileNumber = maxFileNumber
    this.fileExt = fileExt
  }

  /** 写内容 */
  public write(content: string) {
    if (calculateTotalByteLength(this.buffer) >= this.maxBufferSize) {
      this.logger.fail(`buffer size over ${this.maxBufferSize}.`)
      return
    }

    this.buffer.push(content)
    this.logger.debug(`push log to buffer. size: ${content.length}.`)

    // 正在创建流则无需触发后面逻辑
    if (this.streamCreating) {
      this.logger.debug('stream creating, skip write.')
      return
    }

    if (this.stream && (this.shouldCreateNewFileForDate() || this.shouldCreateNewFileForSize())) {
      // 会设 stream 为空
      this.forceReleaseStream()
    }

    // 流不存在则创建流
    if (!this.stream) {
      this.logger.debug(`create new stream.`)

      // 无需等待，只需触发一下即可
      this.createWriteStream()
        .then(() => this.flush())
        .finally(() => (this.streamCreating = false))

      return
    }

    // 触发刷写
    this.flush()
  }

  /** 创建写入流 */
  protected async createWriteStream() {
    this.streamCreating = true

    let shouldCreateNewFile = false
    if (this.stream) {
      if (this.shouldCreateNewFileForDate()) {
        this.logger.debug(`create new stream due to date changed.`)

        // 创建不同日期文件
        this.currentDate = new Date()
        this.currentIndex = 0

        shouldCreateNewFile = true
      }

      if (this.shouldCreateNewFileForSize()) {
        shouldCreateNewFile = true

        // 创建相同日期递增文件
        this.currentIndex++
        this.logger.debug(`create new stream due to size changed.`)
      }

      // 如果有写入流则结束之前的写入流
      if (shouldCreateNewFile) {
        this.forceReleaseStream()
      }
    } else {
      shouldCreateNewFile = true
    }

    // 当前文件绝对可以写入
    const file = this.getFileAbsolutePath()
    // 如果 index 都超过最大文件数则肯定有 BUG
    if (shouldCreateNewFile && (await this.isOverNumber())) {
      this.streamCreating = false
      throw new Error(`The number of files is over ${this.maxFileNumber}.`)
    }

    await ensureFile(file)

    // 创建写入流
    this.stream = fs.createWriteStream(file, { flags: 'a' })
    const handleError = (error: Error) => {
      this.logger.fail(`fail writing to file.\n${error}`)
    }

    const handleFinish = () => {
      this.logger.debug(`file finish.`)
      this.stream = null
    }

    this.stream.on('error', handleError)
    this.stream.on('finish', handleFinish)

    this.streamCreating = false
  }

  /** 刷写内容 */
  protected flush() {
    // 正在写入
    if (this.flushing) {
      this.logger.debug('data flushing, skip flush')
      return
    }

    // 不可写或不存在写入流
    if (!(this.stream && this.stream.writable)) {
      this.logger.debug(`Stream not found or can not write file, skip.`)
      return
    }

    this.flushing = true
    this.logger.debug(`start data flushing`)

    /** 是否达到缓存高位区 */
    let ok = true
    while (true) {
      if (!(this.stream && this.stream.writable)) {
        this.flushing = false
        return
      }

      // 没有缓存内容退出
      if (this.buffer.length === 0) {
        break
      }

      const chunk = this.buffer.join('\n')
      ok = this.stream.write(chunk + '\n')
      if (ok === false) break

      // 清空缓存区
      this.buffer.length = 0
    }

    if (ok) {
      this.endFlush()
      return
    }

    this.stream.once('drain', () => this.endFlush())
  }

  protected endFlush() {
    this.logger.debug('end data flushing')
    this.flushing = false
    if (!this.buffer.length && this.stream) {
      this.stream.end(() => {
        this.stream = null
        this.emitNext(STREAM_RELEASED_EVENT_ACTION)
      })
    }
  }

  /** 强制释放流 */
  protected forceReleaseStream() {
    if (!this.stream) {
      return
    }

    this.logger.debug(`force release stream`)

    // 丢弃流即可无需等待
    this.stream.end()
    this.stream = null

    this.emitNext(STREAM_RELEASED_EVENT_ACTION)
  }

  /** 等待下一次流释放 */
  public async waitNextStreamReleased() {
    await this.waitForNext(STREAM_RELEASED_EVENT_ACTION)
    this.logger.debug(`stream released`)
  }

  /** 等待下一次事件 */
  protected waitForNext(actionType: string) {
    return new Promise<void>((resolve) => {
      const handler = () => {
        this.ee.removeListener(actionType, handler)
        resolve()
      }

      this.ee.addListener(actionType, handler)
    })
  }

  /** 触发下一次事件 */
  protected emitNext(actionType: string) {
    this.ee.emit(actionType)
  }

  /** 提取文件名中的日期 */
  protected extractDateFromFileName(filename: string) {
    return path.basename(filename).split('.').shift()!
  }

  /** 是否超过限定的文件数 */
  protected async isOverNumber() {
    if (!fs.existsSync(this.output)) {
      return false
    }

    const files = await fs.promises.readdir(this.output)
    return files.length >= this.maxFileNumber
  }

  /** 是否因为日期原因需要创建新文件 */
  protected shouldCreateNewFileForDate() {
    const today = new Date()
    if (this.currentDate.getFullYear() !== today.getFullYear() || this.currentDate.getMonth() !== today.getMonth() || this.currentDate.getDate() !== today.getDate()) {
      return true
    }

    return false
  }

  /** 是否因为大小原因需要创建新文件 */
  protected shouldCreateNewFileForSize() {
    const file = this.getFileAbsolutePath()
    if (!fs.existsSync(file)) {
      return false
    }

    const stats = fs.statSync(file)
    return stats.size >= this.maxFileSize
  }

  /** 获取文件完整路径 */
  protected getFileAbsolutePath() {
    const symbol = this.getFileName()
    const index = this.currentIndex
    const fileName = `${symbol}.${index}${this.fileExt}`
    return path.join(this.output, fileName)
  }

  /** 获取当前的文件名，仅名字部分不包含序号 */
  protected getFileName() {
    const date = new Date()
    return stringifyDatetime(date, FILE_NAME_FORMATTER)
  }
}
