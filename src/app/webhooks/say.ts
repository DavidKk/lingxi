import { say } from '@/app/registries/httpRegistry/say'

export default say<{ message: string }>('/webhook/say', async (context) => {
  const { data, logger } = context
  const message = data?.message || ''

  logger.info(`send message: "${message}"`)

  return message
})
