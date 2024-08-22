import { ChatClientAbstract } from './ChatClientAbstract'
import type { Middleware, ExtractMiddlewareCoordinatorContext } from './MiddlewareCoordinator'
import { Notifier } from './Notifier'
import type { MiddlewareRegistry } from '../types/middleware'
import { CoreServiceAbstract } from './CoreServiceAbstract'
import { GPTAbstract } from './GPTAbstract'

export class Telepathy<R extends Partial<MiddlewareRegistry>, N extends Notifier, G extends GPTAbstract> extends CoreServiceAbstract {
  protected clients: ChatClientAbstract<R>[] = []
  protected notifiers: N[] = []
  protected gpts: G[] = []
  protected currentGPTName: string

  /** 当前激活的 GPT 名称 */
  public get currentGPT() {
    if (this.currentGPTName && this.gpts.some((gpt) => gpt.gptName === this.currentGPTName)) {
      return this.currentGPTName
    }

    return this.gpts[0].gptName
  }

  /** 获取 GPT 服务 */
  public getGPT(name = this.currentGPT) {
    return this.gpts.find((gpt) => gpt.gptName === name)
  }

  public async start() {
    for (const client of this.clients) {
      await client.start()
    }
  }

  public async stop() {
    for (const client of this.clients) {
      await client.stop()
    }
  }

  public async restart() {
    for (const client of this.clients) {
      await client.restart()
    }
  }

  /** 注册通知 */
  public regsiterNotifier(...notifiers: N[]) {
    for (const notifier of notifiers) {
      if (!(notifier instanceof Notifier)) {
        return
      }

      this.notifiers.push(notifier)
    }
  }

  /** 注册客户端 */
  public registerChatClient(...clients: ChatClientAbstract<R>[]) {
    for (const client of clients) {
      if (!(client instanceof ChatClientAbstract)) {
        return
      }

      this.clients.push(client)
    }
  }

  /** 注册GPT服务 */
  public registerGPT(...gpts: G[]) {
    for (const gpt of gpts) {
      if (!(gpt instanceof GPTAbstract)) {
        return
      }

      if (!gpt.gptName) {
        return
      }

      this.gpts.push(gpt)
    }
  }

  /** 注册中间件 */
  public use<T extends keyof R>(type: T, middleware: Middleware<ExtractMiddlewareCoordinatorContext<R[T]>>) {
    for (const client of this.clients) {
      client.use(type, middleware)
    }
  }
}
