import type { MiddlewareRegistry } from '../types/middleware'
import { ChatClientAbstract } from './ChatClientAbstract'
import type { Middleware, ExtractMiddlewareCoordinatorContext } from './MiddlewareCoordinator'
import { Notifier } from './Notifier'
import type { GPTAbstract } from './GPTAbstract'
import { GPTServiceRegistry } from './GPTServiceRegistry'

export class Telepathy<R extends Partial<MiddlewareRegistry>, N extends Notifier, G extends GPTAbstract> extends GPTServiceRegistry<G> {
  protected clients: ChatClientAbstract<R>[] = []
  protected notifiers: N[] = []

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

  /** 注册中间件 */
  public use<T extends keyof R>(type: T, middleware: Middleware<ExtractMiddlewareCoordinatorContext<R[T]>>) {
    for (const client of this.clients) {
      client.use(type, middleware)
    }
  }
}
