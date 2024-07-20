/**
 * Optionally identify the text format of the data you're feeding Apprise.
 * The valid options are text, markdown, html.
 * The default value if nothing is specified is text.
 */
export type MessageFormat = 'text' | 'markdown' | 'html'

/**
 * Defines the message type you want to send as.
 * The valid options are info, success, warning, and failure.
 * If no type is specified then info is the default value used.
 */
export type MessageType = 'info' | 'success' | 'warning' | 'failure'

export interface Message {
  /** Your message body. This is a required field. */
  body: string
  /** Optionally define a title to go along with the body. */
  title?: string
  type?: MessageType
  format?: MessageFormat
}
