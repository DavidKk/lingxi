export function createHeader(data: any) {
  if (typeof data === 'object') {
    const content = JSON.stringify(data)

    return {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(content).toString(),
    }
  }

  if (typeof data === 'string') {
    return {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(data).toString(),
    }
  }
}
