import { format } from '@/core/utils'
import { notify } from '@/app/registries/httpRegistry'
import { generateNotificationMessage, isSonarrNotificationPayload, validateSonarrNotificationPayload } from './utils'
import type { SonarrNotificationPayload } from './types'

export default [
  notify<SonarrNotificationPayload>('/webhook/sonarr/notify', (context) => {
    const { data: payload, logger } = context
    const data = payload?.data
    if (!data) {
      logger.warn('No data received')
      return
    }

    logger.info(format('Received data: %o', data))

    if (!isSonarrNotificationPayload(data)) {
      const reason = validateSonarrNotificationPayload(data)
      logger.warn(format(`Invalid Sonarr notification payload: ${reason}. data: %o`, data))
      return
    }

    return generateNotificationMessage(data)
  }),
]
