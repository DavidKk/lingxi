import dotenv from 'dotenv'
import type { WechatyOptions } from 'wechaty'
import type { GeminiGenerationConfig, GeminiSafetySettings } from '@/types'

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

/** wechaty 默认配置 */
export const WECHATY_DEFAULT_OPTIONS: WechatyOptions = {
  name: SERVER_NAME,
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: {
    uos: true,
  },
}

export const GenerationConfig: GeminiGenerationConfig = {
  temperature: 0.5,
  topP: 1,
  maxOutputTokens: 4000,
}

export const SafetySettings: GeminiSafetySettings[] = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_ONLY_HIGH',
  },
]
