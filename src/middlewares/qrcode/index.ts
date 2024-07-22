import { debounce } from 'lodash'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import type { Middleware, QrcodeContext } from '@/types'
import { SERVER_NAME } from '@/constants/conf'
import { Apprise } from '@/libs/Apprise'
import { renderQrcodeEmailContent } from './renderQrcodeEmailContent'

export const qrcodeMiddleware: Middleware<QrcodeContext> = debounce((ctx, next) => {
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
}, 500)
