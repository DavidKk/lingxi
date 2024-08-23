import type { Yes } from '@/core/types'
import type { HttpHandle, HttpMiddleware } from './types'
import { format } from '@/core/utils'
import { say } from './say'

export interface NotifyPayload {
  /** 发送给星标用户 */
  star: Yes
  /** 发送给特定别名用户 */
  alias: string
}

/**
 * 请求通知注册器
 *
 * 自动携带 star 参数
 */
export function notify<T extends Record<string, any>>(pattern: string, handle: HttpHandle<NotifyPayload & { data: T }>): HttpMiddleware<T> {
  return say<T>(pattern, async (context) => {
    const { data, logger } = context

    const notifyData = { star: true, data } as NotifyPayload & { data: T }
    const notifyContext = { ...context, data: notifyData }
    const contnet = handle(notifyContext)

    logger.info(format('Notification content: %s', contnet))
    return contnet
  })
}
