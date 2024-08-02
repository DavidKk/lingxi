import path from 'path'
import { K, M } from './size'

/** 日志单文件最大大小 */
export const LOGGER_FILE_MAX_SIZE = 10 * M

/** 日志默认路径 */
export const LOGGER_FILE_PATH = path.join(process.cwd(), 'logs')

/** 日志缓冲大小 */
export const LOGGER_BUFFER_SIZE = 10 * K
