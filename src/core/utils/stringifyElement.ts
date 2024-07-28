import chalk from 'chalk'
import util, { type InspectOptions } from 'util'

// prettier-ignore
export type CountTarget<T> = T extends any[]
  ? [`${number} items`]
  : T extends Record<string, any>
    ? { [K in keyof T]: `${number} items` }
    : T

// prettier-ignore
export type CountifyElement<D, T extends number, R extends any[] = []> = (
  R['length'] extends T
  ? CountTarget<D>
  : { [K in keyof D]: CountifyElement<D[K], T, [string, ...R]> }
) & {
  [util.inspect.custom]: () => string
}

export function countItems(element: any) {
  if (Array.isArray(element)) {
    return element.length
  }

  if (typeof element === 'object' && element !== null) {
    return Object.keys(element).length
  }

  return 0
}

export function createCustomInspectObject(type: 'Array' | 'Object', element: any) {
  return Object.defineProperty(Object.create({}), util.inspect.custom, {
    enumerable: true,
    writable: false,
    value: () => {
      return `${chalk.cyan(`[${type}]`)} ${chalk.gray(`/* ${countItems(element)} items */`)}`
    },
  })
}

export function setCustomInspectMessage(element: any) {
  if (Array.isArray(element)) {
    return createCustomInspectObject('Array', element)
  }

  if (typeof element === 'object' && element !== null) {
    return createCustomInspectObject('Object', element)
  }

  return element
}

export function countifyElement<D, T extends number>(element: D, depth?: T): CountifyElement<D, T> {
  if (Array.isArray(element)) {
    if (typeof depth === 'number' && depth > 0) {
      return element.map((element) => countifyElement(element, depth - 1)) as any
    }

    return setCustomInspectMessage(element)
  }

  if (typeof element === 'object' && element !== null) {
    if (typeof depth === 'number' && depth > 0) {
      return Object.fromEntries(
        Object.entries(element).map(([key, value]) => {
          return [key, countifyElement(value, depth - 1)]
        })
      ) as any
    }

    return setCustomInspectMessage(element)
  }

  if (!(typeof depth === 'number' && depth > 0)) {
    return setCustomInspectMessage(element)
  }

  return element as any
}

export function stringifyElement(element: any, options?: InspectOptions) {
  return util.inspect(countifyElement(element, options?.depth || 0), { ...options, depth: Infinity })
}
