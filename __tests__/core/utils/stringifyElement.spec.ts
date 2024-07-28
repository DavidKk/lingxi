import util from 'util'
import { createCustomInspectObject, setCustomInspectMessage, countifyElement, stringifyElement } from '@/core/utils/stringifyElement'

function removeColorCodes(content: string) {
  return content.replace(/\x1b\[[0-9;]*m/g, '')
}

describe('createCustomInspectObject', () => {
  it('should create a custom inspect object for an array', () => {
    const element = [1, 2, 3]
    const inspectObject = createCustomInspectObject('Array', element)
    const content = inspectObject[util.inspect.custom]()
    expect(removeColorCodes(content)).toBe('[Array] /* 3 items */')
  })

  it('should create a custom inspect object for an object', () => {
    const element = { a: 1, b: 2, c: 3 }
    const inspectObject = createCustomInspectObject('Object', element)
    const content = inspectObject[util.inspect.custom]()
    expect(removeColorCodes(content)).toBe('[Object] /* 3 items */')
  })
})

describe('setCustomInspectMessage', () => {
  it('should set a custom inspect message for an array', () => {
    const element = [1, 2, 3]
    const modifiedElement = setCustomInspectMessage(element)
    const content = util.inspect(modifiedElement)
    expect(removeColorCodes(content)).toBe('[Array] /* 3 items */')
  })

  it('should set a custom inspect message for an object', () => {
    const element = { a: 1, b: 2, c: 3 }
    const modifiedElement = setCustomInspectMessage(element)
    const content = util.inspect(modifiedElement)
    expect(removeColorCodes(content)).toBe('[Object] /* 3 items */')
  })

  it('should not set a custom inspect message for a primitive value', () => {
    const element = 123
    const modifiedElement = setCustomInspectMessage(element)
    expect(modifiedElement).toBe(123)
  })
})

describe('countifyElement', () => {
  it('should countify an array', () => {
    const element = [1, 2, 3]
    const countifiedElement = countifyElement(element)
    const content = countifiedElement[util.inspect.custom]()
    expect(removeColorCodes(content)).toEqual('[Array] /* 3 items */')
  })

  it('should countify an object', () => {
    const element = { a: 1, b: 2, c: 3 }
    const countifiedElement = countifyElement(element)
    const content = countifiedElement[util.inspect.custom]()
    expect(removeColorCodes(content)).toEqual('[Object] /* 3 items */')
  })

  it('should countify an array with depth', () => {
    const element = [1, [2, 3]]
    const countifiedElement = countifyElement(element, 1)
    const content = countifiedElement.map((el: any) => {
      if (typeof el === 'object' && util.inspect.custom in el) {
        const content = el[util.inspect.custom]()
        return removeColorCodes(content)
      }

      return el
    })

    expect(content).toEqual([1, '[Array] /* 2 items */'])
  })

  it('should countify an object with depth', () => {
    const element = { a: 1, b: { c: 2, d: 3 } }
    const countifiedElement = countifyElement(element, 1)
    const content = Object.fromEntries(
      Object.entries(countifiedElement).map((item: any) => {
        const [name, el] = item
        if (typeof el === 'object' && util.inspect.custom in el) {
          const content = el[util.inspect.custom]()
          return [name, removeColorCodes(content)]
        }

        return [name, el]
      })
    )

    expect(content).toEqual({ a: 1, b: '[Object] /* 2 items */' })
  })

  it('should not countify a primitive value', () => {
    const element = 123
    const content = countifyElement(element)
    expect(content).toBe(123)
  })
})

describe('stringifyElement', () => {
  it('should countify arrays', () => {
    const content = stringifyElement([1, 2, 3])
    expect(removeColorCodes(content)).toBe('[Array] /* 3 items */')
  })

  it('should countify objects', () => {
    const content = stringifyElement({ a: 1, b: 2, c: 3 })
    expect(removeColorCodes(content)).toBe(`[Object] /* 3 items */`)
  })

  it('should respect the depth option', () => {
    let content = stringifyElement([1, 2, 3], { depth: 1 })
    expect(removeColorCodes(content)).toBe(`[ 1, 2, 3 ]`)

    content = stringifyElement({ a: 1, b: 2, c: 3 }, { depth: 1 })
    expect(removeColorCodes(content)).toBe(`{ a: 1, b: 2, c: 3 }`)

    content = stringifyElement(
      {
        a: [1, 2, 3],
        b: {
          c: [4, 5, 6],
          d: {
            e: [7, 8, 9],
          },
        },
      },
      { depth: 1 }
    )
  })

  it('should countify nested arrays and objects', () => {
    const content = stringifyElement(
      {
        a: [1, 2, 3],
        b: {
          c: [4, 5, 6],
          d: {
            e: [7, 8, 9],
          },
        },
      },
      { depth: 1 }
    )

    const message = `
{
  a: [Array] /* 3 items */,
  b: [Object] /* 2 items */
}
    `.trim()

    expect(removeColorCodes(content)).toBe(message)
  })
})
