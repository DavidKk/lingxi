import { reply } from '@/app/registries/chatRegistry/reply'

export default reply(async (context) => {
  const { isSelf, logger, gpt } = context
  if (isSelf) {
    logger.warn('This is my send message, skip.')
    return
  }

  if (!gpt) {
    logger.warn('No gpt instance, skip.')
    return
  }

  const content = await gpt.chat(context)
  if (!content) {
    logger.warn('Mention me but no message to reply, skip.')
    return
  }

  return content
})
