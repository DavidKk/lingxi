/** 获取代码块缩进大小 */
export function calculateIndentSpaces(code: string) {
  const lines = code.split('\n').map((line) => line.trimEnd())

  let minSpaces = Number.MAX_SAFE_INTEGER
  for (const line of lines) {
    if (line.trim().length === 0) {
      continue
    }

    const leadingSpaces = line.match(/^\s*/)?.[0].length || 0
    if (!leadingSpaces) {
      continue
    }

    if (leadingSpaces < minSpaces) {
      minSpaces = leadingSpaces
    }
  }

  return minSpaces === Number.MAX_SAFE_INTEGER ? 0 : minSpaces
}
