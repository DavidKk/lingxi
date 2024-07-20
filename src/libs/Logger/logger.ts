import { camelCase, kebabCase, snakeCase, upperCase, upperFirst } from 'lodash'
import chalk, { type ColorName } from 'chalk'
import PrettyError from 'pretty-error'
import { SERVER_NAME } from '../../constants/conf'
import { Fmt } from './fmt'

export interface LoggerOptions {
  name?: string
  showName?: boolean
  showTime?: boolean
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

  constructor(options?: LoggerOptions) {
    const { name, showName, showTime } = options || {}
    this.name = name || SERVER_NAME
    this.showName = typeof showName === 'boolean' ? showName : !!process.env.ci
    this.showTime = typeof showTime === 'boolean' ? showTime : !!process.env.ci

    this.ok = this.register('greenBright', { prefix: this.prefix('[OK]'), verbose: false })
    this.info = this.register('cyanBright', { prefix: this.prefix('[INFO]'), verbose: false })
    this.warn = this.register('yellowBright', { prefix: this.prefix('[WARN]'), verbose: false })
    this.fail = this.register('redBright', { prefix: this.prefix('[FAIL]'), verbose: true })
    this.debug = this.register('gray', { prefix: this.prefix('[DEBUG]'), onlyShowInVerbose: true, verbose: false })
    this.print = this.register(null, { verbose: false, onlyShowInVerbose: true })
  }

  public clone(options?: LoggerOptions) {
    const { name = this.name, showName = this.showName, showTime = this.showTime } = options || {}
    return new Logger({ name, showName, showTime })
  }

  /** 基础着色函数 */
  protected pretty(info: string | Error, options?: PrettyOptions) {
    const { prefix, verbose = false } = options || {}
    const reason = info instanceof Error ? info : new Error(info)
    const pe = new PrettyError()
    const prettyMessage = pe.render(reason)
    const content = `${reason.message}${verbose === true ? `\n${prettyMessage}` : ''}`
    const message = prefix ? `${prefix} ${content}` : content
    return { content, message, reason, prettyMessage }
  }

  protected renderMessage(content: string) {
    return content
      .replace(/\[DATE\]/g, `[${new Date().toISOString()}]`)
      .replace(/<Pascal:(.+?)>/g, (_, $1) => `${upperFirst(camelCase($1))}`)
      .replace(/<Camel:(.+?)>/g, (_, $1) => `${upperCase($1)}`)
      .replace(/<Snake:(.+?)>/g, (_, $1) => `${snakeCase($1)}`)
      .replace(/<UpperSnake:(.+?)>/g, (_, $1) => `${snakeCase($1).toUpperCase()}`)
      .replace(/<Kebab:(.+?)>/g, (_, $1) => `${kebabCase($1).toLowerCase()}`)
      .replace(/<Bold:(.+?)>/g, (_, $1) => `${chalk.bold($1)}`)
  }

  /** 注册着色函数 */
  protected register(color: ColorName | null, defaultOptions?: RegisterOptions) {
    const { prefix: defaultPrefix, onlyShowInVerbose = false, verbose: defaultVerbose = this.isVerbose, silence: defaultSilence = this.isSilence } = defaultOptions || {}
    return (info: string | Error, options?: PrintOptions) => {
      const { prefix: inPrefix = defaultPrefix, verbose = defaultVerbose, silence = defaultSilence, prepend, ...restOptions } = options || {}
      const prefix = [inPrefix, prepend].filter(Boolean).join(' ')
      const { message: inMessage, reason, prettyMessage } = this.pretty(info, { prefix, ...restOptions, verbose })

      const message = this.renderMessage(inMessage)
      if (!silence && !(onlyShowInVerbose && !this.isVerbose)) {
        // eslint-disable-next-line no-console
        console.log(color && typeof chalk[color] === 'function' ? chalk[color](message) : message)
      }

      return { message, reason, prettyMessage }
    }
  }

  /** 添加前缀 */
  protected prefix(content: string) {
    const prefix = this.showName && this.name ? `[${this.name.toUpperCase()}]` : ''
    const subfix = this.showTime ? '[DATE]' : ''
    return `${prefix}${content}${subfix}`
  }
}
