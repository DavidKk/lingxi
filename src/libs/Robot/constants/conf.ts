import { SERVER_NAME } from '../../../constants/conf'
import type { WechatyOptions } from 'wechaty'

export const WECHAT_ROBOT_OPTIONS: WechatyOptions = {
  name: SERVER_NAME,
  puppet: 'wechaty-puppet-wechat',
  puppetOptions: {
    uos: true,
  },
}
