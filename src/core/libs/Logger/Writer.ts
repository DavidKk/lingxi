import fs from 'fs'
import path from 'path'
import { formatDate } from '../../utils/formatDate'
import { LOGGER_FILE_PATH, LOGGER_FILE_MAX_SIZE, LOGGER_BUFFER_SIZE } from '../../constants/logger'
import { K } from '../../constants/size'

export interface WriterOptions {
  filePath: string
  maxSize: number
  bufferSize: number
}

export class Writer {
  protected filePath = LOGGER_FILE_PATH
  protected maxSize = LOGGER_FILE_MAX_SIZE
  protected bufferSize: number = LOGGER_BUFFER_SIZE
  protected stream: fs.WriteStream | null = null
  protected buffer: string[] = []
  protected currentFileSize = 0
  protected flushing = false

  constructor(options?: WriterOptions) {
    const { filePath = LOGGER_FILE_PATH, maxSize = LOGGER_FILE_MAX_SIZE, bufferSize = LOGGER_BUFFER_SIZE } = options || {}
    this.filePath = filePath
    this.maxSize = maxSize
    this.bufferSize = bufferSize

    process.on('exit', this.exit.bind(this))
  }

  public write(content: string) {
    this.buffer.push(content)

    if (this.stream && this.currentFileSize >= this.maxSize) {
      this.stream.end()
    }

    ;(this.stream ? Promise.resolve() : this.createStream()).then(() => this.flush())
  }

  public flush() {
    if (this.flushing) {
      return
    }

    this.flushing = true

    if (!this.stream) {
      return
    }

    let currentSize = 0
    while (true) {
      if (this.buffer.length === 0) {
        break
      }

      if (currentSize === 0) {
        this.stream.cork()
      }

      const chunk = this.buffer.join('\n')
      currentSize += Buffer.byteLength(chunk)
      this.stream.write(chunk)
      // 清空缓存区
      this.buffer.length = 0
      this.currentFileSize += currentSize

      if (currentSize > this.bufferSize) {
        this.stream.uncork()
        currentSize = 0
      }
    }

    this.stream.uncork()
    this.flushing = false
  }

  protected exit() {
    try {
      this.flush()
      this.stream && this.stream.close()
    } finally {
      this.stream = null
    }
  }

  protected async createStream() {
    const logFile = this.mklog()
    const stats = await fs.promises.stat(logFile)
    this.currentFileSize = stats.size

    this.stream = fs.createWriteStream(logFile, { flags: 'a' })
    this.stream.on('error', (error: any) => {
      // eslint-disable-next-line no-console
      console.error(`Error writing to log file: ${JSON.stringify(error)}`)
    })

    this.stream.on('close', () => {
      this.stream = null
    })

    return this.stream
  }

  protected mklog() {
    return path.join(this.filePath, `${formatDate()}.log`)
  }
}
