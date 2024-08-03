import http from 'http'
import { NotFound } from '@/core/constants/response'
import { format } from '@/core/utils/format'
import { DEFAULT_API_PORT } from '@/core/constants/server'
import type { ApiRequest, ApiResponse, RequestContext, WebhookMiddlewareRegistry } from '@/core/types'
import { done } from '../services/http'
import { Server, type ServerOptions } from './Server'
import { MiddlewareCoordinator, type Middleware } from './MiddlewareCoordinator'

export interface ApiServerOptions extends ServerOptions {
  port?: number
}

export class ApiServer extends Server<WebhookMiddlewareRegistry> {
  protected server: http.Server
  protected port: number

  constructor(options?: ApiServerOptions) {
    super(options)

    this.port = options?.port || DEFAULT_API_PORT
    this.middlewares = {
      get: new MiddlewareCoordinator<RequestContext>({ name: 'GetMiddleware' }),
      post: new MiddlewareCoordinator<RequestContext>({ name: 'PostMiddleware' }),
    }
  }

  public serve() {
    return new Promise<void>((resolve) => {
      this.server = http.createServer(this.handleServer.bind(this))
      this.server.listen(this.port, () => {
        this.logger.ok(`Server is running on port ${this.port}`)
        resolve()
      })
    })
  }

  public stop() {
    return new Promise<void>((resolve) => {
      if (!this.server) {
        resolve()
        return
      }

      this.server.close(() => resolve())
    })
  }

  public get(absPath: string, middleware: Middleware<RequestContext>) {
    this.logger.info(`Register GET: ${absPath}`)
    this.middlewares.get.use(this.route(absPath, middleware))
  }

  public post(absPath: string, middleware: Middleware<RequestContext>) {
    this.logger.info(`Register POST: ${absPath}`)
    this.middlewares.post.use(this.route(absPath, middleware))
  }

  public route(absPath: string, middleware: Middleware<RequestContext>): Middleware<RequestContext> {
    return (context, next) => {
      const { req } = context
      const pathname = req?.url
      if (!pathname) {
        return next()
      }

      if (pathname === absPath) {
        return middleware(context, next)
      }

      return next()
    }
  }

  protected handleServer(req: ApiRequest, res: ApiResponse) {
    if (req.headers['content-type'] !== 'application/json') {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(NotFound)
      return
    }

    const logger = this.logger.clone({ traceId: true })
    const context = this.createContext({ logger, req, res })
    this.handleRouter(context)
  }

  protected handleRouter(context: RequestContext) {
    const { req, logger } = context
    logger.info(`Access ${req.method}: ${req.url}`)

    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      const data = this.tryParseJson(body)
      logger.info(format(`Request body: %o`, data))

      const withDataContext = this.createContext({ ...context, data })
      await this.execMiddleware(withDataContext)
    })
  }

  protected async execMiddleware(context: RequestContext) {
    const { req, logger } = context
    try {
      if (req.method === 'POST') {
        await this.middlewares.post.execute(context)
        return
      }

      if (req.method === 'GET') {
        await this.middlewares.get.execute(context)
        return
      }
    } catch (error) {
      logger.fail(`Error executing middleware stack: ${error}`)
    }

    await this.fallback(context)
  }

  protected fallback(context: RequestContext) {
    return done(context, 404, NotFound)
  }

  protected tryParseJson(body: string) {
    try {
      return JSON.parse(body)
    } catch (error) {
      this.logger.fail(`Parse json failed. Body: "${body}".`)
      return {}
    }
  }
}
