import { GEMINI_VERCEL_SECRET } from '@/constants/conf'

export function withVercelHeader(headers: Headers) {
  if (GEMINI_VERCEL_SECRET) {
    headers.append('x-vercel-protection-bypass', GEMINI_VERCEL_SECRET)
  }
}
