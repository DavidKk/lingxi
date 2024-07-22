import { Robot } from '@/libs/Robot'
import { combineMiddlewares } from '@/utils/combineMiddlewares'
import type { MessageMiddleware } from '@/types'

const robot = new Robot()

/** 健康检查 */
const ding: MessageMiddleware = async (ctx, next) => {
  const { message, messager, logger } = ctx
  if (message !== 'ding') {
    return next()
  }

  await messager.say('dong')
}

/** 调试 */
const debug: MessageMiddleware = async (ctx, next) => {
  const { self, user, message, messager, logger } = ctx
  if (!message.startsWith('debug')) {
    return next()
  }

  if (!self) {
    return next()
  }

  const debugMessage = message.replace(/^debug/, '').trim()
  const content = await robot.chatWithGemini(user, debugMessage)
  if (!content) {
    logger.warn('Debug chat but no message to reply, skip.')
    return next()
  }

  logger.info(`Debug chat and reply ${content}`)
  await messager.say(content)
  logger.ok(`Reply message success.`)
}

/** 提到我 */
const mentionSelf: MessageMiddleware = async (ctx, next) => {
  const { user, message, messager, logger } = ctx
  if (!(await messager.mentionSelf())) {
    return next()
  }

  const mentionMessage = message.trim()
  const content = await robot.chatWithGemini(user, mentionMessage)
  if (!content) {
    logger.warn('Mention self but no message to reply, skip.')
    return next()
  }

  logger.info(`Mention self, reply: ${content}`)
  await messager.say(content)
  logger.ok(`Reply message success. content: ${content}`)
}

export const mentionMiddleware = combineMiddlewares(ding, debug, mentionSelf)
