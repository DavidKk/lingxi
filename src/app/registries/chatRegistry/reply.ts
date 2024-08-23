import type { Yes } from '@/core/types'
import { OK } from '@/providers/HttpProvider'
import type { ReplyMessage } from '@/providers/types'
import type { ChatHandle, ChatMiddlewareFactory } from './types'

export interface ReplyOptions {
  reply?: Yes
}

export function reply(handle: ChatHandle, options?: ReplyOptions): ChatMiddlewareFactory {
  const { reply: shouldReply } = options || {}
  return function chatMiddlewareFactory(payload) {
    const { client } = payload
    return async function chatMiddleware(context, next) {
      const { content, logger } = context
      // 忽略
      if (content === OK) {
        logger.warn(`Content is similar to machine generated, ignore. content: ${content}`)
        return
      }

      // 无需回复
      if (!(await client.shouldReply(context))) {
        logger.warn(`Should not reply, skip.`)
        return
      }

      // 调用函数
      const replyContext = { ...context, ...payload }
      const result = await handle(replyContext)

      // 跳过
      if (typeof result === 'undefined') {
        return next()
      }

      // Break
      if (result === false) {
        logger.info(`Finish session.`)
        return
      }

      // 回复
      client.reply<ReplyMessage>(context, { shouldReply, content: result })
    }
  }
}
