import { History } from '@/core/libs/History'
import type { HistoryRecord } from '@/core/libs/History/types'

describe('History', () => {
  let history: History

  beforeEach(() => {
    history = new History({ maxSize: 3, saveFile: false })
  })

  test('should add history records to a user', () => {
    const ssid = 'user1'
    const record1: HistoryRecord = { role: 'human', type: 'text', user: ssid, content: 'Hello' }
    const record2: HistoryRecord = { role: 'system', type: 'text', user: ssid, content: 'Hi' }

    history.push(ssid, record1)
    history.push(ssid, record2)

    expect(history.slice(ssid)).toEqual([record1, record2])
  })

  test('should limit the number of history records per user', () => {
    const ssid = 'user2'
    const record1: HistoryRecord = { role: 'human', type: 'text', user: ssid, content: 'Hello' }
    const record2: HistoryRecord = { role: 'system', type: 'text', user: ssid, content: 'Hi' }
    const record3: HistoryRecord = { role: 'human', type: 'text', user: ssid, content: 'How are you?' }
    const record4: HistoryRecord = { role: 'system', type: 'text', user: ssid, content: 'I am fine' }

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
    const record1: HistoryRecord = { role: 'human', type: 'text', user: ssid, content: 'Hello' }
    const record2: HistoryRecord = { role: 'system', type: 'text', user: ssid, content: 'Hi' }
    const record3: HistoryRecord = { role: 'human', type: 'text', user: ssid, content: 'How are you?' }

    history.push(ssid, record1)
    history.push(ssid, record2)
    history.push(ssid, record3)

    expect(history.slice(ssid, 1, 3)).toEqual([record2, record3])
  })
})
