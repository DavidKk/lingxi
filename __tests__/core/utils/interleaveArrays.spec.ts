import { interleaveArrays } from '@/core/utils'

describe('interleaveArrays', () => {
  it('should interleave two arrays of the same length', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [4, 5, 6]
    expect(interleaveArrays(arr1, arr2)).toEqual([1, 4, 2, 5, 3, 6])
  })

  it('should handle when the first array is longer', () => {
    const arr1 = [1, 2, 3, 7]
    const arr2 = [4, 5, 6]
    expect(interleaveArrays(arr1, arr2)).toEqual([1, 4, 2, 5, 3, 6, 7])
  })

  it('should handle when the second array is longer', () => {
    const arr1 = [1, 2]
    const arr2 = [4, 5, 6, 7]
    expect(interleaveArrays(arr1, arr2)).toEqual([1, 4, 2, 5, 6, 7])
  })

  it('should return an empty array when both arrays are empty', () => {
    const arr1: number[] = []
    const arr2: number[] = []
    expect(interleaveArrays(arr1, arr2)).toEqual([])
  })

  it('should handle one empty array', () => {
    const arr1: number[] = []
    const arr2 = [4, 5, 6]
    expect(interleaveArrays(arr1, arr2)).toEqual([4, 5, 6])

    const arr3 = [1, 2, 3]
    const arr4: number[] = []
    expect(interleaveArrays(arr3, arr4)).toEqual([1, 2, 3])
  })

  it('should work with arrays of different types', () => {
    const arr1 = [1, 2, 3]
    const arr2 = ['a', 'b', 'c']
    expect(interleaveArrays(arr1, arr2)).toEqual([1, 'a', 2, 'b', 3, 'c'])
  })

  it('should handle single-element arrays', () => {
    const arr1 = [1]
    const arr2 = [4]
    expect(interleaveArrays(arr1, arr2)).toEqual([1, 4])
  })
})
