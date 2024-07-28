import type { Robot } from '../../libs/Robot'
import type { MessageContext, MessageMiddleware } from '../../types'

export type ChatContext = MessageContext & { robot: Robot }
export type ChatHandleResult = string | false | undefined
export type ChatHandle = (context: ChatContext) => Promise<ChatHandleResult> | ChatHandleResult

export interface ChatOptions {
  reply?: boolean
}

export function chat(handle: ChatHandle, options?: ChatOptions): MessageMiddleware {
  const { reply: shouldReply = false } = options || {}
  return function chatMiddlewareFactory(robot) {
    return async function chatMiddleware(context, next) {
      const { messager, logger } = context
      const result = await handle({ ...context, robot })
      if (typeof result === 'undefined') {
        return next()
      }

      if (result === false) {
        logger.info(`Finish session.`)
        return
      }

      logger.info(`Reply message. message: ${result}`)

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
            await room.say(result, member)
          }
        }
      }

      replied === false && (await messager.say(result))
      logger.ok(`Reply message success.`)
    }
  }
}
