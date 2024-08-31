import { command } from '@/app/registries/chatRegistry/command'
import { FileBox } from 'file-box'
import path from 'path'

/** 查看日志 */
export default command(
  {
    command: '/log',
    usage: '/log [ls]',
    description: 'download or list log files. (e.g. /log or /log ls)',
  },
  async (context) => {
    const { ssid, content, logger } = context
    logger.info(`Download log files. content:${content}, ssid:${ssid}`)

    if (content === 'ls') {
      logger.info('List log files.')

      const logs = await logger.getLogFiles()
      logger.info(`Found ${logs.length} log files`)

      const filenames = logs.map((file) => `- ${path.basename(file)}`)
      return filenames.join('\n')
    }

    const logs = await logger.getLogFiles(content)
    const files = logs.map((log) => FileBox.fromFile(log))

    if (files.length === 0) {
      logger.info('No log files found.')
      return 'No log files found.'
    }

    logger.info(`Found ${files.length} log files`)
    return files
  }
)
