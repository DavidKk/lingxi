import type { MiddlewareCoordinator } from '../libs/MiddlewareCoordinator'
import type { Satisfies } from './utils'

/**
 * 支持的中间件类型
 *
 * - 'scanQRCode': 用于需要扫描二维码
 * - 'chatMessage': 用于需要处理聊天信息
 * - 'httpGET': 用于服务 GET 请求
 * - 'httpPOST': 用于服务 POST 请求
 */
export type MiddlewareType = 'scanQRCode' | 'chatMessage' | 'httpGET' | 'httpPOST'

/**
 * 中间件注册器
 *
 * 因为 MiddlewareCoordinator 的上下文在 Middleware 中输入参数
 * 作为参数类型是协变的，因此这里不能定义任何子类，否则无法被扩展。
 * 所以这里采用 any 作为上下文。
 */
export type MiddlewareRegistry = Satisfies<
  Record<MiddlewareType, MiddlewareCoordinator<any>>,
  {
    scanQRCode: MiddlewareCoordinator<any>
    chatMessage: MiddlewareCoordinator<any>
    httpGET: MiddlewareCoordinator<any>
    httpPOST: MiddlewareCoordinator<any>
  }
>
