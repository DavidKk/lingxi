import { command } from '@/core'

/** 调试 */
export default command(
  {
    command: '/debug',
    description: 'debug chat with Gemini.',
  },
  async (context) => {
    const { ssid, user, isSelf, message, logger, robot } = context
    if (!message.startsWith('debug')) {
      return
    }

    if (!isSelf) {
      logger.warn('Received debug message but not self, skip.')
      return
    }

    const debugMessage = message.replace(/^debug/, '').trim()
    const content = await robot.chatWithGemini(context, ssid, user, debugMessage)

    if (!content) {
      logger.warn('Debug chat but no message to reply, skip.')
      return
    }

    return content
  }
)
