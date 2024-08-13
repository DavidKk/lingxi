import { dateToStringWithTimezone } from '@/core/utils/dateToStringWithTimezone'

describe('Datetime Utils', () => {
  const roundToSeconds = (date: Date): number => {
    return Math.floor(date.getTime() / 1000)
  }

  it('should convert Date to string with timezone and back to Date correctly', () => {
    const originalDate = new Date()
    const dateString = dateToStringWithTimezone(originalDate)
    const parsedDate = new Date(dateString)

    // 精确到秒
    expect(roundToSeconds(parsedDate)).toBe(roundToSeconds(originalDate))

    // 检查字符串中的时区信息是否正确
    const timezoneOffset = originalDate.getTimezoneOffset()
    const sign = timezoneOffset <= 0 ? '+' : '-'
    const hours = Math.floor(Math.abs(timezoneOffset) / 60)
      .toString()
      .padStart(2, '0')
    const minutes = (Math.abs(timezoneOffset) % 60).toString().padStart(2, '0')
    const expectedTimezone = `${sign}${hours}:${minutes}`

    expect(dateString).toContain(expectedTimezone)
  })

  it('should handle different timezones correctly', () => {
    const utcDateString = '2024-08-14T12:34:56+00:00'
    const estDateString = '2024-08-14T07:34:56-05:00'

    const utcDate = new Date(utcDateString)
    const estDate = new Date(estDateString)

    // 精确到秒
    expect(roundToSeconds(utcDate)).toBe(roundToSeconds(estDate))
  })

  it('should handle daylight saving time correctly', () => {
    const dstDate = new Date('2024-03-10T02:30:00-08:00')
    const dateString = dateToStringWithTimezone(dstDate)
    const parsedDate = new Date(dateString)

    // 精确到秒
    expect(roundToSeconds(parsedDate)).toBe(roundToSeconds(dstDate))
  })
})
