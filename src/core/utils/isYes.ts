import type { Yes } from '../types'

export function isYes(flag: any): flag is Yes {
  return ['yes', 'YES', 'y', 'Y', 'true', 'TRUE', true].includes(flag)
}
