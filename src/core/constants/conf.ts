import dotenv from 'dotenv'
import type { WechatyOptions } from 'wechaty'
import { M } from './size'

dotenv.config()

export const SERVER_NAME = 'WeChatRobot'

/** Apprise 服务地址 */
export const APPRISE_SERVER_URL = `${process.env.APPRISE_SERVER_URL}`
/** Gemini API 地址 */
export const GEMINI_API_SERVER_ENDPOINT = `${process.env.GEMINI_API_SERVER_ENDPOINT}`
/** Gemini Pro 模型路径 */
export const GEMINI_API_SERVER_CHAT_PATH = '/v1beta/models/gemini-pro:streamGenerateContent'
/** Gemini Flash 模型路径 */
export const GEMINI_API_SERVER_FLASH_PATH = '/v1beta/models/gemini-1.5-flash:generateContent'
/** Gemini API 请求 TOKEN */
export const GEMINI_API_TOKEN = `${process.env.GEMINI_API_TOKEN}`
/** Gemini Vercel 秘钥 */
export const GEMINI_VERCEL_SECRET = `${process.env.GEMINI_VERCEL_SECRET}`
/** 存储最大记录数 */
export const MAX_HISTORY_RECORD = 200
/** 发送聊天记录数 */
export const CHAT_SEND_RECORD_COUNT = 20
/** 允许最大图片大小 */
export const MAX_FILE_SIZE = 3 * M
/** wechaty 默认配置 */
export const WECHATY_DEFAULT_OPTIONS: WechatyOptions = {
  name: SERVER_NAME,
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: {
    uos: true,
  },
}
