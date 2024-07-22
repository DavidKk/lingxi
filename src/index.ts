import { WeChat } from './libs/WeChat'
import { qrcodeMiddleware } from './middlewares/qrcode'
import { chatMiddleware } from './middlewares/chat'

const app = new WeChat()
app.use('qrcode', qrcodeMiddleware)
app.use('message', chatMiddleware)
app.start()
