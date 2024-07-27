import { LimitedArray } from '@/core/libs/LimitedArray'

describe('LimitedArray', () => {
  test('should initialize with the correct capacity', () => {
    const limitedArray = new LimitedArray<number>(5)
    expect(limitedArray.values().length).toBe(0)
  })

  test('should push items without exceeding capacity', () => {
    const limitedArray = new LimitedArray<number>(5)
    limitedArray.push(1, 2, 3)
    expect(limitedArray.values()).toEqual([1, 2, 3])
  })

  test('should remove oldest items when exceeding capacity', () => {
    const limitedArray = new LimitedArray<number>(5)
    limitedArray.push(1, 2, 3, 4, 5)
    limitedArray.push(6, 7)
    expect(limitedArray.values()).toEqual([3, 4, 5, 6, 7])
  })

  test('should slice the array correctly', () => {
    const limitedArray = new LimitedArray<number>(5)
    limitedArray.push(1, 2, 3, 4, 5)
    expect(limitedArray.slice(1, 3)).toEqual([2, 3])
  })

  test('should return a copy of the array with values method', () => {
    const limitedArray = new LimitedArray<number>(5)
    limitedArray.push(1, 2, 3)
    const values = limitedArray.values()
    values.push(4)
    expect(limitedArray.values()).toEqual([1, 2, 3])
  })
})
