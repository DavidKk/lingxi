import { command } from '@/core'

/** 调试 */
export default command(
  {
    command: '/debug',
    description: 'debug chat with Gemini.',
  },
  async (context) => {
    const { isSelf, logger, robot } = context
    if (!isSelf) {
      logger.debug('Received debug message but not self, skip.')
      return
    }

    const content = await robot.chatWithGemini(context)
    if (!content) {
      logger.debug('Debug chat but no message to reply, skip.')
      return
    }

    return content
  }
)
