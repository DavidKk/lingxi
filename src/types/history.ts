/** 历史记录 */
export interface HistoryRecord {
  role: 'human' | 'system'
  user: string
  message: string
}
