import { command } from '@/core'

/** 用户 ID 查询 */
export default command(
  {
    command: '/showmyuid',
    description: 'show my uid.',
    reply: true,
  },
  async (context) => {
    const { isRoom, messager } = context
    const shouldReply = isRoom ? await messager.mentionSelf() : true
    if (!shouldReply) {
      return
    }

    const talker = messager.talker()
    const uid = talker.id
    return uid
  }
)
