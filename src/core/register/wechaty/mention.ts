import { chat, type ChatHandle } from './chat'

export function mention(handle: ChatHandle) {
  return chat(async (context) => {
    const { content, isRoom, messager, logger } = context
    if (isRoom && !(await messager.mentionSelf())) {
      logger.debug('In chat room, but not mention me, skip mention.')
      return
    }

    return handle({ ...context, content })
  })
}
