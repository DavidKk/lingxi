import { isKrokiImage, Kroki } from '@/services/Kroki'
import { FileBox } from 'file-box'

let krokiService: Kroki | null = null
if (process.env.KROKI_SERVER_URL) {
  krokiService = new Kroki({
    serverUrl: process.env.KROKI_SERVER_URL,
  })
}

/** 将 Markdown 中的内容转换成一系列按顺序排列的文本和图片 */
export async function processMarkdownToTextAndImages(markdown: string) {
  if (typeof markdown !== 'string' || !markdown) {
    return markdown
  }

  if (!krokiService) {
    return markdown
  }

  const contentParts = await krokiService.processMarkdown(markdown)
  const sections = Array.from(
    (function* () {
      for (const part of contentParts) {
        if (typeof part === 'string') {
          yield part
          continue
        }

        // 图片类型转成图片文件发送
        if (isKrokiImage(part)) {
          const { file: name, content } = part
          const buffer = Buffer.from(content)
          const file = FileBox.fromBuffer(buffer, name)
          yield file
          continue
        }
      }
    })()
  )

  return sections
}
