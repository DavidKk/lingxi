import type { HttpRequestContext } from './types'

export type Message = string | Record<string, any>

export function done(context: HttpRequestContext, status: number, message: Message) {
  const { res } = context
  return new Promise<void>((resolve) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    const success = status >= 200 && status < 300
    const finalMessage = resolveMessage(message)
    const data = { success, ...finalMessage }
    const body = JSON.stringify(data)
    res.end(body, () => resolve())
  })
}

function resolveMessage(payload?: Message) {
  if (typeof payload === 'string') {
    return { message: payload }
  }

  if (typeof payload === 'object' && payload !== null) {
    const { message = 'ok', ...data } = payload
    return { message, data }
  }

  return { message: 'ok', data: null }
}
