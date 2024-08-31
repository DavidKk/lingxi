/** 渲染邮件内容 */
export function renderQrcodeEmailContent(qrcodeBase64: string) {
  return `
<div style="margin:20px auto 0 auto;padding:20px;border-radius:12px;width:486px;background:#fff;box-shadow:0 4px 10px #c1c1c1;">
  <h1 style="margin:0 0 12px 0;line-height:1.2;font-family:Arial, Helvetica, sans-serif;font-size:25px;font-weight: bolder; color:#28324C;">Let's get your wechat login in your ai assistant</h1>
  <p style="margin:0;line-height:24px;font-family:Arial, Helvetica, sans-serif;font-size:16px;color:#6E6D8F;">We use this easy qrcode so you can scan it in wechat app to login your wechat account remotely and no type in yet another long password.</p>
  <div style="margin:12px 0;padding:20px 0;border-radius:12px;text-align:center;background-color:#F4F8FB;"><img style="display:block;margin:0 auto;border:0;width:200px;height:200px;background-color:#fefefe;outline:none;" src="${qrcodeBase64}" alt="qrcode" width="200" height="200"></div>
  <p style="margin:0;line-height:24px;font-family:Arial, Helvetica, sans-serif;font-size:14px;color:#6E6D8F;">Please note this qrcode only valid for 5 minutes.</p>
</div>
`
}
