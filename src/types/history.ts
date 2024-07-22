/** 历史记录 */
export interface History {
  role: 'human' | 'system'
  user: string
  message: string
}
