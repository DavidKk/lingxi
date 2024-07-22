import type { ReadableStreamDefaultReader } from 'stream/web'
import { Service } from '@/libs/Service'
import type { HistoryRecord } from '@/libs/History'
import { withVercelHeader } from '@/utils/withVercelHeader'
import { GEMINI_API_SERVER_URL, GEMINI_API_TOKEN, GenerationConfig, SafetySettings } from '@/constants/conf'
import type { GeminiContent, GeminiMessageDTO, GeminiRespDTO } from '@/types'

export interface ReadStreamOptions {
  /** 分段更新 */
  onSegmentUpdate: (segmentText: string, receivedText: string) => void
}

export class Gemini extends Service {
  public async chat(contents: GeminiContent[]) {
    const payload = this.integrateRequestPayload(contents)
    const headers = new Headers([
      ['Content-Type', 'application/json'],
      ['Accept', 'application/json'],
      ['x-requested-with', 'XMLHttpRequest'],
      ['cache-control', 'no-cache'],
    ])

    withVercelHeader(headers)

    const url = `${GEMINI_API_SERVER_URL}?key=${GEMINI_API_TOKEN}`
    const body = JSON.stringify(payload)

    this.logger.info(`Chat with Gemini. contents: ${JSON.stringify(payload.contents, null, 2)}`)
    const response = await fetch(url, { method: 'POST', headers, body })
    if (!(200 <= response.status && response.status < 400)) {
      throw new Error(`Chat with Gemini failed with status: ${response.status}`)
    }

    const reader = response?.body?.getReader()
    if (!reader) {
      throw new Error('Reader not found.')
    }

    const text = await this.processIncrementalStream(reader, {
      onSegmentUpdate: (remainText) => {
        this.logger.debug(`The confirmed content is: ${remainText}`)
      },
    })

    this.logger.info(`Chat with Gemini success: ${text}`)
    return text
  }

  public convertRecordsToContents(records: HistoryRecord[]): GeminiContent[] {
    return Array.from(
      (function* () {
        for (const record of records) {
          const { role, message: text } = record
          const part = { text }
          const parts = [part]

          switch (role) {
            case 'system':
              yield { role: 'model', parts }
              continue
            case 'human':
              yield { role: 'user', parts }
              continue
          }
        }
      })()
    )
  }

  /** 逐步解析数据 */
  protected async processIncrementalStream(reader: ReadableStreamDefaultReader<Uint8Array>, options?: ReadStreamOptions) {
    const { onSegmentUpdate } = options || {}
    const decoder = new TextDecoder()

    let remainText: string[] = []
    let existingTexts: string[] = []

    let partialData = ''
    while (true) {
      const { done, value } = await reader?.read()
      if (done) {
        this.logger.info('Stream reading completed.')
        break
      }

      // 解析内容
      const data = decoder.decode(value, { stream: true })
      partialData += data

      const textArray = this.processPartialData(partialData)
      if (!textArray) {
        this.logger.debug('No data found.')
        continue
      }

      if (textArray.length > existingTexts.length) {
        const deltaArray = textArray.slice(existingTexts.length)
        existingTexts = textArray
        remainText.push(deltaArray.join(''))

        this.logger.info(`The confirmed content is: ${remainText.join('')}`)

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
  protected processPartialData(partialData: string) {
    const source = this.ensureProperEnding(partialData)

    // 因为字符串数据可能不是完整的 JSON，这里如果出错则返回空
    const repsonse = this.tryParseJson<GeminiRespDTO>(source)
    if (!repsonse) {
      this.logger.debug('No valid JSON found.')
      return
    }

    if (Array.isArray(repsonse)) {
      const data: GeminiMessageDTO[] = repsonse
      const contents = this.extractText(data)

      this.logger.info(`Extract contents: ${JSON.stringify(contents, null, 2)}`)
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
  protected extractText(data: GeminiMessageDTO[]) {
    if (!Array.isArray(data)) {
      this.logger.fail(`ExtractText fail with invalid data, ${JSON.stringify(data, null, 2)}`)
      throw new Error('ExtractText fail with invalid data')
    }

    const contents = Array.from(
      (function* () {
        for (const { candidates = [] } of data) {
          for (const { content } of candidates) {
            const { parts } = content
            yield parts.map(({ text }) => text).join('')
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
