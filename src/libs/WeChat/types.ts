import type { WechatyEventListeners } from 'wechaty/dist/esm/src/schemas/wechaty-events'

export type EventHandler = WechatyEventListeners
export type EventType = keyof EventHandler
