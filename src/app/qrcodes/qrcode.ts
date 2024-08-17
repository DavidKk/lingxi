import { debounce } from 'lodash'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import { Apprise, SERVER_NAME, Smtp } from '@/core'
import type { AppriseMessage, QrcodeContext, QrcodeMiddleware, SmtpSendMailParams, StmpOptions } from '@/core'

const generateQrcodeMiddleware: QrcodeMiddleware = async (ctx, next) => {
  const { logger, qrcode: input } = ctx
  logger.info(`QR code source is ${input}`)

  qrcodeTerminal.generate(input, { small: true }, (qrcode) => {
    logger.info('Please scan the QR code authorized robot login WeChat.')
    // eslint-disable-next-line no-console
    console.log(qrcode)
  })

  qrcode.toDataURL(input, (error, url) => {
    if (error) {
      logger.fail(`Generate qrcode failed: ${error}`)
      return
    }

    notifyApprise(ctx, url)
    notifyEmail(ctx, url)
  })

  next()
}

export default debounce(generateQrcodeMiddleware, 500)

/** 使用 apprise 通知 */
async function notifyApprise(ctx: QrcodeContext, qrcodeUrl: string) {
  const { logger } = ctx
  if (!process.env.APPRISE_SERVER_URL) {
    logger.warn('Apprise server url is not set, skip notify.')
    return
  }

  const apprise = new Apprise({ serverUrl: process.env.APPRISE_SERVER_URL, logger })
  const emailContent = renderQrcodeEmailContent(qrcodeUrl)
  const message: AppriseMessage = { title: `${SERVER_NAME} Launch`, body: emailContent, format: 'html' }

  await apprise.notify(message)
  logger.ok('Notify sent successfully')
}

/** 使用邮件通知 */
async function notifyEmail(ctx: QrcodeContext, qrcodeUrl: string) {
  const { logger } = ctx
  if (!process.env.EMAIL_NOTIFY_TO) {
    logger.warn('Email notify target is not set, skip notify.')
    return
  }

  const host = process.env.EMAIL_SMTP_HOST
  const user = process.env.EMAIL_SMTP_USER
  const pass = process.env.EMAIL_SMTP_PASS

  if (!(host && user && pass)) {
    logger.warn('Email smtp config is not set, skip notify.')
    return
  }

  const stmpOptions: StmpOptions = {
    host: host,
    auth: { user, pass },
  }

  const strPort = process.env.EMAIL_SMTP_PORT
  const port = strPort ? parseInt(strPort, 10) : NaN
  if (!isNaN(port)) {
    stmpOptions.port = port
  }

  if (process.env.EMAIL_STMP_SECURE) {
    stmpOptions.secure = true
  }

  const client = new Smtp(stmpOptions)
  logger.info(`Send email to ${process.env.EMAIL_NOTIFY_TO}`)

  const sendParams: SmtpSendMailParams = {
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.EMAIL_NOTIFY_TO,
    subject: `${SERVER_NAME} Launch`,
    html: renderQrcodeEmailContent(qrcodeUrl),
  }

  await client.sendMail(sendParams)
  logger.ok('Notify sent successfully')
}

/** 渲染邮件内容 */
function renderQrcodeEmailContent(qrcodeBase64: string) {
  return `
<div style="margin:20px auto 0 auto;padding:20px;border-radius:12px;width:486px;background:#fff;box-shadow:0 4px 10px #c1c1c1;">
  <h1 style="margin:0 0 12px 0;line-height:1.2;font-family:Arial, Helvetica, sans-serif;font-size:25px;font-weight: bolder; color:#28324C;">Let's get your wechat login in your ai assistant</h1>
  <p style="margin:0;line-height:24px;font-family:Arial, Helvetica, sans-serif;font-size:16px;color:#6E6D8F;">We use this easy qrcode so you can scan it in wechat app to login your wechat account remotely and no type in yet another long password.</p>
  <div style="margin:12px 0;padding:20px 0;border-radius:12px;text-align:center;background-color:#F4F8FB;"><img style="display:block;margin:0 auto;border:0;width:200px;height:200px;background-color:#fefefe;outline:none;" src="${qrcodeBase64}" alt="qrcode" width="200" height="200"></div>
  <p style="margin:0;line-height:24px;font-family:Arial, Helvetica, sans-serif;font-size:14px;color:#6E6D8F;">Please note this qrcode only valid for 5 minutes.</p>
</div>
`
}
