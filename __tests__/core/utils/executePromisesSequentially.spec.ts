import { executePromisesSequentially } from '@/core/utils/executePromisesSequentially'

describe('executePromisesSequentially', () => {
  it('should execute promises sequentially and return a resolved Promise if all promises succeed', async () => {
    const promises = [() => Promise.resolve('成功1'), () => Promise.resolve('成功2'), () => Promise.resolve('成功3')]
    const result = await executePromisesSequentially(...promises)
    expect(result).toBeUndefined()
  })

  it('should execute promises sequentially and return a rejected Promise if any promise fails', async () => {
    const promises = [() => Promise.resolve('成功1'), () => Promise.reject('失败2'), () => Promise.resolve('成功3')]

    try {
      await executePromisesSequentially(...promises)
      fail('Expected an error to be thrown')
    } catch (error) {
      expect(error).toBe('失败2')
    }
  })
})
