import { App } from './app'
import { Apprise } from './notifiers/Apprise'
import { Smtp } from './notifiers/Smtp'
import { WeChatyProvider } from './providers/WeChatyProvider'
import { Gemini } from './services/Gemini'

const app = new App()
app.regsiterNotifier(
  new Apprise({
    serverUrl: process.env.APPRISE_SERVER_URL,
  }),
  new Smtp({
    host: process.env.EMAIL_SMTP_HOST,
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  })
)

app.registerChatClient(new WeChatyProvider())
app.registerGPT(new Gemini())
app.start()
