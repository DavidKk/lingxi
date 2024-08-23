import { command } from '@/app/registries/chatRegistry/command'

/** 打印支持的 GPT 列表 */
export default command(
  {
    command: '/gpts',
    description: 'list all supported gpts.',
  },
  async (context) => {
    const { telepathy } = context
    if (!telepathy.gptServiceCount) {
      return 'No gpts found.'
    }

    const list = telepathy.listGpts().map((name) => ` - ${name}`)
    return `Available gpts:\n${list.join('\n')}`
  }
)
