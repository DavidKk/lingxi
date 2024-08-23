import { command } from '@/app/registries/chatRegistry/command'

/** 切换 GPT 服务 */
export default command(
  {
    command: '/switch-gpt',
    usage: '/switch-gpt <name>',
    description: 'switch gpt service.',
  },
  async (context) => {
    const { telepathy, content } = context
    if (!telepathy.gptServiceCount) {
      return 'No GPT services found.'
    }

    if (!telepathy.setActiveGPT(content)) {
      return `GPT "${content}" not found.`
    }

    return `Switch ${content} GPT service completed.`
  }
)
