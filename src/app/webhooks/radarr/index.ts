import { format } from '@/core/utils'
import { notify } from '@/app/registries/httpRegistry'
import { generateNotificationMessage, isRadarrNotificationPayload, validateRadarrNotificationPayload } from './utils'
import type { RadarrNotificationPayload } from './types'

export default [
  notify<RadarrNotificationPayload>('/webhook/radarr/notify', (context) => {
    const { data: payload, logger } = context
    const data = payload?.data
    if (!data) {
      logger.warn('No data received')
      return
    }

    logger.info(format('Received data: %o', data))

    if (!isRadarrNotificationPayload(data)) {
      const reason = validateRadarrNotificationPayload(data)
      logger.warn(format(`Invalid Sonarr notification payload: ${reason}. data: %o`, data))
      return
    }

    return generateNotificationMessage(data)
  }),
]
