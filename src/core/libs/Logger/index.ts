import { camelCase, kebabCase, snakeCase, upperCase, upperFirst } from 'lodash'
import fs from 'fs'
import path from 'path'
import chalk, { type Color } from 'chalk'
import stripAnsi from 'strip-ansi'
import PrettyError from 'pretty-error'
import { Writer } from '../Writer'
import { stringifyDatetime, format, traceId, withConfigurable, createSingleton } from '../../utils'
import { SERVER_NAME } from '../../constants/conf'
import { LOGGER_BUFFER_MAX_SIZE, LOGGER_FILE_MAX_SIZE, LOGGER_FILE_MAX_NUMBER, LOGGER_FILE_PATH } from './constants'

export interface LoggerOptions {
  /** 名称 */
  name?: string
  /** 展示名称 */
  showName?: boolean
  /** 展示时间 */
  showTime?: boolean
  /** 追踪 ID */
  traceId?: string | boolean
  /** 是否保存为文件 */
  saveFile?: boolean
  /** 过期日期, 必须大于 0 */
  expireDay?: number
}

/** 通用配置 */
export interface PrettyOptions {
  /** 前缀信息 */
  prefix?: string
  /** 展示所有详情 */
  verbose?: boolean
  /** 不展示任何内容 */
  silence?: boolean
}

export interface RegisterOptions extends PrettyOptions {
  /** 只展示在"展示详情"的情况下 */
  onlyShowInVerbose?: boolean
  /** 是否保存为文件 */
  saveFile?: boolean
}

export interface PrintOptions extends RegisterOptions {
  prepend?: string
}

export type LoggerMessage = string | string[] | Error

export interface ILoggerConfiguration {
  getWriter(): Writer
}

export class Logger extends withConfigurable<ILoggerConfiguration, Record<never, unknown>>(class {}) {
  /** 是否展示最详情 */
  public readonly isVerbose = process.argv.includes('--verbose') || process.argv.includes('--profile')
  /** 不打印任何内容 */
  public readonly isSilence = process.argv.includes('--silence')

  /** 成功 */
  public ok: ReturnType<typeof this.register>
  /** 信息 */
  public info: ReturnType<typeof this.register>
  /** 警告 */
  public warn: ReturnType<typeof this.register>
  /** 错误 */
  public fail: ReturnType<typeof this.register>
  /** 调试 */
  public debug: ReturnType<typeof this.register>
  /** 打印 */
  public print: ReturnType<typeof this.register>

  protected name: string
  protected showName: boolean
  protected showTime: boolean
  protected traceId: string
  protected saveFile: boolean
  protected lastClearLogFilesTime: number

  constructor(options?: LoggerOptions) {
    super()

    const { name, showName, showTime, traceId: inputTraceId, saveFile } = options || {}

    this.name = name || SERVER_NAME
    this.showName = typeof showName === 'boolean' ? showName : !!process.env.ci
    this.showTime = typeof showTime === 'boolean' ? showTime : !!process.env.ci
    this.traceId = inputTraceId === true ? traceId() : typeof inputTraceId === 'string' ? inputTraceId : ''
    this.saveFile = typeof saveFile === 'boolean' ? saveFile : !process.env.ci

    this.ok = this.register('greenBright', { prefix: this.prefix('[OK]'), verbose: false })
    this.info = this.register('cyanBright', { prefix: this.prefix('[INFO]'), verbose: false })
    this.warn = this.register('yellowBright', { prefix: this.prefix('[WARN]'), verbose: false })
    this.fail = this.register('redBright', { prefix: this.prefix('[FAIL]'), verbose: true })
    this.debug = this.register('gray', { prefix: this.prefix('[DEBUG]'), onlyShowInVerbose: true, verbose: false, saveFile: false })
    this.print = this.register(null, { verbose: false, onlyShowInVerbose: true })
  }

  /** 克隆日志实例 */
  public clone(options?: LoggerOptions) {
    const { name = this.name, showName = this.showName, showTime = this.showTime, traceId = this.traceId, saveFile = this.saveFile } = options || {}
    return new Logger({ name, showName, showTime, traceId, saveFile })
  }

  /** 基础着色函数 */
  protected pretty(info: LoggerMessage, options?: PrettyOptions) {
    const { prefix, verbose = false } = options || {}
    const infoText = Array.isArray(info) && info.length > 1 ? format(info[0], ...info.slice(1)) : info.toString()
    const reason = info instanceof Error ? info : new Error(infoText)
    const pe = new PrettyError()
    const prettyMessage = pe.render(reason)
    const content = `${reason.message}${verbose === true ? `\n${prettyMessage}` : ''}`
    const message = prefix ? `${prefix} ${content}` : content
    return { content, message, reason, prettyMessage }
  }

