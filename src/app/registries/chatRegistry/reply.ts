import type { Yes } from '@/core/types'
import { OK } from '@/providers/HttpProvider'
import type { ReplyMessage } from '@/providers/types'
import { isYes } from '@/core/utils'
import type { ChatHandle, ChatMiddlewareFactory } from './types'
import { processMarkdownToTextAndImages } from '@/app/services/kroki'

export interface ReplyOptions {
  skipShouldReplyCheck?: Yes
}

export function reply(handle: ChatHandle, options?: ReplyOptions): ChatMiddlewareFactory {
  const { skipShouldReplyCheck } = options || {}
  return function chatMiddlewareFactory(payload) {
    const { client } = payload

    return async function chatMiddleware(context, next) {
      const { content, logger } = context

      // 忽略
      if (content === OK) {
        logger.warn(`Content is similar to machine generated, ignore. content: ${content}`)
        return
      }

      // 只有不跳过才检查
      if (!isYes(skipShouldReplyCheck)) {
        logger.debug(`Skip should reply check`)

        // 无需回复
        if (!(await client.shouldReply(context))) {
          logger.debug(`Should not reply, skip`)
          return
        }
      }

      // 调用函数
      const replyContext = { ...context, ...payload }
      const response = await handle(replyContext)

      // 跳过
      if (typeof response === 'undefined') {
        logger.debug(`Skip reply`)
        return next()
      }

      // Break
      if (response === false) {
        logger.info(`Session finished`)
        return
      }

      logger.info('use kroki to process markdown charts')

      // 将 markdown 图表代码块转成图片
      const results = await processMarkdownToTextAndImages(response)

      // 回复
      client.reply<ReplyMessage>(context, {
        skipShouldReplyCheck,
        content: results,
      })
    }
  }
}
