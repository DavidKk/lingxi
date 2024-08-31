import { Logger } from '@/core/libs/Logger'
import { OK } from '@/providers/HttpProvider'
import { isYes, modifyReturnValue, trimCommands } from '@/core/utils'
import type { Yes } from '@/core/types'
import { reply as createReplyMiddlewareFactory } from './reply'
import type { ChatHandle, ChatMiddlewareFactory } from './types'

export type Command = `/${string}`

export interface CommandParams {
  command: Command
  usage?: string
  description: string
  skipShouldReplyCheck?: Yes
}

export interface CommandMiddlewareFactory extends ChatMiddlewareFactory {
  command: Command
  usage?: string
  description: string
}

const logger = new Logger({ showTime: true })
export function command(params: CommandParams, handle: ChatHandle): CommandMiddlewareFactory {
  const { command, usage, description, skipShouldReplyCheck } = params

  if (command.charAt(0) !== '/') {
    throw new Error('Command name must start with "/"')
  }

  const replyMiddleware = createReplyMiddlewareFactory(
    async (context) => {
      const { content, logger } = context
      logger.info(`Hit command "${command}"`)

      const message = trimCommands(content, command)
      logger.info(message ? `Command content "${message}"` : 'No message content, skip.')

      const response = handle({ ...context, content: message })
      return modifyReturnValue(response, (res) => (res === true ? OK : res))
    },
    { skipShouldReplyCheck }
  )

  const commandMiddlewareFactory: ChatMiddlewareFactory = (payload) => {
    const applyReplyMiddleware = replyMiddleware(payload)
    const { client } = payload

    return async function commandMiddleware(context, next) {
      const { isStar, isSelf, content, logger } = context
      if (!(isStar || isSelf)) {
        logger.debug('Not star or not self, skip.')
        return next()
      }

      if (!content.startsWith(command)) {
        logger.debug(`Not match command "${command}", skip`)
        return next()
      }

      // 只有不跳过才检查
      if (!isYes(skipShouldReplyCheck)) {
        logger.debug(`Skip should reply check`)

        // 无需回复
        if (!(await client.shouldReply(context))) {
          logger.debug(`Should not reply, skip`)
          return next()
        }
      }

      return applyReplyMiddleware(context, next)
    }
  }

  logger.info(`Register command: "<Bold:${command}>"`)
  return Object.assign(commandMiddlewareFactory, { command, usage, description })
}
