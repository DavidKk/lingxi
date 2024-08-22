/**
 * 计算字符串数组中所有字符串的总字节长度
 *
 * @param strings - 字符串数组
 * @returns 字符串数组中所有字符串的总字节长度
 */
export function calculateTotalByteLength(strings: string[]) {
  return strings.reduce((total, str) => total + Buffer.byteLength(str, 'utf-8'), 0)
}
