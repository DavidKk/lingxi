import { format } from '@/core/utils/format'

describe('format', () => {
  it('should format a string with %s', () => {
    const result = format('Hello, %s!', 'World')
    expect(result).toBe('Hello, World!')
  })

  it('should format a number with %d', () => {
    const result = format('Number: %d', 42)
    expect(result).toBe('Number: 42')
  })

  it('should format a number with %i', () => {
    const result = format('Integer: %i', 42)
    expect(result).toBe('Integer: 42')
  })

  it('should format a float with %f', () => {
    const result = format('Float: %f', 3.14)
    expect(result).toBe('Float: 3.14')
  })

  it('should format an object with %j', () => {
    const result = format('Object: %j', { a: 1, b: 2 })
    expect(result).toBe('Object: {"a":1,"b":2}')
  })

  it('should format an object with %o', () => {
    const result = format('Object: %o', { a: 1, b: 2 })
    expect(result).toContain('Object: { a: 1, b: 2 }')
  })

  it('should format an object with %O', () => {
    const result = format('Object: %O', { a: 1, b: 2 })
    expect(result).toContain('Object: { a: 1, b: 2 }')
  })

  it('should handle multiple format specifiers', () => {
    const result = format('Hello, %s! The answer is %d.', 'World', 42)
    expect(result).toBe('Hello, World! The answer is 42.')
  })

  it('should handle extra arguments', () => {
    const result = format('Hello, %s!', 'World', 'Extra argument')
    expect(result).toBe('Hello, World!Extra argument')
  })

  it('should throw an error if format is not a string', () => {
    expect(() => format(123 as any, 'World')).toThrow('Argument "format" must be a string')
  })

  it('should handle nested objects with %o', () => {
    const result = format('Nested: %o', { a: [1, 2, 3], b: { c: 4, d: 5 } })
    expect(result).toContain('Nested: { a: [ 1, 2, 3 ], b: { c: 4, d: 5 } }')
  })

  it('should handle nested objects with %O', () => {
    const result = format('Nested: %O', { a: [1, 2, 3], b: { c: 4, d: 5 } })
    expect(result).toContain('Nested: { a: [ 1, 2, 3 ], b: { c: 4, d: 5 } }')
  })

  it('should handle arrays with %o', () => {
    const result = format('Array: %o', [1, 2, 3])
    expect(result).toContain('Array: [ 1, 2, 3 ]')
  })

  it('should handle arrays with %O', () => {
    const result = format('Array: %O', [1, 2, 3])
    expect(result).toContain('Array: [ 1, 2, 3 ]')
  })

  it('should handle mixed types', () => {
    const result = format('Mixed: %s, %d, %f, %j, %o, %O', 'String', 42, 3.14, { a: 1 }, [1, 2], { b: 2 })
    expect(result).toContain('Mixed: String, 42, 3.14, {"a":1}, [ 1, 2 ], { b: 2 }')
  })
})
