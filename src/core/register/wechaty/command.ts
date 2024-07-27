import type { MessageMiddleware } from '@/core/types'
import { clearAllAt } from '../../utils/clearAllAt'
import type { ChatHandle } from './chat'
import { chat } from './chat'

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
      const { isStar, message: content, logger } = context
      const trimAtMessage = clearAllAt(content)
      if (!isStar) {
        logger.debug('Not star, skip.')
        return
      }

      if (!trimAtMessage.startsWith(command)) {
        logger.debug(`Not match command "${command}", skip.`)
        return
      }

      logger.info(`hit command "${command}"`)
      const surplus = trimAtMessage.substring(command.length)

      let message = ''
      if (surplus.startsWith(' ')) {
        message = surplus.substring(1)
      }

      logger.info(`command content "${message}"`)
      return handle({ ...context, message })
    },
    { reply }
  )

  return Object.assign(middleware, { command, description })
}
