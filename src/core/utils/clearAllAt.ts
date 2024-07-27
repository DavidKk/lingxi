export function clearAllAt(message: string) {
  if (typeof message !== 'string') {
    throw new Error('[clearAllAt] message must be a string')
  }

  return message.replace(/\@([^\s]+)/gim, '').trim()
}
