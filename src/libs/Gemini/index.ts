import type { ReadableStreamDefaultReader } from 'stream/web'
import { GEMINI_API_SERVER_URL, GEMINI_API_TOKEN } from '@/constants/conf'
import { Service } from '@/libs/Service'
import { withVercelHeader } from '@/utils/withVercelHeader'
import { GenerationConfig, SafetySettings } from './conf'
import type { GeminiContent, GeminiSuccessResp, GeminiRespDTO } from './types'
import type { History } from '@/types'

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

    this.logger.info(`Chat with Gemini: ${JSON.stringify(body, null, 2)}. headers: ${JSON.stringify(Object.fromEntries(headers.entries()), null, 2)}`)
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
        this.logger.info(`The confirmed content is: ${remainText}`)
      },
    })

    this.logger.info(`Chat with Gemini success: ${text}`)
    return text
  }

  public convertRecordsToContents(records: History[]): GeminiContent[] {
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
        this.logger.warn('No data found.')
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
      this.logger.warn('No valid JSON found.')
      return
    }

    // 处理错误信息
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
      throw new Error(reason)
    }

    const data: GeminiSuccessResp[] = repsonse
    const contents = this.extractText(data)

    this.logger.info(`Extract contents: ${JSON.stringify(contents, null, 2)}`)
    return contents
  }

  /** 提取回复内容字符串 */
  protected extractText(data: GeminiSuccessResp[]) {
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
        maxOutputTokens: GenerationConfig.max_tokens,
        topP: GenerationConfig.top_p,
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
