import { CoreServiceAbstract, type CoreServiceOptions } from '@/core/libs/CoreServiceAbstract'
import { adjustIndentSpaces, format, hashArrayBuffer, interleaveArrays, stringifyBytes } from '@/core/utils'
import { isKrokiLanguage } from './types'
import type { KrokiCodeBlock, KrokiImage, KrokiServiceStatus } from './types'

export interface KrokiOptions extends CoreServiceOptions {
  serverUrl?: string
}

export class Kroki extends CoreServiceAbstract {
  protected serverUrl: string

  constructor(options?: KrokiOptions) {
    super(options)

    const { serverUrl } = options || {}
    if (!(typeof serverUrl === 'string' && /https?:\/\//.test(serverUrl))) {
      throw new Error('Kroki serverUrl is required')
    }

    this.serverUrl = serverUrl
  }

  /** 检测 Kroki 健康状态 */
  public async checkHealth() {
    const response = await fetch(`${this.serverUrl}/health`, { method: 'GET' })
    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as KrokiServiceStatus
    return data.status === 'pass'
  }

  /** 将 Markdown 内容与图表拆分开来 */
  public async processMarkdown(markdown: string) {
    if (!this.serverUrl) {
      return markdown
    }

    const { textParts, codeBlocks } = this.extractCodeBlocks(markdown)
    this.logger.debug(format('extract blocks of code. text parts: %o, code parts: %o', textParts, codeBlocks))

    const promises = codeBlocks.map(({ language, code }) => this.fetchKrokiImage(language, code))
    const results = await Promise.allSettled(promises)

    const images = Array.from<KrokiImage | string>(
      (function* (kroki: Kroki) {
        for (let i = 0; i < results.length; i++) {
          const result = results[i]

          // 图片
          if (result.status === 'fulfilled') {
            const content = result.value
            if (content instanceof ArrayBuffer) {
              const name = hashArrayBuffer(content)
              const file = `${name}.png`
              yield { file, content }
              continue
            }
          }

          // 编码
          const { language, code } = codeBlocks[i]
          yield kroki.generateChartCodeBlock(language, code)
        }
      })(this)
    )

    const parts = interleaveArrays(textParts, images)
    return parts.filter(Boolean)
  }

  /** 提取 Markdown 内容中的代码块 */
  protected extractCodeBlocks(markdown: string) {
    const codeBlocks: KrokiCodeBlock[] = []
    const textParts: string[] = []
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g

    let lastIndex = 0
    let match: RegExpExecArray | null

    const content = markdown.trim()
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, code] = match

      // 如果不是支持的语言则直接跳过
      if (!isKrokiLanguage(language)) {
        this.logger.debug(`Skip unsupported language: ${language}`)

        const endIndex = match.index + fullMatch.length
        const textPart = content.slice(lastIndex, endIndex).trim()

        textParts.push(textPart)
        continue
      }

      // 这里可能为空，但能确保当图表开头时，得出的结果也是转换成文本开头的数据集
      const textPart = content.slice(lastIndex, match.index).trim()
      textParts.push(textPart)

      codeBlocks.push({ language, code })
      lastIndex = match.index + fullMatch.length
    }

    if (lastIndex < content.length) {
      const textPart = content.slice(lastIndex).trim()
      textParts.push(textPart)
    }

    return { textParts, codeBlocks }
  }

  /** 请求 Kroki 生成图表并获取 PNG Buffer */
  protected async fetchKrokiImage(language: string, code: string) {
    if (!this.serverUrl) {
      throw new Error('Kroki serverUrl is empty, skip')
    }

    if (!isKrokiLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`)
    }

    const url = `${this.serverUrl}/${language}/png`
    const body = adjustIndentSpaces(code)

    this.logger.debug(`Fetch Kroki image by ${url}. code block:\n${this.generateChartCodeBlock(language, body)}`)

    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
    })

    if (!response.ok) {
      const body = await response.text()
      this.logger.fail(`Fetch Kroki image failed. ${body}`)
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    this.logger.debug(`Fetch Kroki image success. image size ${stringifyBytes(buffer.byteLength)}`)

    return buffer
  }

  /** 生成 Markdown 代码块 */
  protected generateChartCodeBlock(language: string, code: string) {
    return `\`\`\`${language}\n${code}\n\`\`\``
  }
}
