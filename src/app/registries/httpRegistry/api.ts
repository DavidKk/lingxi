import { done } from '@/providers/HttpProvider'
import type { HttpHandle, HttpMiddleware } from './types'

/** 请求 API 注册器 */
export function api<T>(pattern: string, handle: HttpHandle<T>): HttpMiddleware<T> {
  return function applyMiddlewareFactory() {
    return [
      pattern,
      async function apiMiddleware(context) {
        const response = await handle(context)
        return done(context, 200, response)
      },
    ]
  }
}
