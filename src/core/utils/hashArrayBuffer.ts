import crypto from 'crypto'

export function hashArrayBuffer(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer)
  const hash = crypto.createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}
