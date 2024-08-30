import type { ReadableStreamDefaultReader } from 'stream/web'
import type { CoreServiceOptions } from '@/core/libs/CoreServiceAbstract'
import { GPTAbstract, type GPTAbstractContext } from '@/core/libs/GPTAbstract'
import { format, withVercelHeader } from '@/core/utils'
import type { MessageContext } from '@/providers/types'
import { isWeChatyContext } from '@/providers/WeChatyProvider'
import { GenerationConfig, GROUP_CHAT_POLICY, PRIVATE_CHAT_POLICY, SafetySettings } from './conf'
import { convertRecordsToContents, exchangeModelPath, isImageMessage } from './utils'
import type { GeminiChatModel, GeminiContent, GeminiMessageDTO, GeminiRespDTO } from './types'

export interface ReadStreamOptions {
  /** 分段更新 */
  onSegmentUpdate: (segmentText: string, receivedText: string) => void
}

export interface GeminiChatOptions {
  /** 模型类型 */
  model?: GeminiChatModel
}

export type GeminiOptions = Omit<CoreServiceOptions, 'name'>

export class Gemini extends GPTAbstract {
  static readonly SUPPORT_MODELS = Object.freeze(['gemini-pro', 'gemini-1.5-flash'])
  constructor(options?: GeminiOptions) {
    super({ name: 'gemini', ...options })
  }

  public get enableGemini() {
    return !!process.env.GEMINI_API_SERVER_ENDPOINT
  }

  public async chat(context: MessageContext & GPTAbstractContext) {
    const { user, content, logger, client } = this.normalizeContext(context)
    if (!this.enableGemini) {
      logger.warn('Gemini is disabled')
      return
    }

    logger.info(format(`User ${user} chat with Gemini and said %o`, content))

    const records = client.retrieveHistory(context)
    logger.info(`Found ${records.length} history records.`)

    const updateSessionWithSystemInstructions = () => {
      const { ssid, isGroup, isAdmin } = this.normalizeContext(context)

      logger.debug('ensure session created')
      this.ensureSession(ssid, {
        systemSettings: {
          instructions: isGroup ? GROUP_CHAT_POLICY : PRIVATE_CHAT_POLICY,
        },
      })

      // 系统配置一定存在
      const { instructions } = this.getSessionSystemSettings(ssid)!
      logger.debug(`Gemini system instructions: ${instructions}`)

      if (!(typeof instructions === 'string' && instructions)) {
        logger.warn('Gemini system instructions is empty.')
        return
      }

      if (isAdmin) {
        logger.debug('User is admin, skip system instructions.')
        return
      }

      if (records.some((record) => record.role === 'system')) {
        logger.debug('Gemini system instructions already exists.')
        return
      }

      // prepend system chat
      records.unshift({ role: 'system', user: 'system', type: 'text', content: instructions })
      logger.info(format(`Prepend system instructions: %o`, instructions))
    }

    updateSessionWithSystemInstructions()

    const contents = convertRecordsToContents(records)
    logger.debug(format(`Send to Gemini with messages: %o.`, contents))

    if (!contents.length) {
      logger.warn('Gemini send messages is empty.')
      return ''
    }

    const replyText = await this.send(context, contents, {
      model: isImageMessage(contents) ? 'gemini-1.5-flash' : 'gemini-pro',
    })

    if (!replyText) {
      logger.warn('Gemini reply message is empty.')
      return replyText
    }

    client.pushHistory(context, { role: 'assistant', type: 'text', user, content: replyText })
    return replyText
  }

  public async send(context: MessageContext, contents: GeminiContent[], options?: GeminiChatOptions) {
    const { logger } = context
    if (!(Array.isArray(contents) && contents.length > 0)) {
      throw new Error('Contents is empty')
    }

    const { model = 'gemini-pro' } = options || {}
    logger.info(`Chat with Gemini. model: ${model}`)

    const modelPath = exchangeModelPath(model)
    const payload = this.integrateRequestPayload(contents)
    const headers = new Headers([
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
      ['x-requested-with', 'XMLHttpRequest'],
      ['cache-control', 'no-cache'],
    ])

    withVercelHeader(headers)

    const url = `${process.env.GEMINI_API_SERVER_ENDPOINT}${modelPath}?key=${process.env.GEMINI_API_TOKEN}`
    logger.info(`Chat with Gemini. url: ${url}`)

    const body = JSON.stringify(payload)
    logger.info(format(`Chat with Gemini. contents: %o`, payload.contents))

    const response = await fetch(url, { method: 'POST', headers, body })
    if (!response.ok) {
      throw new Error(`Chat with Gemini failed with status: ${response.status}`)
    }

    if (!(200 <= response.status && response.status < 400)) {
      throw new Error(`Chat with Gemini failed with status: ${response.status}`)
    }

    const reader = response?.body?.getReader()
    if (!reader) {
      throw new Error('Reader not found.')
    }

    const text = await this.processIncrementalStream(context, reader, {
      onSegmentUpdate: (remainText) => {
        logger.debug(`The confirmed content is: ${remainText}`)
      },
    })

    if (text) {
      logger.info(`Chat with Gemini success. content: ${text}`)
    } else {
      logger.warn('Chat with Gemini failed.')
    }

    return text
  }

