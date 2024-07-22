import { Service, type ServiceOptions } from '@/libs/Service'
import { LimitedArray } from '@/libs/LimitedArray'
import { Gemini } from '@/libs/Gemini'
import { CHAT_SEND_RECORD_COUNT, GEMINI_API_SERVER_URL, MAX_HISTORY_RECORD } from '@/constants/conf'
import type { History } from '@/types'

export type RobotOptions = ServiceOptions

export class Robot extends Service {
  protected gemini: Gemini
  protected history: LimitedArray<History>

  public get enableGemini() {
    return !!GEMINI_API_SERVER_URL
  }

  constructor(options?: RobotOptions) {
    super(options)

    this.gemini = new Gemini(options)
    this.history = new LimitedArray(MAX_HISTORY_RECORD)
  }

  public hear(user: string, message: string) {
    this.logger.info(`Heard ${user} said ${message}`)
    this.history.push({ role: 'human', user, message })
  }

  public async chatWithGemini(user: string, message: string) {
    if (!this.enableGemini) {
      this.logger.warn('Gemini is disabled')
      return
    }

    this.logger.info(`User ${user} chat with gemini and said ${JSON.stringify(message)}`)
    this.history.push({ role: 'human', user, message })

    const records = this.history.slice(CHAT_SEND_RECORD_COUNT * -1)
    this.logger.info(`Send records: ${JSON.stringify(records)}`)

    const contents = this.gemini.convertRecordsToContents(records)
    this.logger.info(`Convert recrods to contents: ${JSON.stringify(contents)}`)
    const replyText = await this.gemini.chat(contents)

    this.logger.info(`Gemini reply message ${replyText}`)
    this.history.push({ role: 'system', user, message })

    return replyText
  }
}
