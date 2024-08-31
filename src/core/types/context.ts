import type { Logger } from '../libs/Logger'

export interface Context {
  logger: Logger
}

export interface QrcodeContext extends Context {
  qrcode: string
}
