import { OK } from '@/core/constants/response'
import type { Robot } from '@/core/libs/Robot'
import { splitString } from '@/core/utils/splitString'
import { executePromisesSequentially } from '@/core/utils/executePromisesSequentially'
import { MAX_BYTES_SIZE } from '@/core/constants/wechaty'
import type { MessageContext, MessageMiddleware } from '@/core/types'

export type ChatContext = MessageContext & { robot: Robot }
export type ChatHandleResult = string | false | undefined
export type ChatHandle<T = ChatHandleResult> = (context: ChatContext) => Promise<T> | T

export interface ChatOptions {
  reply?: boolean
}

export function chat(handle: ChatHandle, options?: ChatOptions): MessageMiddleware {
  const { reply: shouldReply = false } = options || {}
  return function chatMiddlewareFactory(robot) {
    return async function chatMiddleware(context, next) {
      const { content, messager, logger } = context
      if (content === OK) {
        logger.warn(`Content is similar to machine generated, ignore. contnet: ${content}`)
        return
      }

      const result = await handle({ ...context, robot })
      if (typeof result === 'undefined') {
        return next()
      }

      if (result === false) {
        logger.info(`Finish session.`)
        return
      }

      logger.info(`Reply message. message: ${result}`)
      const messages = splitString(result, MAX_BYTES_SIZE)

      let replied = false
      if (shouldReply) {
        const talker = messager.talker()
        const uid = talker.id
        const room = messager.room()

        if (room) {
          const members = await room.memberAll()
          const member = members.find((member) => member.id === uid)

          if (member) {
            replied = true
            const chats = messages.map((message) => () => room.say(message, member))
            await executePromisesSequentially(...chats)
          }
        }
      }

      const chats = messages.map((message) => () => messager.say(message))
      replied === false && (await executePromisesSequentially(...chats))

      logger.ok(`Reply message success.`)
    }
  }
}
