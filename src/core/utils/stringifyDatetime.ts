const DEFAULT_MASK = 'YYYY-MM-DDTHH:mm:ss'

export function stringifyDatetime(date?: Date, mask?: string): string
export function stringifyDatetime(_: TemplateStringsArray): string
export function stringifyDatetime(...args: any[]) {
  if (args[0] instanceof Date) {
    const date: Date = args[0]
    const mask: string = args[1] || DEFAULT_MASK

    const tokens: Record<string, string | number> = {
      YYYY: date.getFullYear(),
      MM: String(date.getMonth() + 1).padStart(2, '0'),
      DD: String(date.getDate()).padStart(2, '0'),
      HH: String(date.getHours()).padStart(2, '0'),
      mm: String(date.getMinutes()).padStart(2, '0'),
      ss: String(date.getSeconds()).padStart(2, '0'),
    }

    return mask.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => tokens[token].toString())
  }

  if (Array.isArray(args[0])) {
    const mask = args[0].join('')
    return stringifyDatetime(new Date(), mask)
  }

  if (args.length === 0) {
    return stringifyDatetime(new Date())
  }

  throw new Error('Invalid arguments provided to stringifyDatetime')
}
