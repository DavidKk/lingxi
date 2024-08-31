import path from 'path'
import { M } from '../../constants/size'

/** 最大缓存大小 */
export const LOGGER_BUFFER_MAX_SIZE = 1 * M

/** 日志单文件最大大小 */
export const LOGGER_FILE_MAX_SIZE = 10 * M

/** 最大文件数 */
export const LOGGER_FILE_MAX_NUMBER = 100

/** 日志默认路径 */
export const LOGGER_FILE_PATH = path.join(process.cwd(), 'logs')
