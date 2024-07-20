import fetch from 'node-fetch'
import { APPRISE_REQUEST_HEADER, APPRISE_SERVER_URL } from './constants'
import { SERVER_NAME } from '@/constants/conf'

export interface Message {
  title: string
  body: string
}

export async function notify(message: Message) {
  await fetch(APPRISE_SERVER_URL, {
    method: 'POST',
    headers: APPRISE_REQUEST_HEADER,
    body: JSON.stringify({ ...message, tag: [SERVER_NAME] }),
  })
}
