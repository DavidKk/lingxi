import { Service, type ServiceOptions } from '@/libs/Service'
import { History } from '@/libs/History'
import { Gemini } from '@/libs/Gemini'
import { CHAT_SEND_RECORD_COUNT, GEMINI_API_SERVER_URL } from '@/constants/conf'

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
  public hear(ssid: string, user: string, message: string) {
    this.logger.info(`Heard ${user} said ${message}`)
    this.history.push(ssid, { role: 'human', user, message })
  }

  /** 与 Gemini 聊天 */
  public async chatWithGemini(ssid: string, user: string, message: string) {
    if (!this.enableGemini) {
      this.logger.warn('Gemini is disabled')
      return
    }

    this.logger.info(`User ${user} chat with gemini and said ${JSON.stringify(message)}`)
    this.history.push(ssid, { role: 'human', user, message })

    const records = this.history.slice(ssid, CHAT_SEND_RECORD_COUNT * -1)
    this.logger.info(`Find ${records} records.`)

    const contents = this.gemini.convertRecordsToContents(records)
    const replyText = await this.gemini.chat(contents)

    this.logger.info(`Gemini reply message ${replyText}`)
    this.history.push(ssid, { role: 'system', user, message: replyText })

    return replyText
  }
}
