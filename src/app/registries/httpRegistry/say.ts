import { done } from '@/providers/HttpProvider'
import type { SayMessage } from '@/providers/types'
import type { HttpHandle, HttpMiddleware } from './types'
import { isYes } from '@/core/utils'

/** 发送聊天信息 */
export function say(pattern: string, handle: HttpHandle<SayMessage>): HttpMiddleware<SayMessage> {
  return function sayMiddlewareFactory(client) {
    return [
      pattern,
      async function sayMiddleware(context, next) {
        const { data, logger } = context

        if (!(typeof data === 'object' && data)) {
          logger.warn('Say but no data, skip.')
          return next()
        }

        if (!client.status.logined) {
          logger.warn('Say but not login, skip.')
          return next()
        }

        const { star, alias, message } = data
        if (!(typeof message === 'string' && message)) {
          logger.warn('Say but no message, skip.')
          return done(context, 400, 'message is required.')
        }

        const content = await handle(context)
        if (!(typeof content === 'string' && content)) {
          logger.fail(`Say but no content, skip. messsage: ${message}`)
          return done(context, 500, 'content is missing.')
        }

        const shouldSay = isYes(star) || (typeof alias === 'string' && alias)
        if (!shouldSay) {
          logger.fail(`Say but no alias or star, skip. messsage: ${message}`)
          return done(context, 400, 'alias or star is required.')
        }

        await client.say<SayMessage>(context, data)
        logger.info(`Say completed.`)
        return done(context, 200, 'ok')
      },
    ]
  }
}
