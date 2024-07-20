import type { Middleware, QrcodeContext } from '@/libs/Robot'
import { generate } from 'qrcode-terminal'

export const qrcodeMiddleware: Middleware<QrcodeContext> = (ctx, next) => {
  const { qrcode } = ctx
  generate(qrcode, { small: true })
  next()
}
