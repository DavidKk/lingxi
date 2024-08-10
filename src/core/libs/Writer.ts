import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { stringifyDatetime } from '@/core/utils/stringifyDatetime'
import { LOGGER_FILE_PATH, LOGGER_FILE_MAX_SIZE, LOGGER_FILE_MAX_NUMBER } from '@/core/constants/logger'
import { ensureFile } from '@/core/utils/ensureFile'
import { Logger } from './Logger'
import { promisify } from 'util'

const STREAM_RELEASED_EVENT_ACTION = 'STREAM_RELEASED'
const FILE_NAME_FORMATTER = 'YYYY-MM-DD'

export interface WriterOptions {
  /** 输出文件 */
  output?: string
  /** 最大文件大小 */
  maxFileSize?: number
  /** 最大文件数 */
  maxFileNumber?: number
}

export class Writer {
  /** 日志，saveFile 必须 false 否则死循环 */
  protected logger = new Logger({ showTime: true, saveFile: false })
  /** 事件实例 */
  protected ee = new EventEmitter()
  /** 写入流 */
  protected stream: fs.WriteStream | null = null
  /** 内存缓存 */
  protected buffer: string[] = []
  /** 刷写中，用于加锁，处理多次调用，非多实例 */
  protected flushing = false
  /** 写入流创建中，用于假锁，处理多次创建 */
  protected streamCreating = false
  /** 当前日志文件名称 */
  protected currentFileName: string
  /** 当前日志文件大小 */
  protected currentFileSize: number
  /** 当前文件索引 */
  protected currentFileIndex = 0
  /** 输出文件路径 */
  protected output: string
  /** 最大文件大小 */
  protected maxFileSize: number
  /** 最大文件数 */
  protected maxFileNumber: number
  /** 用于存储计时器 */
  protected releaseTimer: NodeJS.Timeout | null = null
  /** 释放延迟 */
  protected releaseDelay: number

  /** 当前写入的文件 */
  public get outputDir() {
    return this.output
  }

  constructor(options?: WriterOptions) {
    const { output = LOGGER_FILE_PATH, maxFileSize = LOGGER_FILE_MAX_SIZE, maxFileNumber = LOGGER_FILE_MAX_NUMBER } = options || {}

    this.output = output
    this.maxFileSize = maxFileSize
    this.maxFileNumber = maxFileNumber
  }

  /** 写内容 */
  public write(content: string) {
    this.buffer.push(content)
    this.logger.debug(`push log to buffer. size: ${content.length}.`)

    // 正在创建流则无需触发后面逻辑
    if (this.streamCreating) {
      this.logger.debug('stream creating, skip write.')
      return
    }

    // 日期切换或超过大小都需要重新创建文件
    if (this.stream && (this.shouldCreateNewFileForDate(this.currentFileName) || this.shouldCreateNewFileForSize(this.currentFileSize))) {
      this.logger.debug(`create new stream due to date or size changed.`)
      // 清除之前的流
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

  /** 刷写内容 */
  protected flush() {
    if (this.flushing) {
      this.logger.debug('data flushing, skip flush')
      return
    }

    if (!(this.stream && this.stream.writable)) {
      this.logger.warn(`Stream not found or can not write file, skip.`)
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
      // 同步文件大小
      this.currentFileSize += Buffer.byteLength(chunk)
    }

    /** 写入结束流 */
    const finish = () => {
      this.logger.debug('end data flushing')

      this.stream!.end(() => {
        this.logger.debug('stream ended')

        this.flushing = false
        this.stream = null

        this.emitNext(STREAM_RELEASED_EVENT_ACTION)
      })
    }

    if (ok === true) {
      finish()
      return
    }

    this.stream.once('drain', finish)
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

  /** 创建写入流 */
  protected async createWriteStream(): Promise<void> {
    // 如果 index 都超过最大文件数则肯定有 BUG
    if (this.currentFileIndex > this.maxFileNumber) {
      throw new Error(`The number of files is over ${this.maxFileNumber}.`)
    }

    this.streamCreating = true

    const file = this.getFileAbsolutePath(this.currentFileIndex)
    await this.ensureFileWriteable(file)
    this.currentFileName = file

    // 因为日期原因则还原索引
    if (file && this.shouldCreateNewFileForDate(file)) {
      this.currentFileIndex = 0
      return this.createWriteStream()
    }

    // 获取文件大小
    const stats = await fs.promises.stat(file)
    this.currentFileSize = stats.size

    // 是否因为日期原因需要创建新文件, 因为大小原因则需要增加索引
    if (this.shouldCreateNewFileForSize(stats.size)) {
      this.currentFileIndex++
      return this.createWriteStream()
    }

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
  protected shouldCreateNewFileForDate(file: string) {
    if (file && this.getFileName() !== this.extractDateFromFileName(file)) {
      return true
    }

    return false
  }

  /** 是否因为大小原因需要创建新文件 */
  protected shouldCreateNewFileForSize(size: number) {
    return size >= this.maxFileSize
  }

  /** 确保文件可写 */
  protected async ensureFileWriteable(file: string) {
    // 超过最大限度证明有 DEBUG
    if (await this.isOverNumber()) {
      throw new Error(`The number of files is over ${this.maxFileNumber}.`)
    }

    await ensureFile(file)
    await fs.promises.access(file, fs.constants.W_OK)
    return file
  }

  /** 获取文件完整路径 */
  protected getFileAbsolutePath(index: number) {
    const symbol = this.getFileName()
    const fileName = `${symbol}.${index}.log`
    return path.join(this.output, fileName)
  }

  /** 获取当前的文件名，仅名字部分不包含序号 */
  protected getFileName(date = new Date()) {
    return stringifyDatetime(date, FILE_NAME_FORMATTER)
  }
}
