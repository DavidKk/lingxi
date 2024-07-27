import axios from 'axios'
import { SERVER_NAME, APPRISE_SERVER_URL } from '../constants/conf'
import { createHeader } from '../utils/createHeader'
import { Service, type ServiceOptions } from './Service'

/** 信息格式 */
export type AppriseMessageFormat = 'text' | 'markdown' | 'html'

/** 信息类型 */
export type AppriseMessageType = 'info' | 'success' | 'warning' | 'failure'

/** 信息配置 */
export interface AppriseMessage {
  body: string
  title?: string
  type?: AppriseMessageType
  format?: AppriseMessageFormat
}

export type AppriseOptions = ServiceOptions

export class Apprise extends Service {
  async notify(message: AppriseMessage) {
    if (!APPRISE_SERVER_URL) {
      this.logger.warn('APPRISE_SERVER_URL is not set, skip notify')
      return
    }

    try {
      const body = { ...message, tag: [SERVER_NAME] }
      const headers = createHeader(body)
      this.logger.info(`Send notify to apprise server. url: ${APPRISE_SERVER_URL}; headers: ${headers}; body: ${JSON.stringify(body, null, 2)}`)

      await axios.post(APPRISE_SERVER_URL, body, { headers })
      this.logger.ok('Notify sent successfully')
    } catch (error) {
      this.logger.fail(`Notify failed: ${error}`)
    }

    this.logger.ok('Notify sent successfully')
  }
}
