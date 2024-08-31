/** 将多个序列的元素按顺序交替排列在一起 */
export function interleaveArrays<A, B>(aArr: A[], bArr: B[]) {
  const maxLength = Math.max(aArr.length, bArr.length)
  const results = Array.from(
    (function* () {
      for (let i = 0; i < maxLength; i++) {
        if (i < aArr.length) {
          yield aArr[i]
        }

        if (i < bArr.length) {
          yield bArr[i]
        }
      }
    })()
  )

  return results
}
