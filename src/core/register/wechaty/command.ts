import { trimCommands, type MessageMiddleware } from '@/core'
import { chat, type ChatHandle } from './chat'

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

export function command({ command, description, reply }: CommandParams, handle: ChatHandle): CommandMiddleware {
  if (command.charAt(0) !== '/') {
    throw new Error('Command name must start with "/"')
  }

  const middleware = chat(
    (context) => {
      const { isStar, isSelf, content, logger } = context
      if (!(isStar || isSelf)) {
        logger.debug('Not star or not mention me, skip.')
        return
      }

      if (!content.startsWith(command)) {
        logger.debug(`Not match command "${command}", skip.`)
        return
      }

      logger.info(`Hit command "${command}"`)

      const message = trimCommands(content, command)
      logger.info(`Command content "${message}"`)

      return handle({ ...context, content: message })
    },
    { reply }
  )

  return Object.assign(middleware, { command, description })
}
