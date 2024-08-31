import { modifyReturnValue } from '@/core/utils/modifyReturnValue'

describe('modifyReturnValue', () => {
  test('should modify a non-Promise value', () => {
    const value = 5
    const modifier = (val: number) => val * 2
    const result = modifyReturnValue(value, modifier)
    expect(result).toBe(10)
  })

  test('should modify a Promise value', async () => {
    const value = Promise.resolve(5)
    const modifier = (val: number) => val * 2
    const result = await modifyReturnValue(value, modifier)
    expect(result).toBe(10)
  })

  test('should handle a rejected Promise', async () => {
    const value = Promise.reject('Error')
    const modifier = (val: string) => val.toUpperCase()
    await expect(modifyReturnValue(value, modifier)).rejects.toEqual('Error')
  })
})
