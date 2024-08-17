import { command } from '@/core'
import { OK } from '@/core/constants/response'

/** 更新聊天记录容量 */
export default command(
  {
    command: '/update-capacity',
    description: 'Update the capacity of the chat history.',
  },
  async (context) => {
    const { ssid, content, logger, robot } = context
    logger.info(`Update the capacity of the chat history. content:${content}, ssid:${ssid}`)

    const capacity = parseInt(content, 10)
    if (isNaN(capacity)) {
      return 'Invalid capacity value.'
    }

    robot.updateCapacity(context, capacity)
    return OK
  }
)
