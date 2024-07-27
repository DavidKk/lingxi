import type { HistoryRecord } from '@/core/libs/History'
import { History } from '@/core/libs/History'

describe('History', () => {
  let history: History

  beforeEach(() => {
    history = new History({ maxSize: 3 })
  })

  test('should add history records to a user', () => {
    const ssid = 'user1'
    const record1: HistoryRecord = { role: 'human', user: ssid, message: 'Hello' }
    const record2: HistoryRecord = { role: 'system', user: ssid, message: 'Hi' }

    history.push(ssid, record1)
    history.push(ssid, record2)

    expect(history.slice(ssid)).toEqual([record1, record2])
  })

  test('should limit the number of history records per user', () => {
    const ssid = 'user2'
    const record1: HistoryRecord = { role: 'human', user: ssid, message: 'Hello' }
    const record2: HistoryRecord = { role: 'system', user: ssid, message: 'Hi' }
    const record3: HistoryRecord = { role: 'human', user: ssid, message: 'How are you?' }
    const record4: HistoryRecord = { role: 'system', user: ssid, message: 'I am fine' }

    history.push(ssid, record1)
    history.push(ssid, record2)
    history.push(ssid, record3)
    history.push(ssid, record4)

    expect(history.slice(ssid)).toEqual([record2, record3, record4])
  })

  test('should return an empty array if user has no history records', () => {
    const ssid = 'user3'

    expect(history.slice(ssid)).toEqual([])
  })

  test('should return a slice of history records', () => {
    const ssid = 'user4'
    const record1: HistoryRecord = { role: 'human', user: ssid, message: 'Hello' }
    const record2: HistoryRecord = { role: 'system', user: ssid, message: 'Hi' }
    const record3: HistoryRecord = { role: 'human', user: ssid, message: 'How are you?' }

    history.push(ssid, record1)
    history.push(ssid, record2)
    history.push(ssid, record3)

    expect(history.slice(ssid, 1, 3)).toEqual([record2, record3])
  })
})
