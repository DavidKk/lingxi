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
  const { ssid, isSelf, user, message, messager, logger } = ctx
  if (!message.startsWith('debug')) {
    return next()
  }

  if (!isSelf) {
    return next()
  }

  const debugMessage = message.replace(/^debug/, '').trim()
  const content = await robot.chatWithGemini(ssid, user, debugMessage)
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
  const { ssid, user, message, messager, logger } = ctx
  if (!(await messager.mentionSelf())) {
    return next()
  }

  const mentionMessage = message.trim()
  const content = await robot.chatWithGemini(ssid, user, mentionMessage)
  if (!content) {
    logger.warn('Mention isSelf but no message to reply, skip.')
    return next()
  }

  logger.info(`Mention isSelf, reply: ${content}`)
  await messager.say(content)
  logger.ok(`Reply message success. content: ${content}`)
}

export const chatMiddleware = combineMiddlewares(ding, debug, mentionSelf)
