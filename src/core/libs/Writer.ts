import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { stringifyDatetime } from '@/core/utils/stringifyDatetime'
import { LOGGER_FILE_PATH, LOGGER_FILE_MAX_SIZE } from '@/core/constants/logger'
import { ensureFile } from '@/core/utils/ensureFile'
import { Logger } from './Logger'

const FLUSH_EVENT_ACTION = 'flush'

export interface WriterOptions {
  output?: string
  maxFileSize?: number
}

export class Writer {
  protected logger = new Logger({ showTime: true, saveFile: false })
  protected ee = new EventEmitter()
  protected stream: fs.WriteStream | null = null
  protected buffer: string[] = []
  protected flushing = false
  protected currentFileName: string
  protected currentFileSize: number

  protected output: string
  protected maxFileSize: number

  /** 当前写入的文件 */
  public get outputDir() {
    return this.output
  }

  constructor(options?: WriterOptions) {
    const { output = LOGGER_FILE_PATH, maxFileSize = LOGGER_FILE_MAX_SIZE } = options || {}

    this.output = output
    this.maxFileSize = maxFileSize

    process.on('exit', this.exit.bind(this))
  }

  /** 写内容 */
  public write(content: string) {
    this.buffer.push(content)
    this.logger.debug(`Push log to buffer. size: ${content.length}.`)

    const flush = async () => {
      if (this.stream) {
        this.logger.debug(`Stream not found, create writeStream and flush log to file.`)
        await Promise.resolve()
        this.flush()
        return
      }

      await this.createWriteStream().catch((error) => this.logger.fail(`Create stream failed: ${error}`))
      this.flush()
    }

    if (this.stream && this.shouldCreateNewFile()) {
      this.stream.end(() => {
        this.stream = null
        flush()
      })

      return
    }

    flush()
  }

  public nextFlush() {
    return new Promise<void>((resolve) => {
      const handleFlush = () => {
        resolve()
        this.ee.removeListener(FLUSH_EVENT_ACTION, handleFlush)
      }

      this.ee.addListener(FLUSH_EVENT_ACTION, handleFlush)
    })
  }

  /** 写入文件 */
  protected flush() {
    if (this.flushing) {
      this.logger.debug(`Flushing...`)
      return
    }

    if (!(this.stream && this.stream.writable)) {
      this.logger.debug(`Stream not found or can not write log file, skip.`)
      return
    }

    this.flushing = true
    this.logger.debug(`Start flushing...`)
    const handleWrite = (error: unknown) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(`Error writing to log file: ${error}`)
      }

      this.ee.emit(FLUSH_EVENT_ACTION)
    }

    let currentSize = 0
    while (true) {
      // 没有缓存内容退出
      if (this.buffer.length === 0) {
        break
      }

      const chunk = this.buffer.join('\n')
      currentSize += Buffer.byteLength(chunk)

      // 写入缓存区
      this.stream.write(chunk + '\n', handleWrite)

      // 清空缓存区
      this.buffer.length = 0
      this.currentFileSize += currentSize
    }

    this.flushing = false
  }

  /** 退出 */
  public exit() {
    try {
      this.flush()
      this.stream && this.stream.close()
    } finally {
      this.stream = null
    }
  }

  /** 创建写入流 */
  protected async createWriteStream(index = 0): Promise<fs.WriteStream> {
    const { file, index: fileIndex } = this.getNewFile(index)

    // 确定文件
    await ensureFile(file)

    // 判断是否拥有写入权限
    await fs.promises.access(file, fs.constants.W_OK)

    // 获取文件大小
    const stats = await fs.promises.stat(file)
    if (this.shouldCreateNewFile(stats.size)) {
      return this.createWriteStream(fileIndex + 1)
    }

    this.currentFileName = file
    this.currentFileSize = stats.size

    // 创建写入流
    this.stream = fs.createWriteStream(file, { flags: 'a' })

    const handleError = (error: Error) => {
      // eslint-disable-next-line no-console
      console.error(`Error writing to log file: ${error}`)
    }

    const handleClose = () => {
      this.stream = null
    }

    this.stream.on('error', handleError)
    this.stream.on('close', handleClose)

    return this.stream
  }

  /** 获取新文件路径 */
  protected getNewFile(index = 0) {
    const symbol = stringifyDatetime`YYYY-MM-DD`
    const fileName = `${symbol}.${index}.log`
    const file = path.join(this.output, fileName)
    return { index, file }
  }

  /** 是否应该创建新文件 */
  protected shouldCreateNewFile(size = this.currentFileSize) {
    return size >= this.maxFileSize
  }
}
