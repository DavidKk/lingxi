import { calculateIndentSpaces } from '@/core/utils/calculateIndentSpaces'

describe('calculateIndentSpaces', () => {
  it('should return 0 for a code block with no indentation', () => {
    const code = `
function example() {
console.log('Hello, World!');
if (true) {
console.log('Condition met');
}
}
`
    expect(calculateIndentSpaces(code)).toBe(0)
  })

  it('should return the correct indentation for uniformly indented code', () => {
    const code = `
    function example() {
        console.log('Hello, World!');
        if (true) {
            console.log('Condition met');
        }
    }
`
    expect(calculateIndentSpaces(code)).toBe(4)
  })

  it('should return the correct indentation for code with varying indentation', () => {
    const code = `
    function example() {
        console.log('Hello, World!');
    if (true) {
            console.log('Condition met');
        }
    }
`
    expect(calculateIndentSpaces(code)).toBe(4)
  })

  it('should return 0 for an empty code block', () => {
    const code = ``
    expect(calculateIndentSpaces(code)).toBe(0)
  })

  it('should return 0 for a code block with only empty lines', () => {
    const code = `
        
        
`
    expect(calculateIndentSpaces(code)).toBe(0)
  })

  it('should correctly handle a code block with mixed empty and indented lines', () => {
    const code = `
        
    function example() {
        console.log('Hello, World!');
        if (true) {
            console.log('Condition met');
        }
    }
        
`
    expect(calculateIndentSpaces(code)).toBe(4)
  })

  it('should return the smallest indentation for code with different indentation levels', () => {
    const code = `
    function example() {
        console.log('Hello, World!');
   if (true) {
            console.log('Condition met');
        }
    }
`
    expect(calculateIndentSpaces(code)).toBe(3)
  })
})
