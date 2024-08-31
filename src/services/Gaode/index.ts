import { CoreServiceAbstract } from '@/core/libs/CoreServiceAbstract'
import { WEATHER_URL } from './constants'

/**
 * 气象类型
 * - base: 返回实况天气
 * - all: 返回预报天气
 */
export type WeatherExtensions = 'base' | 'all'

export interface WeatherParams {
  /** 请求服务权限标识 */
  key: string
  /** 城市编码 */
  city: string
  /** 气象类型 */
  extensions?: WeatherExtensions
}

export class Gaode extends CoreServiceAbstract {
  public fetchWeather() {
    fetch(WEATHER_URL)
  }
}
