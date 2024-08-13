import { mention } from '@/core'

export default mention(async (context) => {
  const { isSelf, logger, robot } = context
  if (isSelf) {
    logger.warn('This is my send message, skip.')
    return
  }

  const content = await robot.chatWithGemini(context)
  if (!content) {
    logger.warn('Mention me but no message to reply, skip.')
    return
  }

  return content
})
