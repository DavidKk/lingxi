import type { WechatyOptions } from 'wechaty'

/** 最大内容字符 */
export const MAX_BYTES_SIZE = 2048

/** wechaty 默认配置 */
export const WECHATY_DEFAULT_OPTIONS: WechatyOptions = {
  name: 'wechaty',
  puppet: 'wechaty-puppet-wechat4u',
  puppetOptions: {
    uos: true,
  },
}
