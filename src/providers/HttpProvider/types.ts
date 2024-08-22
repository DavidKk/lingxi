import type { IncomingMessage, ServerResponse } from 'http'
import type { Context } from '@/core/types/context'

export type HttpRequest = IncomingMessage
export type HttpResponse = ServerResponse & { req: HttpRequest }

export interface HttpRequestContext<T = any> extends Context {
  req: HttpRequest
  res: HttpResponse
  /** 地址 */
  url: string
  /** search 参数 */
  query: Record<string, any>
  /** 头部信息 */
  headers: Record<string, any>
  /** 路由参数 */
  params: Record<string, any>
  /** body 参数 */
  data?: T
}
