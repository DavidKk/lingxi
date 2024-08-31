export function withVercelHeader(headers: Headers) {
  if (process.env.GEMINI_VERCEL_SECRET) {
    headers.append('x-vercel-protection-bypass', process.env.GEMINI_VERCEL_SECRET)
  }
}
