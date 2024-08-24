declare namespace NodeJS {
  interface ProcessEnv {
    /** Apprise 服务地址 */
    APPRISE_SERVER_URL?: string
    /** 微信登录发送通知至邮箱 */
    EMAIL_NOTIFY_TO?: string
    /** SMTP 用户名 */
    EMAIL_SMTP_USER?: string
    /** SMTP 密码 */
    EMAIL_SMTP_PASS?: string
    /** SMTP 服务地址 */
    EMAIL_SMTP_HOST?: string
    /** Gemini API 地址 */
    GEMINI_API_SERVER_ENDPOINT?: string
    /** Gemini API 请求 TOKEN */
    GEMINI_API_TOKEN?: string
    /** Gemini Vercel 秘钥 */
    GEMINI_VERCEL_SECRET?: string
    /** Sonarr 服务地址 */
    SONARR_SERVER_URL?: string
    /** Radarr 服务地址 */
    RADARR_SERVER_URL?: string
    /** HTTP 服务端口 */
    SERVER_PORT?: string
  }
}
