import { formatDate } from '@/core/utils/formatDate'

describe('formatDate', () => {
  it('should format the current date and time by default', () => {
    const now = new Date()
    const formatted = formatDate()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    expect(formatted).toBe(expected)
  })

  it('should format a given date', () => {
    const date = new Date(2023, 9, 1, 12, 30, 45) // October 1, 2023, 12:30:45
    const formatted = formatDate(date)
    expect(formatted).toBe('2023-10-01T12:30:45')
  })

  it('should format a date with single digit month and day', () => {
    const date = new Date(2023, 0, 1, 12, 30, 45) // January 1, 2023, 12:30:45
    const formatted = formatDate(date)
    expect(formatted).toBe('2023-01-01T12:30:45')
  })

  it('should format a date with single digit hours, minutes, and seconds', () => {
    const date = new Date(2023, 9, 1, 1, 2, 3) // October 1, 2023, 01:02:03
    const formatted = formatDate(date)
    expect(formatted).toBe('2023-10-01T01:02:03')
  })

  it('should format a date with leading zeros', () => {
    const date = new Date(2023, 9, 1, 9, 8, 7) // October 1, 2023, 09:08:07
    const formatted = formatDate(date)
    expect(formatted).toBe('2023-10-01T09:08:07')
  })

  it('should format a date with trailing zeros', () => {
    const date = new Date(2023, 9, 1, 10, 20, 30) // October 1, 2023, 10:20:30
    const formatted = formatDate(date)
    expect(formatted).toBe('2023-10-01T10:20:30')
  })
})
