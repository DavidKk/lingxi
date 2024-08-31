import { isYes } from '@/core/utils'
import type { Yes } from '@/core/types'
import { done } from '@/providers/HttpProvider'
import type { SayMessage } from '@/providers/types'
import type { HttpHandle, HttpMiddleware } from './types'

/** 请求数据体 */
export interface SayReqMessage {
  star?: Yes
  alias?: string
}

/** 发送聊天信息 */
export function say<T>(pattern: string, handle: HttpHandle<SayReqMessage & T>): HttpMiddleware<SayReqMessage & T> {
  return function sayMiddlewareFactory(client) {
    return [
      pattern,
      async function sayMiddleware(context, next) {
        const { data: reqBody, logger } = context
        if (!(typeof reqBody === 'object' && reqBody)) {
          logger.warn('Say but no data, skip.')
          return next()
        }

        if (!client.status.logined) {
          logger.warn('Say but not login, skip.')
          return next()
        }

        const { star, alias } = reqBody
        const resContent = await handle(context)
        if (!(typeof resContent === 'string' && resContent)) {
          logger.fail(`Say but no content, skip`)
          return done(context, 500, 'content is missing.')
        }

        const shouldSay = isYes(star) || (typeof alias === 'string' && alias)
        if (!shouldSay) {
          logger.fail(`Say but no alias or star, skip. messsage: ${resContent}`)
          return done(context, 400, 'alias or star is required.')
        }

        await client.say<SayMessage>(context, { star, alias, message: resContent })
        logger.info(`Say completed`)

        return done(context, 200, 'ok')
      },
    ]
  }
}
