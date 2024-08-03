import type { RequestContext } from '@/core/types'

export function done(context: RequestContext, status: number, message: string) {
  const { res } = context
  return new Promise<void>((resolve) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    const success = status >= 200 && status < 300
    const data = { success, message }
    const body = JSON.stringify(data)
    res.end(body, () => resolve())
  })
}
