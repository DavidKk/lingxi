/** 修改返回值 */
export function modifyReturnValue<T, U>(value: T | Promise<T>, modifier: (val: T) => U): U | Promise<U> {
  if (value instanceof Promise) {
    return value.then((val) => modifier(val))
  }

  return modifier(value)
}
