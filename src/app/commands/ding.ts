import { command } from '../registries/chatRegistry/command'

/** 健康检查 */
export default command({ command: '/ding', description: 'check server health.' }, () => 'dong')
