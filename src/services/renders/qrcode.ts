export function renderQrcodeEmailContent(qrcodeBase64: string) {
  return `
<h1>微信登录</h1>
<div>
    <img src="data:image/png;base64,${qrcodeBase64}" alt="微信二维码" width="200" height="200">
</div>
<p>请使用手机微信扫描二维码</p>
`
}