  /** 渲染模板 */
  protected renderMessage(content: string) {
    if (typeof content !== 'string') {
      throw new Error('content must be string')
    }

    return content
      .replace(/\[DATE\]/g, `[${stringifyDatetime()}]`)
      .replace(/\[TRACEID\]/g, this.traceId ? `[${this.traceId}]` : '')
      .replace(/<Pascal:(.+?)>/g, (_, $1) => `${upperFirst(camelCase($1))}`)
      .replace(/<Camel:(.+?)>/g, (_, $1) => `${upperCase($1)}`)
      .replace(/<Snake:(.+?)>/g, (_, $1) => `${snakeCase($1)}`)
      .replace(/<UpperSnake:(.+?)>/g, (_, $1) => `${snakeCase($1).toUpperCase()}`)
      .replace(/<Kebab:(.+?)>/g, (_, $1) => `${kebabCase($1).toLowerCase()}`)
      .replace(/<Bold:(.+?)>/g, (_, $1) => `${chalk.bold($1)}`)
      .replace(/<Italic:(.+?)>/g, (_, $1) => `${chalk.italic($1)}`)
      .replace(/<Underline:(.+?)>/g, (_, $1) => `${chalk.underline($1)}`)
      .replace(/<Strikethrough:(.+?)>/g, (_, $1) => `${chalk.strikethrough($1)}`)
  }

  /** 注册着色函数 */
  protected register(color: typeof Color | null, defaultOptions?: RegisterOptions) {
    const {
      prefix: defaultPrefix,
      onlyShowInVerbose = false,
      verbose: defaultVerbose = this.isVerbose,
      silence: defaultSilence = this.isSilence,
      saveFile: defaultSaveFile = this.saveFile,
    } = defaultOptions || {}

    function log(this: Logger, info: LoggerMessage, options?: PrintOptions) {
      const { prefix: inPrefix = defaultPrefix, verbose = defaultVerbose, silence = defaultSilence, saveFile = defaultSaveFile, prepend, ...restOptions } = options || {}
      const prefix = [inPrefix, prepend].filter(Boolean).join(' ')
      const { message: inMessage, reason, prettyMessage } = this.pretty(info, { prefix, ...restOptions, verbose })

      const message = this.renderMessage(inMessage)
      if (!silence && !(onlyShowInVerbose && !this.isVerbose)) {
        const content = color && typeof chalk[color] === 'function' ? chalk[color](message) : message
        // eslint-disable-next-line no-console
        console.log(content)
      }

      if (saveFile) {
        this.writeLogFile(message)
      }

      return { message, reason, prettyMessage }
    }

    return log.bind(this)
  }

  /** 添加前缀 */
  protected prefix(content: string) {
    const prefix = this.showName && this.name ? `[${this.name.toUpperCase()}]` : ''
    const subfix = this.showTime ? '[DATE]' : ''
    const traceId = this.traceId ? '[TRACEID]' : ''
    const message = `${prefix}${content}${subfix}${traceId}`
    return message
  }

  /** 写入内容 */
  protected writeLogFile(content: string) {
    const writer = this.getLogWriter()
    if (!writer) {
      return
    }

    const stripedContent = stripAnsi(content)
    writer.write(stripedContent)
  }

  /** 获取日志写手 */
  protected getLogWriter() {
    if (!this.saveFile) {
      return
    }

    const { getWriter } = Logger.getConfig()
    if (typeof getWriter !== 'function') {
      return
    }

    const writer = getWriter()
    if (!(writer instanceof Writer)) {
      return
    }

    return writer
  }

  /** 获取日志文件 */
  public async getLogFiles(date: Date | number | string = new Date()) {
    if (typeof date !== 'undefined') {
      date = new Date(date)
    }

    if (isNaN(date.getTime())) {
      date = new Date()
    }

    const writer = this.getLogWriter()
    if (!writer) {
      return []
    }

    const files = await fs.promises.readdir(writer.outputDir)
    return Array.from(
      (function* () {
        for (const file of files) {
          if (path.extname(file) !== '.log') {
            continue
          }

          const fileNameDate = file.replace(/\.\d+\.log$/, '')
          const dateString = stringifyDatetime(date, 'YYYY-MM-DD')
          if (fileNameDate !== dateString) {
            continue
          }

          yield path.join(writer.outputDir, file)
        }
      })()
    )
  }
}

Logger.configure({
  getWriter: createSingleton(() => {
    return new Writer(
      { output: LOGGER_FILE_PATH },
      {
        maxFileSize: LOGGER_FILE_MAX_SIZE,
        maxFileNumber: LOGGER_FILE_MAX_NUMBER,
        maxBufferSize: LOGGER_BUFFER_MAX_SIZE,
      }
    )
  }),
})
