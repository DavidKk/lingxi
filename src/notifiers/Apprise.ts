import axios from 'axios'
import type { CoreServiceOptions } from '@/core/libs/CoreServiceAbstract'
import { Notifier } from '@/core/libs/Notifier'
import type { ContentType, NotifierMessage } from '@/core/libs/Notifier'
import { createHeader, format } from '@/core/utils'
import { SERVER_NAME } from '@/core/constants/conf'

export interface AppriseOptions extends CoreServiceOptions {
  /* Apprise 服务器的 URL */
  serverUrl: string
  /** 通知的标签 */
  tags?: string | string[]
}

/** Apprise 服务类 */
export class Apprise extends Notifier {
  static contentTypeSupports: ContentType[] = ['html', 'text', 'markdown']

  /* 服务器 URL */
  protected serverUrl: string
  /** Apprise 标签 */
  protected tags: string[]

  constructor(options: AppriseOptions) {
    super(options)

    const { serverUrl, tags = [] } = options
    this.serverUrl = serverUrl
    this.tags = (() => {
      if (Array.isArray(tags)) {
        return tags.filter((tag) => typeof tag === 'string')
      }

      if (typeof tags === 'string') {
        return [tags]
      }

      return []
    })()
  }

  /** 发送通知 */
  public async send(message: NotifierMessage) {
    // 如果未设置 serverUrl，则跳过通知
    if (!this.serverUrl) {
      this.logger.warn('serverUrl is not set, skip notify')
      return
    }

    /* 构造消息体 */
    const tag = [SERVER_NAME, ...this.tags]
    const body = { ...message, tag }
    const headers = createHeader(body)
    this.logger.info(format(`Send notify to apprise server. url: ${this.serverUrl}; headers: %o; body: %o`, headers, body))

    await axios.post(this.serverUrl, body, { headers }).catch((error) => {
      const reason = format(`Notify apprise failed: ${error}. message: %o`, body)
      this.logger.fail(reason)

      return Promise.reject(error)
    })

    this.logger.ok('Notify sent successfully')
  }
}
