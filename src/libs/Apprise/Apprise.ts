import axios from 'axios'
import { SERVER_NAME, APPRISE_SERVER_URL } from '@/constants/conf'
import { createHeader } from '@/utils/createHeader'
import { Logger } from '@/libs/Logger'
import type { Message } from './types'

export class Apprise {
  protected logger = new Logger({ name: 'Apprise' })

  async notify(message: Message) {
    if (!APPRISE_SERVER_URL) {
      this.logger.warn('APPRISE_SERVER_URL is not set, skip notify')
      return
    }

    try {
      const body = { ...message, tag: [SERVER_NAME] }
      const headers = createHeader(body)
      this.logger.info(`Send notify to apprise server. url: ${APPRISE_SERVER_URL}; headers: ${headers}; body: ${JSON.stringify(body, null, 2)}`)
      await axios.post(APPRISE_SERVER_URL, body, { headers })
    } catch (error) {
      this.logger.fail(`Notify failed: ${error}`)
    }

    this.logger.ok('Notify sent successfully')
  }
}
