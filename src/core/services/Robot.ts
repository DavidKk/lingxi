import { CoreService, type CoreServiceOptions } from '@/core/libs/CoreService'
import { History } from '@/core/libs/History'
import { format } from '@/core/utils/format'
import { stringifyLength } from '@/core/utils/stringifyLength'
import { isImageMessage, isImageMessageContext, isTextMessageContext } from '@/core/utils/wechaty'
import { CHAT_SEND_RECORD_COUNT, GEMINI_API_SERVER_ENDPOINT } from '@/core/constants/conf'
import type { MessageContext } from '@/core/types'
import { convertRecordsToContents, Gemini } from './Gemini'

export type RobotOptions = CoreServiceOptions

export class Robot extends CoreService {
  protected gemini: Gemini
  protected history: History

  public get enableGemini() {
    return !!GEMINI_API_SERVER_ENDPOINT
  }

  constructor(options?: RobotOptions) {
    super(options)

    this.gemini = new Gemini(options)
    this.history = new History()
  }

  /** 聆听聊天日志 */
  public hear(context: MessageContext) {
    if (isTextMessageContext(context)) {
      const { ssid, user, content, logger } = context
      logger.info(`Heard "${user}" said "${content}"`)
      this.history.push(ssid, { role: 'human', type: 'text', user, content })
      return
    }

    if (isImageMessageContext(context)) {
      const { ssid, user, mimeType, content: data, logger } = context
      logger.info(`Heard "${user}" send a image. base64 size: ${stringifyLength(data.length)}.`)

      const content = { mimeType, data }
      this.history.push(ssid, { role: 'human', type: 'image', user, content })
      return
    }
  }

  /** 与 Gemini 聊天 */
  public async chatWithGemini(context: MessageContext) {
    const { ssid, user, content, logger } = context
    if (!this.enableGemini) {
      logger.warn('Gemini is disabled')
      return
    }

    logger.info(format(`User ${user} chat with Gemini and said %o`, content))
    // 加入聊天历史中，因为发送内容会从历史中获取
    this.hear(context)

    const records = this.history.slice(ssid, CHAT_SEND_RECORD_COUNT * -1)
    logger.info(`Found ${records.length} history records.`)

    const contents = convertRecordsToContents(records)
    logger.info(format(`Send to Gemini with messages: %o.`, contents))

    if (!contents.length) {
      logger.warn('Gemini send messages is empty.')
      return ''
    }

    const replyText = await this.gemini.chat(context, contents, {
      model: isImageMessage(contents) ? 'gemini-1.5-flash' : 'gemini-pro',
    })

    if (!replyText) {
      logger.warn('Gemini reply message is empty.')
      return replyText
    }

    this.history.push(ssid, { role: 'system', type: 'text', user, content: replyText })
    return replyText
  }

  /** 清除聊天记录上下文 */
  public clear(context: MessageContext) {
    const { ssid } = context
    this.history.clear(ssid)
    this.logger.ok(`Clear history records.`)
  }

  /** 更新聊天记录容量 */
  public updateCapacity(context: MessageContext, size: number) {
    const { ssid } = context
    this.history.updateCapacity(ssid, size)
    this.logger.ok(`Update history capacity to ${size}.`)
  }
}
