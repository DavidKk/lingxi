import { CHAT_SEND_RECORD_COUNT } from '../constants/conf'
import type { MiddlewareRegistry } from '../types/middleware'
import { ClientAbstract } from './ClientAbstract'
import { History } from './History'
import type { HistoryRecord } from './History/types'

export interface ChatClientAbstractMessage {
  [k: string]: any
}

export interface ChatClientAbstractContext {
  [k: string]: any
}

export abstract class ChatClientAbstract<T extends Partial<MiddlewareRegistry>, C extends ChatClientAbstractContext = ChatClientAbstractContext> extends ClientAbstract<T> {
  /** 监听事件 */
  protected abstract listen(eventName: string, handler: any): () => void
  /** 登陆事件 */
  protected abstract onLogin(event: Record<string, any>): void
  /** 登出事件 */
  protected abstract onLogout(event: Record<string, any>): void
  /** 心跳事件 */
  protected abstract onHeartbeat(event: Record<string, any>): void
  /** 错误事件 */
  protected abstract onError(event: Record<string, any>): void
  /** 消息事件 */
  protected abstract onMessage(event: Record<string, any>): void

  /** 聆听聊天日志 */
  public abstract hear(context: C): void
  /** 发送消息 */
  public abstract say<T = ChatClientAbstractMessage>(context: C, message: T): Promise<void>
  /** 回复消息 */
  public abstract reply<T = ChatClientAbstractMessage>(context: C, message: T): Promise<void>

  protected history = new History()
  /** 是否为服务中 */
  protected isServing = false
  /** 是否已经登陆 */
  protected isLogined = false
  /** 是否在登录中 */
  protected isLoginning = false

  /** 状态 */
  public get status() {
    const started = this.isServing
    const logined = this.isLogined
    const loginning = this.isLoginning
    return { started, logined, loginning }
  }

  protected mounted() {
    this.listen('login', this.onLogin.bind(this))
    this.listen('logout', this.onLogout.bind(this))
    this.listen('heartbeat', this.onHeartbeat.bind(this))
    this.listen('error', this.onError.bind(this))
    this.listen('message', this.onMessage.bind(this))
  }

  /** 添加聊天记录 */
  public pushHistory(context: C, record: HistoryRecord) {
    const { ssid } = context
    this.history.push(ssid, record)
  }

  /** 获取聊天记录 */
  public sliceHistory(context: C) {
    const { ssid } = context
    return this.history.slice(ssid, CHAT_SEND_RECORD_COUNT * -1)
  }

  /** 清除聊天记录上下文 */
  public clearHistory(context: C) {
    const { ssid } = context
    this.history.clear(ssid)
    this.logger.ok(`Clear history records.`)
  }

  /** 更新聊天记录容量 */
  public updateCapacityHistory(context: C, size: number) {
    const { ssid } = context
    this.history.updateCapacity(ssid, size)
    this.logger.ok(`Update history capacity to ${size}.`)
  }
}
