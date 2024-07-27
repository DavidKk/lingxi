export function traceId() {
  return Math.floor(Math.random() * 1e13 + Date.now()).toString(35)
}
