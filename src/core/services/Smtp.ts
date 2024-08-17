import nodemailer from 'nodemailer'
import { CoreService, type CoreServiceOptions } from '@/core/libs/CoreService'
import { format } from '@/core/utils/format'
import type Mail from 'nodemailer/lib/mailer'

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
}

export type SmtpSendMailParams = Mail<any>['options']

export class Smtp extends CoreService {
  /* SMTP 服务器主机名 */
  protected host: string
  /* SMTP 服务器端口 */
  protected port: number
  /* 是否使用加密连接 */
  protected secure: boolean
  /* 身份验证信息 */
  protected auth: SmtpAuth

  constructor(options: StmpOptions) {
    super(options)

    const { host, port = 465, secure = true, auth } = options
    this.host = host
    this.port = typeof port === 'string' ? parseInt(port, 10) : port
    this.secure = secure
    this.auth = auth
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
