import { Robot } from './libs/Robot'
import { qrcodeMiddleware } from './middlewares/qrcode'

const app = new Robot()
app.use('qrcode', qrcodeMiddleware)
app.use('message', async (ctx, next) => {
  console.log('message middleware')
  await next()
})

app.start()
