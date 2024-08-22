import http from 'http'
import Url from 'url'
import { match } from 'path-to-regexp'
import { ContextualServiceAbstract, type ContextualServiceOptions } from '@/core/libs/ContextualServiceAbstract'
import { MiddlewareCoordinator, type Middleware } from '@/core/libs/MiddlewareCoordinator'
import { format } from '@/core/utils'
import type { MiddlewareRegistry, Satisfies } from '@/core/types'
import { done } from './utils'
import { DEFAULT_API_PORT } from './conf'
import { NotFound } from './constants'
import type { HttpRequest, HttpResponse, HttpRequestContext } from './types'

export type HttpProviderMiddlewareRegistry = Satisfies<
  Partial<MiddlewareRegistry>,
  Partial<{
    httpGET: MiddlewareCoordinator<HttpRequestContext>
    httpPOST: MiddlewareCoordinator<HttpRequestContext>
  }>
>

export type HttpProviderMethod = keyof HttpProviderMiddlewareRegistry

export interface HttpProviderOptions extends ContextualServiceOptions {
  port?: number
}

export class HttpProvider extends ContextualServiceAbstract<HttpProviderMiddlewareRegistry> {
  protected server: http.Server
  protected port: number
  protected routers: Record<HttpProviderMethod, [string, Middleware<HttpRequestContext>][]>

  constructor(options?: HttpProviderOptions) {
    super(options)

    this.port = options?.port || DEFAULT_API_PORT
    this.routers = { httpGET: [], httpPOST: [] }
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

  public get(pattern: string, middleware: Middleware<HttpRequestContext>) {
    this.logger.info(`Register GET: "<Bold:${pattern}>"`)
    this.routers.httpGET.push([pattern, this.route(pattern, middleware)])
  }

  public post(pattern: string, middleware: Middleware<HttpRequestContext>) {
    this.logger.info(`Register POST: "<Bold:${pattern}>"`)
    this.routers.httpPOST.push([pattern, this.route(pattern, middleware)])
  }

  public route(pattern: string, middleware: Middleware<HttpRequestContext>): Middleware<HttpRequestContext> {
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

  protected handleServer(req: HttpRequest, res: HttpResponse) {
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

  protected handleRouter(context: HttpRequestContext) {
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

  protected async execMiddleware(context: HttpRequestContext) {
    const { req, logger } = context
    try {
      if (req.method === 'POST') {
        // no cache
        if (!(this.middlewares.httpPOST && this.middlewares.httpPOST.size === this.routers.httpPOST.length)) {
          logger.info('Post middleware coordinator not found or out of date, create post middleware coordinator')
          this.middlewares.httpPOST = this.createMiddlewareCoordinator('httpPOST')
        }

        if (this.middlewares.httpPOST.size === 0) {
          logger.warn('Post middleware coordinator is empty')
          return
        }

        logger.debug('Execute post middleware coordinator')
        await this.middlewares.httpPOST.execute(context)
        return
      }

      if (req.method === 'GET') {
        // no cache
        if (!(this.middlewares.httpGET && this.middlewares.httpGET.size === this.routers.httpGET.length)) {
          logger.info('Get middleware coordinator not found or out of date, create get middleware coordinator')
          this.middlewares.httpGET = this.createMiddlewareCoordinator('httpGET')
        }

        if (this.middlewares.httpGET.size === 0) {
          logger.warn('Get middleware coordinator is empty')
          return
        }

        logger.debug('Execute get middleware coordinator')
        await this.middlewares.httpGET.execute(context)
        return
      }
    } catch (error) {
      logger.fail(`Error executing middleware stack: ${error}`)
    }

    await this.fallback(context)
  }

  protected createMiddlewareCoordinator(HttpProvidermethod: HttpProviderMethod) {
    const name = HttpProvidermethod === 'httpGET' ? 'GetMiddleware' : 'PostMiddleware'
    const routers = this.routers[HttpProvidermethod]
    const sorted = routers.sort(([prev], [next]) => prev.split('/').length - next.split('/').length)
    const sortedMiddlewares = sorted.map(([, middleware]) => middleware)
    return new MiddlewareCoordinator({ name, middlewares: sortedMiddlewares })
  }

  protected fallback(context: HttpRequestContext) {
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
