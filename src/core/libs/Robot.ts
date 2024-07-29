import { Service, type ServiceOptions } from './Service'
import { History } from './History'
import { Gemini } from './Gemini'
import { CHAT_SEND_RECORD_COUNT, GEMINI_API_SERVER_URL } from '../constants/conf'
import { ChatContext } from '../register/wechaty'
import type { MessageContext } from '../types'

export type RobotOptions = ServiceOptions

export class Robot extends Service {
  protected gemini: Gemini
  protected history: History

  public get enableGemini() {
    return !!GEMINI_API_SERVER_URL
  }

  constructor(options?: RobotOptions) {
    super(options)

    this.gemini = new Gemini(options)
    this.history = new History()
  }

  /** 聆听聊天日志 */
  public hear(context: MessageContext, ssid: string, user: string, message: string) {
    const { logger } = context
    logger.info(`Heard ${user} said ${message}`)
    this.history.push(ssid, { role: 'human', user, message })
  }

  /** 与 Gemini 聊天 */
  public async chatWithGemini(context: MessageContext, ssid: string, user: string, message: string) {
    const { logger } = context
    if (!this.enableGemini) {
      logger.warn('Gemini is disabled')
      return
    }

    logger.info(`User ${user} chat with gemini and said ${JSON.stringify(message)}`)
    this.history.push(ssid, { role: 'human', user, message })

    const records = this.history.slice(ssid, CHAT_SEND_RECORD_COUNT * -1)
    logger.info(`Find ${records.length} records.`)

    const contents = this.gemini.convertRecordsToContents(records)
    const replyText = await this.gemini.chat(context, contents)

    logger.info(`Gemini reply message ${replyText}`)
    this.history.push(ssid, { role: 'system', user, message: replyText })

    return replyText
  }
}