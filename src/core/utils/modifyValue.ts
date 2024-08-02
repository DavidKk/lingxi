export function modifyValue<T, U>(value: T | Promise<T>, modifier: (val: T) => U): U | Promise<U> {
  if (value instanceof Promise) {
    return value.then((val) => modifier(val))
  }

  return modifier(value)
}
