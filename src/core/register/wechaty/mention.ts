import { chat, type ChatHandle } from './chat'

export function mention(handle: ChatHandle) {
  return chat(async (context) => {
    const { content, isRoom, messager, logger } = context
    if (!isRoom) {
      logger.debug('Not a room, skip mention.')
      return
    }

    const mentionMe = await messager.mentionSelf()
    if (!mentionMe) {
      logger.debug('Not mention me, skip mention.')
      return
    }

    return handle({ ...context, content })
  })
}
