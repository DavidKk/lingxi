import { Logger, trimCommands, type MessageMiddleware } from '@/core'
import { chat } from './chat'
import type { ChatHandleResult, ChatHandle } from './chat'
import { OK } from '@/core/constants/response'
import { modifyValue } from '@/core/utils/modifyValue'

export type Command = `/${string}`

export interface CommandMiddleware extends MessageMiddleware {
  command: Command
  description: string
}

export interface CommandParams {
  command: Command
  description: string
  reply?: boolean
}

const logger = new Logger({ showTime: true })

export function command({ command, description, reply }: CommandParams, handle: ChatHandle<true | ChatHandleResult>): CommandMiddleware {
  if (command.charAt(0) !== '/') {
    throw new Error('Command name must start with "/"')
  }

  logger.info(`Register command "<Bold:${command}>"`)

  const middleware = chat(
    (context) => {
      const { isStar, isSelf, content, logger } = context
      if (!(isStar || isSelf)) {
        logger.debug('Not star or not self, skip.')
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

  return Object.assign(middleware, { command, description })
}
