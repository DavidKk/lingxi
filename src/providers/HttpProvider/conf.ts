const port = parseInt(process.env.SERVER_PORT, 10)

/** 默认API服务端口 */
export const DEFAULT_API_PORT = isNaN(port) ? 3000 : port
