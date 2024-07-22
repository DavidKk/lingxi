import dotenv from 'dotenv'

dotenv.config()

export const SERVER_NAME = 'WeChatRobot'

/** Apprise 服务地址 */
export const APPRISE_SERVER_URL = `${process.env.APPRISE_SERVER_URL}`
/** Gemini API 地址 */
export const GEMINI_API_SERVER_URL = `${process.env.GEMINI_API_SERVER_URL}`
/** Gemini API 请求 TOKEN */
export const GEMINI_API_TOKEN = `${process.env.GEMINI_API_TOKEN}`
/** Gemini Vercel 秘钥 */
export const GEMINI_VERCEL_SECRET = `${process.env.GEMINI_VERCEL_SECRET}`
/** 存储最大记录数 */
export const MAX_HISTORY_RECORD = 200
/** 发送聊天记录数 */
export const CHAT_SEND_RECORD_COUNT = 2
