import { say } from '@/core'

export default say((context) => {
  const { data } = context
  const message = data?.message || ''
  return message
})
