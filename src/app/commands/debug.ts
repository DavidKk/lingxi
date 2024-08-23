import { command } from '@/app/registries/chatRegistry/command'

/** 调试 */
export default command(
  {
    command: '/debug',
    usage: '/debug [message]',
    description: 'debug chat with Gemini.',
  },
  async (context) => {
    const { isSelf, logger, gpt } = context
    if (!isSelf) {
      logger.debug('Received debug message but not self, skip.')
      return
    }

    if (!gpt) {
      logger.warn('No gpt instance, skip.')
      return
    }

    const content = await gpt.chat(context)
    if (!content) {
      logger.debug('Debug chat but no message to reply, skip.')
      return
    }

    return content
  }
)
