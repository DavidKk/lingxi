import { format } from '@/core/utils'
import { notify } from '@/app/registries/httpRegistry'
import { generateNotificationMessage, isSonarrNotificationPayload, validateSonarrNotificationPayload } from './utils'
import type { SonarrNotificationPayload } from './types'

export default [
  notify<SonarrNotificationPayload>('/webhook/sonarr/notify', (context) => {
    const { data: payload, logger } = context
    logger.info(format('Received data: %o', payload))

    if (!isSonarrNotificationPayload(payload)) {
      const reason = validateSonarrNotificationPayload(payload)
      logger.warn(format(`Invalid Sonarr notification payload: ${reason}. data: %o`, payload))
      return
    }

    return generateNotificationMessage(payload)
  }),
]
