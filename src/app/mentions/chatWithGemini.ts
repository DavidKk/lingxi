import { mention } from '@/core'

export default mention(async (context) => {
  const { ssid, user, message, logger, robot } = context
  const content = await robot.chatWithGemini(context, ssid, user, message)
  if (!message) {
    logger.warn('Mention me but no message to reply, skip.')
    return
  }

  return content
})
