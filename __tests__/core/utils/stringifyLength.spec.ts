import { stringifyLength } from '@/core/utils/stringifyLength'

describe('stringifyLength', () => {
  it('should return "0" for 0 length', () => {
    expect(stringifyLength(0)).toBe('0')
  })

  it('should return correct value for units', () => {
    expect(stringifyLength(123)).toBe('123')
  })

  it('should return correct value for thousands', () => {
    expect(stringifyLength(1500)).toBe('1.5 K')
  })

  it('should return correct value for millions', () => {
    expect(stringifyLength(1500000)).toBe('1.5 M')
  })

  it('should return correct value for billions', () => {
    expect(stringifyLength(1500000000)).toBe('1.5 B')
  })

  it('should handle negative decimals', () => {
    expect(stringifyLength(1500, -1)).toBe('2 K')
  })

  it('should handle zero decimals', () => {
    expect(stringifyLength(1500, 0)).toBe('2 K')
  })

  it('should handle custom decimals', () => {
    expect(stringifyLength(1500, 3)).toBe('1.5 K')
  })
})
