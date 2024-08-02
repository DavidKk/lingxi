import { command } from '@/core'
import { OK } from '@/core/constants/response'

/** 清除聊天记录 */
export default command(
  {
    command: '/clear',
    description: 'clear the chat history.',
  },
  async (context) => {
    const { ssid, logger, robot } = context
    logger.info(`Clear chat history. ssid:${ssid}`)

    robot.clear(context)
    return OK
  }
)
