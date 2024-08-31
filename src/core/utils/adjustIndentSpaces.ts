import { calculateIndentSpaces } from './calculateIndentSpaces'

/** 调整缩进 */
export function adjustIndentSpaces(code: string, indentSize = 2) {
  const lines = code.split('\n')

  /** 整体缩进 */
  const overallIndentSpace = calculateIndentSpaces(code)
  // 如果为 0 或无法获取则不做任何操作
  if (!overallIndentSpace) {
    return code
  }

  const adjustedLines = lines.map((line) => {
    const fromSpace = line.match(/^\s*/)?.[0].length || 0
    // 如果为 0 或无法获取则不做任何操作
    if (!fromSpace) {
      return line.trim()
    }

    /** 缩进层级，当前行缩进/整体缩进 */
    const indentLevel = Math.floor(fromSpace / overallIndentSpace)
    const space = ' '.repeat(indentSize * indentLevel)
    return space + line.trim()
  })

  return adjustedLines.join('\n')
}
