import { CoreServiceAbstract } from '@/core/libs/CoreServiceAbstract'
import { KROKI_ENDPOINT } from './constants'

/** 图表代码块的类型定义 */
export interface CodeBlock {
  /** 语言类型 */
  language: string
  /** 代码片段 */
  code: string
}

export class Kroki extends CoreServiceAbstract {
  /** 提取 Markdown 内容中的代码块 */
  protected extractCodeBlocks(markdown: string) {
    const codeBlocks: CodeBlock[] = []
    const textParts: string[] = []
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g

    let lastIndex = 0
    let match: RegExpExecArray | null

    const content = markdown.trim()
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, language, code] = match
      // 这里可能为空，但能确保当图表开头时，得出的结果也是转换成文本开头的数据集
      const textPart = content.slice(lastIndex, match.index)
      textParts.push(textPart.trim())

      codeBlocks.push({ language, code })
      lastIndex = match.index + fullMatch.length
    }

    if (lastIndex < content.length) {
      const textPart = content.slice(lastIndex)
      textParts.push(textPart.trim())
    }

    return { textParts, codeBlocks }
  }

  /** 请求 Kroki 生成图表并获取 PNG Buffer */
  protected async fetchKrokiImage(language: string, code: string) {
    const url = `${KROKI_ENDPOINT}/${language}/png`
    const response = await fetch(url, {
      method: 'POST',
      body: code,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    return response.arrayBuffer()
  }

  /** 将 Markdown 内容与图表拆分开来 */
  public async processMarkdown(markdown: string) {
    const { textParts, codeBlocks } = this.extractCodeBlocks(markdown)
    const promises = codeBlocks.map(({ language, code }) => this.fetchKrokiImage(language, code))
    const results = await Promise.allSettled(promises)
    const images = Array.from(
      (function* ({ logger }) {
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          if (result.status === 'fulfilled') {
            yield result.value
            continue
          }

          logger.fail(`Fetch Kroki image failed: ${result.reason}`)
          yield null
        }
      })(this)
    )

    return Array.from(
      (function* () {
        let textIndex = 0
        for (let i = 0; i < codeBlocks.length; i++) {
          if (textIndex < textParts.length) {
            yield textParts[textIndex++]
          }

          const image = images[textIndex]
          if (image) {
            yield image
            continue
          }

          const { language, code } = codeBlocks[i]
          yield `\`\`\`${language}\n${code}\n\`\`\``
        }

        // 添加剩余的文本部分，正常的情况下仅一个元素
        if (textIndex < textParts.length) {
          yield* textParts.slice(textIndex)
        }
      })()
    )
  }
}
