import { Robot } from './libs/Robot'
import { qrcodeMiddleware } from './middlewares/qrcode'
import { mentionMiddleware } from './middlewares/mention'

const app = new Robot()
app.use('qrcode', qrcodeMiddleware)
app.use('message', mentionMiddleware)
app.start()
