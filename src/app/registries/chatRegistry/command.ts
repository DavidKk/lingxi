import { Logger } from '@/core/libs/Logger'
import { OK } from '@/providers/HttpProvider'
import { modifyValue, trimCommands } from '@/core/utils'
import type { Yes } from '@/core/types'
import { reply as chat } from './reply'
import type { ChatHandle, ChatMiddlewareFactory } from './types'

export type Command = `/${string}`

export interface CommandParams {
  command: Command
  usage?: string
  description: string
  reply?: Yes
}

export interface CommandMiddlewareFactory extends ChatMiddlewareFactory {
  command: Command
  usage?: string
  description: string
}

const logger = new Logger({ showTime: true })
export function command(params: CommandParams, handle: ChatHandle): CommandMiddlewareFactory {
  const { command, usage, description, reply } = params
  if (command.charAt(0) !== '/') {
    throw new Error('Command name must start with "/"')
  }

  const middleware = chat(
    async (context) => {
      const { isStar, isSelf, content, logger, client } = context
      if (!(isStar || isSelf)) {
        logger.debug('Not star or not self, skip.')
        return
      }

      if (!(await client.shouldReply(context))) {
        logger.debug('Not should reply, skip.')
        return
      }

      if (!content.startsWith(command)) {
        logger.debug(`Not match command "${command}", skip.`)
        return
      }

      logger.info(`Hit command "${command}"`)

      const message = trimCommands(content, command)
      logger.info(`Command content "${message}"`)

      const response = handle({ ...context, content: message })
      return modifyValue(response, (res) => (res === true ? OK : res))
    },
    { reply }
  )

  logger.info(`Register command "<Bold:${command}>"`)
  return Object.assign(middleware, { command, usage, description })
}
