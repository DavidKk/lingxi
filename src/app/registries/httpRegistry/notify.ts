import type { Yes } from '@/core/types'
import { done } from '@/providers/HttpProvider'
import type { HttpHandle, HttpMiddleware } from './types'

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
export function notify<T extends Record<string, any>>(pattern: string, handle: HttpHandle<T & NotifyPayload>): HttpMiddleware<T> {
  return function applyMiddlewareFactory() {
    return [
      pattern,
      async function apiMiddleware(context) {
        const { data } = context
        const notifyBody = { star: true, ...data } as T & NotifyPayload
        const notifyContext = { ...context, data: notifyBody }
        const response = await handle(notifyContext)
        return done(context, 200, response)
      },
    ]
  }
}
