import { WeChat } from './libs/WeChat'
import { qrcodeMiddleware } from './middlewares/qrcode'
import { mentionMiddleware } from './middlewares/mention'

const app = new WeChat()
app.use('qrcode', qrcodeMiddleware)
app.use('message', mentionMiddleware)
app.start()
