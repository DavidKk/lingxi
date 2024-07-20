import dotenv from 'dotenv'

dotenv.config()

export const SERVER_NAME = 'WeChatRobot'
export const APPRISE_SERVER_URL = `${process.env.APPRISE_SERVER_URL}`
