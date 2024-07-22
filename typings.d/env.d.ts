declare namespace NodeJS {
  interface ProcessEnv {
    /** Apprise 服务地址 */
    APPRISE_SERVER_URL: string
    /** Gemini API 地址 */
    GEMINI_API_SERVER_URL: string
    /** Gemini API 请求 TOKEN */
    GEMINI_API_TOKEN: string
    /** Gemini Vercel 秘钥 */
    GEMINI_VERCEL_SECRET: string
  }
}
