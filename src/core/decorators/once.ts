/**
 * `Once` 装饰器
 *
 * 该装饰器确保被装饰的方法只会执行一次，无论后续调用多少次，
 * 都只返回第一次执行的结果。适用于需要缓存计算结果或避免重复操作的场景。
 */
export function Once(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
  const originalMethod = descriptor.value!

  let hasBeenCalled = false
  let result: any

  // 包装原始方法，确保其只执行一次
  descriptor.value = function (...args: any[]) {
    if (!hasBeenCalled) {
      result = originalMethod.apply(this, args)
      hasBeenCalled = true
    }

    return result
  }

  return descriptor
}
