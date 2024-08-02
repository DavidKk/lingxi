import { splitString } from '@/core/utils/splitString'

describe('splitString', () => {
  it('should split a string into chunks of the specified size', () => {
    expect(splitString('Hello', 6)).toEqual(['Hel', 'lo'])
    expect(splitString('你好', 3)).toEqual(['你', '好'])
    expect(splitString('Hello你好', 10)).toEqual(['Hello', '你好'])
  })
})
