import http from 'http'
import Url from 'url'
import { match } from 'path-to-regexp'
import { ContextualService, type ContextualServiceOptions } from '@/core/libs/ContextualService'
import { MiddlewareCoordinator, type Middleware } from '@/core/libs/MiddlewareCoordinator'
import { format } from '@/core/utils/format'
import { done } from '@/core/utils/http'
import { NotFound } from '@/core/constants/response'
import { DEFAULT_API_PORT } from '@/core/constants/server'
import type { ApiRequest, ApiResponse, RequestContext, WebhookMiddlewareRegistry } from '@/core/types'

export interface ApiServerOptions extends ContextualServiceOptions {
  port?: number
}

export type Method = 'get' | 'post'

export class ApiServer extends ContextualService<WebhookMiddlewareRegistry> {
  protected server: http.Server
  protected port: number
  protected routers: Record<Method, [string, Middleware<RequestContext>][]>

  constructor(options?: ApiServerOptions) {
    super(options)

    this.port = options?.port || DEFAULT_API_PORT
    this.routers = { get: [], post: [] }
    this.middlewares = {}
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

  public get(pattern: string, middleware: Middleware<RequestContext>) {
    this.logger.info(`Register GET: "<Bold:${pattern}>"`)
    this.routers.get.push([pattern, this.route(pattern, middleware)])
  }

  public post(pattern: string, middleware: Middleware<RequestContext>) {
    this.logger.info(`Register POST: "<Bold:${pattern}>"`)
    this.routers.post.push([pattern, this.route(pattern, middleware)])
  }

  public route(pattern: string, middleware: Middleware<RequestContext>): Middleware<RequestContext> {
    return (context, next) => {
      const { req } = context
      const pathname = req?.url
      if (!pathname) {
        this.logger.warn(`Invalid request url: ${pathname}, skip`)
        return next()
      }

      const matcher = match(pattern, { decode: decodeURIComponent })
      const result = matcher(pathname)

      if (result) {
        this.logger.info(`Match route: ${pattern}`)

        const params = result?.params || {}
        return middleware({ ...context, params }, next)
      }

      this.logger.debug(`Url "${pathname}" not match route "${pattern}"`)
      return next()
    }
  }

  protected handleServer(req: ApiRequest, res: ApiResponse) {
    if (req.headers['content-type'] !== 'application/json') {
      this.logger.fail(`Invalid content type: ${req.headers['content-type']}`)

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end(NotFound)
      return
    }

    const url = req.url!
    const parsedUrl = Url.parse(url, true)
    const query = parsedUrl.query
    const headers = req.headers
    const logger = this.logger.clone({ traceId: true })
    const params = {}
    const context = this.createContext({ req, res, logger, url, query, headers, params })
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
        // no cache
        if (!(this.middlewares.post && this.middlewares.post.size === this.routers.post.length)) {
          logger.info('Post middleware coordinator not found or out of date, create post middleware coordinator')
          this.middlewares.post = this.createMiddlewareCoordinator('post')
        }

        if (this.middlewares.post.size === 0) {
          logger.warn('Post middleware coordinator is empty')
          return
        }

        logger.debug('Execute post middleware coordinator')
        await this.middlewares.post.execute(context)
        return
      }

      if (req.method === 'GET') {
        // no cache
        if (!(this.middlewares.get && this.middlewares.get.size === this.routers.get.length)) {
          logger.info('Get middleware coordinator not found or out of date, create get middleware coordinator')
          this.middlewares.get = this.createMiddlewareCoordinator('get')
        }

        if (this.middlewares.get.size === 0) {
          logger.warn('Get middleware coordinator is empty')
          return
        }

        logger.debug('Execute get middleware coordinator')
        await this.middlewares.get.execute(context)
        return
      }
    } catch (error) {
      logger.fail(`Error executing middleware stack: ${error}`)
    }

    await this.fallback(context)
  }

  protected createMiddlewareCoordinator(method: Method) {
    const name = method === 'get' ? 'GetMiddleware' : 'PostMiddleware'
    const routers = this.routers[method]
    const sorted = routers.sort(([prev], [next]) => prev.split('/').length - next.split('/').length)
    const sortedMiddlewares = sorted.map(([, middleware]) => middleware)
    return new MiddlewareCoordinator({ name, middlewares: sortedMiddlewares })
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
