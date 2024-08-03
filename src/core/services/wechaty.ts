import { FileBox } from 'file-box'
import { splitString } from '@/core/utils/splitString'
import { executePromisesSequentially } from '@/core/utils/executePromisesSequentially'
import { MAX_BYTES_SIZE } from '@/core/constants/wechaty'
import type { GeminiContent, MessageContext, ImageMessageContext, TextMessageContext } from '@/core/types'

/** 发送文件 */
export async function sendFile(context: MessageContext, file: FileBox) {
  const { messager, logger } = context
  if (!(file instanceof FileBox)) {
    return false
  }

  logger.info(`Reply file. file: ${file.name}`)
  await messager.say(file)
  return true
}

/** 回复文本 */
export async function replyText(context: MessageContext, content: string) {
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
export async function sendText(context: MessageContext, content: string) {
  const { messager, logger } = context
  if (!(typeof content === 'string')) {
    return false
  }

  logger.info(`Send message. message: ${content}`)

  const messages = splitString(content, MAX_BYTES_SIZE)
  const chats = messages.map((message) => () => messager.say(message))
  await executePromisesSequentially(...chats)

  logger.ok(`Reply message success.`)
  return true
}

/** 是否为文件 */
export function isFileBox(target: any): target is FileBox {
  return target instanceof FileBox
}

/** 是否为图片信息 */
export function isImageMessage(contents: GeminiContent[]) {
  for (const content of contents) {
    for (const part of content.parts) {
      if ('inlineData' in part) {
        return true
      }
    }
  }

  return false
}

/** 是否为图片上下文 */
export function isImageMessageContext(context: any): context is ImageMessageContext {
  return 'isImageMessage' in context && !!context.isImageMessage
}

/** 是否为文本上下文 */
export function isTextMessageContext(context: any): context is TextMessageContext {
  return 'isTextMessage' in context && !!context.isTextMessage
}
