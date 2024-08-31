import { OK } from '@/providers/HttpProvider'
import { command } from '@/app/registries/chatRegistry/command'

/** 清除聊天记录 */
export default command(
  {
    command: '/clear',
    description: 'clear the chat history.',
  },
  async (context) => {
    const { ssid, logger, client } = context
    logger.info(`Clear chat history. ssid:${ssid}`)
    client.clearHistory(context)
    return OK
  }
)
