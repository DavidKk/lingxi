import { debounce } from 'lodash'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import { Apprise, SERVER_NAME } from '@/core'
import type { QrcodeMiddleware } from '@/core'

const generateQrcodeMiddleware: QrcodeMiddleware = (ctx, next) => {
  const { logger, qrcode: input } = ctx
  const apprise = new Apprise({ logger })
  logger.info(`QR code source is ${input}`)

  qrcodeTerminal.generate(input, { small: true }, (qrcode) => {
    logger.info('Please scan the QR code authorized robot login WeChat.')
    // eslint-disable-next-line no-console
    console.log(qrcode)
  })

  qrcode.toDataURL(input, async (error, url) => {
    if (error) {
      logger.fail(`Generate qrcode fail. error: ${error}`)
      return
    }

    logger.ok(`Generate qrcode success. qrcode base64 is ${url}`)

    const html = renderQrcodeEmailContent(url)
    await apprise.notify({ title: `${SERVER_NAME} Launch`, body: html, format: 'html' })
  })

  next()
}

export default debounce(generateQrcodeMiddleware, 500)

function renderQrcodeEmailContent(qrcodeBase64: string) {
  return `
<h1>微信登录</h1>
<div>
  <img src="${qrcodeBase64}" alt="微信二维码" width="200" height="200">
</div>
<p>请使用手机微信扫描二维码</p>
`
}
