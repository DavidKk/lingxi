import type { ChatClientAbstract } from '@/core/libs/ChatClientAbstract'
import type { Middleware } from '@/core/libs/MiddlewareCoordinator'
import type { RequestContext } from '@/providers/types'

export type HttpContext<T> = RequestContext<T>
export type HttpHandle<T> = (context: HttpContext<T>) => Promise<any> | any
export type HttpMiddleware<T> = (client: ChatClientAbstract<any>) => [string, Middleware<HttpContext<T>>]
