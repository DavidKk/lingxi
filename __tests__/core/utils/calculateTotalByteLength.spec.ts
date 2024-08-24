import { calculateTotalByteLength } from '@/core/utils/calculateTotalByteLength'

describe('calculateTotalByteLength', () => {
  it('should return 0 for an empty array', () => {
    expect(calculateTotalByteLength([])).toBe(0)
  })

  it('should return the correct byte length for a single string', () => {
    expect(calculateTotalByteLength(['hello'])).toBe(5)
  })

  it('should return the correct byte length for multiple strings', () => {
    expect(calculateTotalByteLength(['hello', 'world'])).toBe(10)
  })

  it('should handle strings with different byte lengths', () => {
    expect(calculateTotalByteLength(['hello', '世界'])).toBe(5 + 6) // '世界' 的 UTF-8 字节长度是 6
  })

  it('should handle strings with special characters', () => {
    expect(calculateTotalByteLength(['hello', '😊'])).toBe(5 + 4) // '😊' 的 UTF-8 字节长度是 4
  })

  it('should handle an array with long strings', () => {
    const longString = 'a'.repeat(1000) // 1000 个 'a' 字符
    expect(calculateTotalByteLength([longString])).toBe(1000)
  })

  it('should handle a mix of empty and non-empty strings', () => {
    expect(calculateTotalByteLength(['', 'hello', ''])).toBe(5)
  })
})
