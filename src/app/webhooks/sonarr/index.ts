import { format } from '@/core/utils'
import { say } from '@/app/registries/httpRegistry/say'
import { generateNotificationMessage, isSonarrNotificationPayload, validateSonarrNotificationPayload } from './generateNotificationMessage'
import type { SonarrNotificationPayload } from './types'

export default [
  say<{ data: SonarrNotificationPayload }>('/webhook/sonarr/notify', (context) => {
    const { data: payload, logger } = context
    logger.info(format('Received data: %o', payload))

    const data = payload?.data
    if (!isSonarrNotificationPayload(data)) {
      const reason = validateSonarrNotificationPayload(data)
      logger.warn(format(`Invalid Sonarr notification payload: ${reason}. data: %o`, data))
      return
    }

    return generateNotificationMessage(data)
  }),
]
