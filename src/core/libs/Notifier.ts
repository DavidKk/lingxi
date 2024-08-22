import { CoreServiceAbstract } from './CoreServiceAbstract'

export type ContentType = 'text' | 'markdown' | 'html'

export interface NotifierMessage {
  /* 消息主体内容 */
  body: string
  /* 消息标题（可选） */
  title?: string
  /**
   * 消息内容类型（可选）
   * 可以用于判断是否支持
   */
  contentType?: ContentType
}

export abstract class Notifier<M extends NotifierMessage = NotifierMessage> extends CoreServiceAbstract {
  public abstract send(message: M): Promise<void>

  static contentTypeSupports: ContentType[] = ['text']
  public get supports(): ContentType[] {
    return Object.getPrototypeOf(this).constructor.contentTypeSupports
  }
}
