import { upperFirst } from 'lodash'
import { command } from '@/app/registries/chatRegistry/command'

/** 模型列表 */
export default command(
  {
    command: '/models',
    description: 'list all supported models.',
  },
  async (context) => {
    const { gpt } = context
    if (!gpt) {
      return 'No gpt found.'
    }

    if (!gpt?.supportModels?.length) {
      return 'No models found.'
    }

    const list = gpt.supportModels.map((model) => ` - ${model}`)
    if (!list) {
      return 'No models found.'
    }

    const name = upperFirst(gpt.name)
    return `Available models in ${name}:\n${list.join('\n')}`
  }
)
