import type { ReadableStreamDefaultReader } from 'stream/web'
import { Service } from '../libs/Service'
import type { HistoryImageContent, HistoryRecord, HistoryRole } from '../libs/History'
import { withVercelHeader } from '../utils/withVercelHeader'
import { GEMINI_API_SERVER_CHAT_PATH, GEMINI_API_SERVER_ENDPOINT, GEMINI_API_SERVER_FLASH_PATH, GEMINI_API_TOKEN } from '../constants/conf'
import { GenerationConfig, SafetySettings } from '../constants/gemini'
import type { GeminiContent, GeminiMessageDTO, GeminiRespDTO, MessageContext } from '../types'
import { format } from '../utils/format'

export interface ReadStreamOptions {
  /** 分段更新 */
  onSegmentUpdate: (segmentText: string, receivedText: string) => void
}

export type GeminiChatModel = 'gemini-pro' | 'gemini-1.5-flash'

export function exchangeModelPath(model: GeminiChatModel) {
  switch (model) {
    case 'gemini-pro':
      return GEMINI_API_SERVER_CHAT_PATH
    case 'gemini-1.5-flash':
      return GEMINI_API_SERVER_FLASH_PATH
  }
}

export interface GeminiChatOptions {
  /** 模型类型 */
  model?: GeminiChatModel
}

export class Gemini extends Service {
  public async chat(context: MessageContext, contents: GeminiContent[], options?: GeminiChatOptions) {
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

    const url = `${GEMINI_API_SERVER_ENDPOINT}${modelPath}?key=${GEMINI_API_TOKEN}`
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

  /** 逐步解析数据 */
  protected async processIncrementalStream(context: MessageContext, reader: ReadableStreamDefaultReader<Uint8Array>, options?: ReadStreamOptions) {
    const { logger } = context
    const { onSegmentUpdate } = options || {}
    const decoder = new TextDecoder()

    let remainText: string[] = []
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

      logger.info(`Partial data: ${textArray}`)

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

      logger.info(format(`Extract contents: %o`, contents))
      return contents
    }

    if (Array.isArray(repsonse)) {
      const data: GeminiMessageDTO[] = repsonse
      const contents = this.extractText(context, data)

      logger.info(format(`Extract contents: %o`, contents))
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

export function convertRecordsToContents(records: HistoryRecord[]): GeminiContent[] {
  return Array.from(
    (function* () {
      for (const record of records) {
        const { role: hRole, type, content } = record
        if (type === 'image' && typeof content === 'object') {
          const part = convertImageToContentPart(content)
          const parts = [part]
          const role = convertRoleToContentRole(hRole)
          yield { role, parts }
        }

        if (type === 'text' && typeof content === 'string') {
          const part = convertTextToContentPart(content)
          const parts = [part]
          const role = convertRoleToContentRole(hRole)
          yield { role, parts }
        }
      }
    })()
  )
}

export function convertImageToContentPart(content: HistoryImageContent) {
  const { mimeType, data } = content
  const inlineData = { mimeType, data }
  return { inlineData }
}

export function convertTextToContentPart(content: string) {
  return { text: content }
}

export function convertRoleToContentRole(role: HistoryRole) {
  switch (role) {
    case 'system':
      return 'model'
    case 'human':
      return 'user'
  }
}
