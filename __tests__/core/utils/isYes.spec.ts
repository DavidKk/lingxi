import { isYes } from '@/core/utils/isYes'

describe('isYes', () => {
  it('should return true for various yes representations', () => {
    expect(isYes('yes')).toBe(true)
    expect(isYes('YES')).toBe(true)
    expect(isYes('y')).toBe(true)
    expect(isYes('Y')).toBe(true)
    expect(isYes('true')).toBe(true)
    expect(isYes('TRUE')).toBe(true)
    expect(isYes(true)).toBe(true)
  })

  it('should return false for non-yes values', () => {
    expect(isYes('no')).toBe(false)
    expect(isYes('NO')).toBe(false)
    expect(isYes('n')).toBe(false)
    expect(isYes('N')).toBe(false)
    expect(isYes(false)).toBe(false)
    expect(isYes(0)).toBe(false)
    expect(isYes(1)).toBe(false)
    expect(isYes('some other string')).toBe(false)
    expect(isYes(null)).toBe(false)
    expect(isYes(undefined)).toBe(false)
  })
})
