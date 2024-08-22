import { FileBox } from 'file-box'
import { splitString, executePromisesSequentially, format } from '@/core/utils'
import { MAX_BYTES_SIZE } from './constants'
import type { WeChatyMessageContext, WeChatyImageMessageContext, WeChatyTextMessageContext } from './types'

/** 发送文件 */
export async function sendFile(context: WeChatyMessageContext, file: FileBox) {
  const { messager, logger } = context
  if (!(file instanceof FileBox)) {
    return false
  }

  logger.info(`Reply file. file: ${file.name}`)
  await messager.say(file)
  return true
}

/** 回复文本 */
export async function replyText(context: WeChatyMessageContext, content: string) {
  const { messager, logger } = context
  if (!(typeof content === 'string')) {
    return false
  }

  logger.info(`Reply message. message: ${content}`)

  const messages = splitString(content, MAX_BYTES_SIZE)
  const talker = messager.talker()
  const uid = talker.id
  const room = messager.room()

  if (!room) {
    return false
  }

  const members = await room.memberAll()
  const member = members.find((member) => member.id === uid)

  if (!member) {
    return false
  }

  const chats = messages.map((message) => () => room.say(message, member))
  await executePromisesSequentially(...chats)

  logger.ok(`Reply message success.`)
  return true
}

/** 发送文本 */
export async function sendText(context: WeChatyMessageContext, content: string) {
  const { messager, logger } = context
  if (!(typeof content === 'string')) {
    return false
  }

  logger.info(format(`Send text message. %o`, { message: content }))

  const messages = splitString(content, MAX_BYTES_SIZE)
  const chats = messages.map((message) => () => messager.say(message))
  await executePromisesSequentially(...chats)

  logger.ok(`Reply text message success.`)
  return true
}

/** 是否为文件 */
export function isFileBox(target: any): target is FileBox {
  return target instanceof FileBox
}

/** 是否为图片上下文 */
export function isImageMessageContext(context: any): context is WeChatyImageMessageContext {
  return 'isImageMessage' in context && !!context.isImageMessage
}

/** 是否为文本上下文 */
export function isTextMessageContext(context: any): context is WeChatyTextMessageContext {
  return 'isTextMessage' in context && !!context.isTextMessage
}

/** 是否为 WeChaty 上下文 */
export function isWeChatyContext(context: any): context is WeChatyMessageContext {
  return isImageMessageContext(context) || isTextMessageContext(context)
}
