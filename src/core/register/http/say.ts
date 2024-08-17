import type { RequestContext } from '@/core/types'
import type { RequestMiddleware } from '@/core/types/middleware'
import type { ContactInterface, WechatyInterface } from 'wechaty/impls'
import { done } from '@/core/utils/http'

export type Yes = 'yes' | true

export interface SayPayload {
  /** 星标好友 */
  star: boolean | Yes
  /** 指定好友（备注） */
  alias: string
  /** 聊天信息 */
  message: string
}

export type SayContext = RequestContext<SayPayload> & { wechaty: WechatyInterface }
export type SayHandle = (context: SayContext) => Promise<string> | string

/** 发送聊天信息 */
export function say(pattern: string, handle: SayHandle): RequestMiddleware<SayContext> {
  return function sayMiddlewareFactory(wechaty) {
    return [
      pattern,
      async function sayMiddleware(context, next) {
        const { data, logger } = context

        if (!(typeof data === 'object' && data)) {
          logger.warn('Say but no data, skip.')
          return next()
        }

        if (!wechaty.isLoggedIn) {
          logger.warn('Say but not login, skip.')
          return next()
        }

        const { star, alias, message } = data
        if (!(typeof message === 'string' && message)) {
          logger.warn('Say but no message, skip.')
          return done(context, 400, 'message is required.')
        }

        const wechatyConetxt = { ...context, wechaty }
        const content = await handle(wechatyConetxt)
        if (!(typeof content === 'string' && content)) {
          logger.fail(`Say but no content, skip. messsage: ${message}`)
          return done(context, 500, 'content is missing.')
        }

        const shouldSay = star === 'yes' || (typeof star === 'boolean' && star === true) || (typeof alias === 'string' && alias)
        if (!shouldSay) {
          logger.fail(`Say but no alias or star, skip. messsage: ${message}`)
          return done(context, 400, 'alias or star is required.')
        }

        if (star) {
          await sayToStar(wechatyConetxt, content)
        } else if (typeof alias === 'string' && alias) {
          await sayToAlias(wechatyConetxt, alias, content)
        }

        logger.info(`Say completed.`)
        return done(context, 200, 'ok')
      },
    ]
  }
}

/** 与所有星标好友聊天 */
async function sayToStar(context: SayContext, message: string) {
  const { wechaty, logger } = context
  const contacts = await wechaty.Contact.findAll()
  if (!contacts.length) {
    logger.warn(`Can not find any contacts.`)
    return
  }

  const stars = contacts.filter((contact) => contact.star())
  if (!stars) {
    logger.warn(`Can not find stared contacts.`)
    return
  }

  const names = stars.map((contact) => contact.name())
  logger.info(`Say to ${names}: ${message}`)
  const senders = stars.map((contact) => contact.say(message))
  const results = await Promise.allSettled(senders)

  for (const index in results) {
    const name = names[index]
    const result = results[index]
    if (result.status === 'fulfilled') {
      logger.ok(`Say to ${name} successed.`)
    } else {
      logger.fail(`Say to ${name} failed: ${result.reason}`)
    }
  }
}

/** 与指定备注好友聊天 */
async function sayToAlias(context: SayContext, alias: string, message: string) {
  const { wechaty, logger } = context
  const contacts = await wechaty.Contact.findAll()
  if (!contacts.length) {
    logger.warn(`Can not find any contacts.`)
    return
  }

  let matchContact: ContactInterface | undefined
  for (const contact of contacts) {
    if ((await contact.alias()) === alias) {
      matchContact = contact
      break
    }
  }

  if (typeof matchContact === 'undefined') {
    logger.warn(`Can not find contact by alias: ${alias}.`)
    return
  }

  logger.info(`Say to ${alias}: ${message}`)
  await matchContact.say(message)
  logger.ok(`Say to ${alias} successed.`)
}
