export function format(format: string, ...args: any[]) {
  if (typeof format !== 'string') {
    throw new TypeError('Argument "format" must be a string')
  }

  let result = format.replace(/%[sdifjoO]/g, (match) => {
    const arg = args.shift()
    switch (match) {
      case '%s':
        return String(arg)
      case '%d':
      case '%i':
        return parseInt(arg, 10).toString()
      case '%f':
        return parseFloat(arg).toString()
      case '%j':
        return JSON.stringify(arg)
      case '%o':
      case '%O':
        return JSON.stringify(arg, null, 2)
      default:
        return match
    }
  })

  if (args.length > 0) {
    result += args.join('')
  }

  return result
}
