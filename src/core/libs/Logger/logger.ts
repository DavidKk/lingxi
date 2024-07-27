import { camelCase, kebabCase, snakeCase, upperCase, upperFirst } from 'lodash'
import chalk, { type Color } from 'chalk'
import PrettyError from 'pretty-error'
import { SERVER_NAME } from '../../constants/conf'
import { formatDate } from '../../utils/formatDate'
import { format } from '../../utils/format'
import { Fmt } from './fmt'
import { traceId } from '@/core/utils/traceId'

export interface LoggerOptions {
  /** 名称 */
  name?: string
  /** 展示名称 */
  showName?: boolean
  /** 展示时间 */
  showTime?: boolean
  /** 追踪 ID */
  traceId?: string | boolean
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
}

export interface PrintOptions extends RegisterOptions {
  prepend?: string
}

export type LoggerMessage = string | string[] | Error

export class Logger {
  public fmt = new Fmt()
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
  protected showName?: boolean
  protected showTime?: boolean
  protected traceId?: string

  constructor(options?: LoggerOptions) {
    const { name, showName, showTime, traceId: inputTraceId } = options || {}
    this.name = name || SERVER_NAME
    this.showName = typeof showName === 'boolean' ? showName : !!process.env.ci
    this.showTime = typeof showTime === 'boolean' ? showTime : !!process.env.ci
    this.traceId = inputTraceId === true ? traceId() : typeof inputTraceId === 'string' ? inputTraceId : ''

    this.ok = this.register('greenBright', { prefix: this.prefix('[OK]'), verbose: false })
    this.info = this.register('cyanBright', { prefix: this.prefix('[INFO]'), verbose: false })
    this.warn = this.register('yellowBright', { prefix: this.prefix('[WARN]'), verbose: false })
    this.fail = this.register('redBright', { prefix: this.prefix('[FAIL]'), verbose: true })
    this.debug = this.register('gray', { prefix: this.prefix('[DEBUG]'), onlyShowInVerbose: true, verbose: false })
    this.print = this.register(null, { verbose: false, onlyShowInVerbose: true })
  }

  public clone(options?: LoggerOptions) {
    const { name = this.name, showName = this.showName, showTime = this.showTime, traceId = this.traceId } = options || {}

    return new Logger({ name, showName, showTime, traceId })
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

  protected renderMessage(content: string) {
    if (typeof content !== 'string') {
      throw new Error('content must be string')
    }

    return content
      .replace(/\[DATE\]/g, `[${formatDate()}]`)
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
    const { prefix: defaultPrefix, onlyShowInVerbose = false, verbose: defaultVerbose = this.isVerbose, silence: defaultSilence = this.isSilence } = defaultOptions || {}
    return (info: LoggerMessage, options?: PrintOptions) => {
      const { prefix: inPrefix = defaultPrefix, verbose = defaultVerbose, silence = defaultSilence, prepend, ...restOptions } = options || {}
      const prefix = [inPrefix, prepend].filter(Boolean).join(' ')
      const { message: inMessage, reason, prettyMessage } = this.pretty(info, { prefix, ...restOptions, verbose })

      const message = this.renderMessage(inMessage)
      if (!silence && !(onlyShowInVerbose && !this.isVerbose)) {
        const content = color && typeof chalk[color] === 'function' ? chalk[color](message) : message
        // eslint-disable-next-line no-console
        console.log(content)
      }

      return { message, reason, prettyMessage }
    }
  }

  /** 添加前缀 */
  protected prefix(content: string) {
    const prefix = this.showName && this.name ? `[${this.name.toUpperCase()}]` : ''
    const subfix = this.showTime ? '[DATE]' : ''
    const traceId = this.traceId ? '[TRACEID]' : ''
    const message = `${prefix}${content}${subfix}${traceId}`
    return message
  }
}
