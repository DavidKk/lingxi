import path from 'path'
import { M } from '../../constants/size'

/** 存储最大记录数 */
export const HISTORY_MAX_RECORD = 200
/** 最大缓存大小 */
export const HISTORY_BUFFER_MAX_SIZE = 4 * M
/** 单文件最大大小 */
export const HISTORY_FILE_MAX_SIZE = 10 * M
/** 最大文件数 */
export const HISTORY_FILE_MAX_NUMBER = 200
/** 默认路径 */
export const HISTORY_FILE_PATH = path.join(process.cwd(), 'chats')
