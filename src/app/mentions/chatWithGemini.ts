import { mention } from '@/core'

export default mention(async (context) => {
  const { logger, robot } = context
  const content = await robot.chatWithGemini(context)
  if (!content) {
    logger.warn('Mention me but no message to reply, skip.')
    return
  }

  return content
})
