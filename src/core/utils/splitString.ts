/**
 * 按指定大小拆分字符串
 * @param str 字符串
 * @param maxSize 最大大小
 * @returns 拆分后的数组
 */
export function splitString(str: string, maxSize: number): string[] {
  const result: string[] = []

  let currentSize = 0
  let currentString = ''

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    if (charCode >= 0 && charCode <= 127) {
      currentSize += 2
    } else {
      currentSize += 3
    }

    currentString += str[i]
    if (currentSize >= maxSize) {
      result.push(currentString)
      currentSize = 0
      currentString = ''
    }
  }

  if (currentString.length > 0) {
    result.push(currentString)
  }

  return result
}
