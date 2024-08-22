import { format } from '@/core/utils'
import { api } from '../registries/httpRegistry/api'

export default api('/webhook/test', (context) => {
  const { data, logger } = context
  logger.info(format('Received data: %o', data))
  return 'ok'
})
