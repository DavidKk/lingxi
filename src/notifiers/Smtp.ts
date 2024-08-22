import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import type { CoreServiceOptions } from '@/core/libs/CoreServiceAbstract'
import { Notifier } from '@/core/libs/Notifier'
import type { ContentType, NotifierMessage } from '@/core/libs/Notifier'
import { format } from '@/core/utils'
import { SERVER_NAME } from '@/core/constants/conf'

export type SmtpSendMailParams = Mail<any>['options']

export interface SmtpAuth {
  /* 用户名 */
  user: string
  /* 密码 */
  pass: string
}

export interface StmpOptions extends CoreServiceOptions {
  /* SMTP 服务器主机名 */
  host: string
  /* SMTP 服务器端口（可选），默认值为 465 */
  port?: string | number
  /* 是否使用加密连接（可选），如果端口是 HTTPS 默认端口，则为 true */
  secure?: boolean
  /* 身份验证信息 */
  auth: SmtpAuth
  /** 发送人邮件地址（默认发送给自己） */
  fromEmail?: string
  /** 收件人邮件地址（默认发送给自己） */
  toEmail?: string
}

export class Smtp extends Notifier {
  static contentTypeSupports: ContentType[] = ['html', 'text', 'markdown']

  /* SMTP 服务器主机名 */
  protected host: string
  /* SMTP 服务器端口 */
  protected port: number
  /* 是否使用加密连接 */
  protected secure: boolean
  /* 身份验证信息 */
  protected auth: SmtpAuth
  /** 发送人邮件地址 */
  protected fromEmail: string
  /** 收件人邮件地址 */
  protected toEmail: string

  constructor(options: StmpOptions) {
    super(options)

    const { host, port = 465, secure = true, auth, fromEmail = auth.user, toEmail = auth.user } = options
    this.host = host
    this.port = typeof port === 'string' ? parseInt(port, 10) : port
    this.secure = secure
    this.auth = auth
    this.fromEmail = fromEmail
    this.toEmail = toEmail
  }

  public async send(message: NotifierMessage) {
    const { user, pass } = this.auth || {}
    if (!(this.host && user && pass)) {
      this.logger.warn('Email smtp config is not set, skip notify.')
      return
    }

    this.logger.info(`Send email to ${this.toEmail}`)

    const { body, contentType } = message
    const sendParams: SmtpSendMailParams = {
      from: this.fromEmail,
      to: this.toEmail,
      subject: `${SERVER_NAME} Launch`,
    }

    switch (contentType) {
      case 'html':
        sendParams.html = body
        break
      case 'text':
      default:
        sendParams.text = body
        break
    }

    await this.sendMail(sendParams)
    this.logger.ok('Notify sent successfully')
  }

  /** 发送邮件 */
  public async sendMail(params: Mail<any>['options']) {
    const transporter = this.createTransporter()
    this.logger.info(format(`Send email to ${params.to} with %o`, params))
    const info = await transporter.sendMail(params)

    // 判断是否邮件成功发送
    const isSuccess = info.rejected.length === 0
    if (!isSuccess) {
      const reason = `Email failed to send to ${params.to}. Rejected: ${info.rejected}`
      this.logger.fail(reason)

      throw new Error(reason)
    }
  }

  /* 创建邮件传输对象 */
  protected createTransporter() {
    const { host, port, secure, auth } = this
    if (!this.host) {
      throw new Error('stmp host is not set')
    }

    if (!(this.port && typeof this.port === 'number')) {
      throw new Error(`stmp port is invalid. port: ${this.port}`)
    }

    if (!(this.auth && this.auth.user && this.auth.pass)) {
      throw new Error(`stmp auth is invalid. auth: ${JSON.stringify(this.auth)}`)
    }

    return nodemailer.createTransport({ host, port, secure, auth })
  }
}
