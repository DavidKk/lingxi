import type { FileBox } from 'file-box'
import { OK } from '@/core/constants/response'
import type { Robot } from '@/core/services/Robot'
import type { MessageContext, MessageMiddleware } from '@/core/types'
import { isFileBox, replyText, sendFile, sendText } from '@/core/utils/wechaty'

export type ChatContext = MessageContext & { robot: Robot }
export type ChatHandleResult = string | FileBox | FileBox[] | false | undefined
export type ChatHandle<T = ChatHandleResult> = (context: ChatContext) => Promise<T> | T

export interface ChatOptions {
  reply?: boolean
}

export function chat(handle: ChatHandle, options?: ChatOptions): MessageMiddleware {
  const { reply: shouldReply = false } = options || {}
  return function chatMiddlewareFactory(robot) {
    return async function chatMiddleware(context, next) {
      const { content, logger } = context

      // 忽略
      if (content === OK) {
        logger.warn(`Content is similar to machine generated, ignore. content: ${content}`)
        return
      }

      // 调用函数
      const result = await handle({ ...context, robot })

      // 跳过
      if (typeof result === 'undefined') {
        return next()
      }

      // Break
      if (result === false) {
        logger.info(`Finish session.`)
        return
      }

      // 批量发送文件
      if (Array.isArray(result)) {
        const files = result.filter((file) => isFileBox(file))
        for (const file of files) {
          await sendFile(context, file)
        }

        return
      }

      // 发送文件
      if (isFileBox(result)) {
        await sendFile(context, result)
        return
      }

      // 发送文字内容
      if (typeof result === 'string') {
        let replied = false
        if (shouldReply) {
          replied = await replyText(context, result)
        }

        if (replied === false) {
          await sendText(context, result)
        }

        return
      }

      // 处理不支持
      logger.fail(`Unknown content reply message fail. content: ${result}.`)
    }
  }
}
