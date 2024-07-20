import type { Middleware, MessageContext } from '@/types'

export const mentionMiddleware: Middleware<MessageContext> = async (ctx, next) => {
  const { logger, messager } = ctx
  if (!(await messager.mentionSelf())) {
    logger.info('Not mention self, skip.')
    next()
    return
  }

  logger.info('Mention self, reply message.')
}
