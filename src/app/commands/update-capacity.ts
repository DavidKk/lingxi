import { OK } from '@/providers/HttpProvider'
import { command } from '@/app/registries/chatRegistry/command'

/** 更新聊天记录容量 */
export default command(
  {
    command: '/update-capacity',
    usage: '/update-capacity <capacity>',
    description: 'Update the capacity of the chat history.',
  },
  async (context) => {
    const { ssid, content, logger, client } = context
    logger.info(`Update the capacity of the chat history. content:${content}, ssid:${ssid}`)

    const capacity = parseInt(content, 10)
    if (isNaN(capacity)) {
      return 'Invalid capacity value.'
    }

    client.updateCapacityHistory(context, capacity)
    return OK
  }
)