  /** 整合成统一上下文 */
  protected normalizeContext(context: MessageContext & GPTAbstractContext) {
    if (isWeChatyContext(context)) {
      const { isStar: isAdmin, isRoom: isGroup, ...rest } = context
      return { ...rest, isAdmin, isGroup }
    }

    return context
  }

  /** 逐步解析数据 */
  protected async processIncrementalStream(context: MessageContext, reader: ReadableStreamDefaultReader<Uint8Array>, options?: ReadStreamOptions) {
    const { logger } = context
    const { onSegmentUpdate } = options || {}
    const decoder = new TextDecoder()

    const remainText: string[] = []
    let existingTexts: string[] = []

    let partialData = ''
    while (true) {
      const { done, value } = await reader?.read()
      if (done) {
        logger.info(`Stream reading completed. conetent: ${partialData}`)
        break
      }

      // 解析内容
      const data = decoder.decode(value, { stream: true })
      partialData += data

      const textArray = this.processPartialData(context, partialData)
      if (!textArray) {
        logger.debug('No data found.')
        continue
      }

      logger.debug(`Partial data: ${textArray}`)

      if (textArray.length > existingTexts.length) {
        const deltaArray = textArray.slice(existingTexts.length)
        existingTexts = textArray
        remainText.push(deltaArray.join(''))

        logger.info(`The confirmed content is: ${remainText.join('')}`)

        if (typeof onSegmentUpdate === 'function') {
          const segmentText = remainText.splice(0).join('')
          const receivedText = existingTexts.join('')
          onSegmentUpdate(segmentText, receivedText)
        }
      }
    }

    return existingTexts.join('')
  }

  /** 处理数据 */
  protected processPartialData(context: MessageContext, partialData: string) {
    const { logger } = context
    const source = this.ensureProperEnding(partialData)

    // 因为字符串数据可能不是完整的 JSON，这里如果出错则返回空
    const repsonse = this.tryParseJson<GeminiRespDTO>(source)
    if (!repsonse) {
      logger.debug('No valid JSON found.')
      return
    }

    // Gemini Flash
    if (typeof repsonse === 'object' && 'candidates' in repsonse) {
      const data: GeminiMessageDTO = repsonse
      const contents = this.extractText(context, [data])

      logger.debug(format(`Extract contents: %o`, contents))
      return contents
    }

    if (Array.isArray(repsonse)) {
      const data: GeminiMessageDTO[] = repsonse
      const contents = this.extractText(context, data)

      logger.debug(format(`Extract contents: %o`, contents))
      return contents
    }

    // 错误处理
    if ('failed' in repsonse) {
      const { message, result } = repsonse
      const reasons = Array.from(
        (function* () {
          if (!Array.isArray(result)) {
            return
          }

          for (const item of result) {
            if (!item?.error) {
              continue
            }

            yield item.error?.message
          }
        })()
      )

      const reason = [message, ...reasons].join('\n')
      throw new Error(`Remote service call failed. ${reason}`)
    }

    // 错误处理
    if (repsonse.success === false) {
      const { message = 'unknown error' } = repsonse
      throw new Error(`Remote service call failed. ${message}`)
    }
  }

  /** 提取回复内容字符串 */
  protected extractText(context: MessageContext, data: GeminiMessageDTO[]) {
    const { logger } = context
    if (!Array.isArray(data)) {
      logger.fail(`ExtractText fail with invalid data, ${JSON.stringify(data, null, 2)}`)
      throw new Error('ExtractText fail with invalid data')
    }

    const contents = Array.from(
      (function* () {
        for (const dataItem of data) {
          const candidates = dataItem.candidates || []
          for (const candidate of candidates) {
            const content = candidate.content || {}
            const parts = content?.parts || []
            const textParts = parts.filter((item) => 'text' in item)
            yield textParts.map(({ text }) => text).join('')
          }
        }
      })()
    )

    return contents
  }

  /** 保证闭合 */
  protected ensureProperEnding(content: string) {
    if (content.startsWith('[') && !content.endsWith(']')) {
      return content + ']'
    }

    return content
  }

  /** 整合 Body 内容 */
  protected integrateRequestPayload(contents: GeminiContent[]) {
    return {
      contents,
      generationConfig: {
        temperature: GenerationConfig.temperature,
        maxOutputTokens: GenerationConfig.maxOutputTokens,
        topP: GenerationConfig.topP,
      },
      safetySettings: [...SafetySettings],
    }
  }

  /** 尝试解析 JSON */
  protected tryParseJson<T>(source: string): T | null {
    try {
      return JSON.parse(source)
    } catch (error) {
      // skip error message when parsing json
    }

    return null
  }
}
