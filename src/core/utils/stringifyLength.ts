export function stringifyLength(length: number, decimals = 2) {
  if (length === 0) {
    return '0'
  }

  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['', 'K', 'M', 'B']
  const i = Math.floor(Math.log(length) / Math.log(k))
  const unit = sizes[i]
  const num = parseFloat((length / Math.pow(k, i)).toFixed(dm))
  return unit ? `${num} ${unit}` : num.toString()
}
