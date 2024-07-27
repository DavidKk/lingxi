import { clearAllAt } from '../../utils/clearAllAt'
import { chat, type ChatHandle } from './chat'

export function mention(handle: ChatHandle) {
  return chat(async (context) => {
    const { message, isRoom, messager } = context
    if (!(!isRoom || (await messager.mentionSelf()))) {
      return
    }

    const trimAtMessage = clearAllAt(message)
    return handle({ ...context, message: trimAtMessage })
  })
}
