import axios from 'axios'
import { CoreService, type CoreServiceOptions } from '@/core/libs/CoreService'
import { createHeader } from '@/core/utils/createHeader'
import { format } from '@/core/utils/format'
import { SERVER_NAME } from '@/core/constants/conf'

/** 信息格式 */
export type AppriseMessageFormat = 'text' | 'markdown' | 'html'

/** 信息类型 */
export type AppriseMessageType = 'info' | 'success' | 'warning' | 'failure'

/** 信息配置接口 */
export interface AppriseMessage {
  /* 消息主体内容 */
  body: string
  /* 消息标题（可选） */
  title?: string
  /* 消息类型（可选） */
  type?: AppriseMessageType
  /* 消息格式（可选） */
  format?: AppriseMessageFormat
  /* 标签（可选），可以是字符串或字符串数组 */
  tags?: string | string[]
}

export interface AppriseOptions extends CoreServiceOptions {
  /* Apprise 服务器的 URL */
  serverUrl: string
}

/** Apprise 服务类 */
export class Apprise extends CoreService {
  /* 服务器 URL */
  protected serverUrl: string

  constructor(options: AppriseOptions) {
    super(options)

    const { serverUrl } = options
    /* 初始化服务器 URL */
    this.serverUrl = serverUrl
  }

  /** 发送通知 */
  async notify(message: AppriseMessage) {
    // 如果未设置 serverUrl，则跳过通知
    if (!this.serverUrl) {
      this.logger.warn('serverUrl is not set, skip notify')
      return
    }

    // 处理标签
    const { tags, ...rest } = message
    const tag = (() => {
      if (Array.isArray(tags)) {
        return tags.filter((tag) => typeof tag === 'string')
      }

      if (typeof tags === 'string') {
        return [tags]
      }

      return []
    })()

    /* 构造消息体 */
    const body = { ...rest, tag: [SERVER_NAME, ...tag] }
    const headers = createHeader(body)
    this.logger.info(format(`Send notify to apprise server. url: ${this.serverUrl}; headers: %o; body: %o`, headers, body))

    try {
      await axios.post(this.serverUrl, body, { headers })
    } catch (error) {
      const reason = format(`Notify apprise failed: ${error}. message: %o`, body)
      this.logger.fail(reason)

      throw new Error(reason)
    }
  }
}
