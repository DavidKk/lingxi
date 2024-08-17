import { say } from '@/core'

export default say('/webhook/test', (context) => {
  const { data, logger } = context
  const message = data?.message || ''
  logger.info(`send message: ${message}`)

  return message
})
