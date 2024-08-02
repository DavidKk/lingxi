/**
 * 按顺序执行 Promise，如果失败则不向下执行
 * @param promises Promise 函数数组
 * @returns Promise<void>
 */
export async function executePromisesSequentially(...promises: (() => Promise<any>)[]): Promise<void> {
  for (const promise of promises) {
    try {
      await promise()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return Promise.resolve()
}
