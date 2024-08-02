# AI 微信小助手

基于 Wechaty 开发，打通微信。

[![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/ai-assistant-wechat/blob/main/README.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/ai-assistant-wechat/blob/main/README.en.md)

## Docker 部署

参考 `docker-compose.example.yml` 文件。

## 本地运行

```bash
$ pnpm i
$ pnpm dev
```

## Gemini

### 环境变量 (ENV)

**GEMINI_API_SERVER_ENDPOINT**: Gemini API 地址

由于国内无法直接访问，因此需要做一层转发。本人将其部署在 Vercel 中。参考项目 [Vercel-Gemini-Proxy](https://github.com/DavidKk/Vercel-Gemini-Proxy)

**GEMINI_API_TOKEN**: Gemini API 请求令牌

从 Google 应用中获取的 Gemini API 令牌。

**GEMINI_VERCEL_SECRET**: Gemini Vercel 秘钥

如果将 Gemini 代理部署到 Vercel 中，则需要设置访问秘钥。

## Apprise

### 环境变量 (ENV)

**APPRISE_SERVER_URL**: Apprise 服务地址

微信登录需要扫描二维码，通过配置 Apprise，可以将登录信息统一发送到邮件中。

参考 [Apprise 配置](https://github.com/caronc/apprise?tab=readme-ov-file#productivity-based-notifications)
k

## Webhook

主要用于打通其他服务的消息通知。
由于无法获取微信 ID，因此管理员等请使用别名或星标。

**服务器监听地址**: 127.0.0.1:3000

### URL

http://127.0.0.1:3000/webhook

### 参数

| 参数    | 类型    | 是否可选 | 描述         |
| ------- | ------- | -------- | ------------ |
| star    | boolean | 是       | 是否 starred |
| alias   | string  | 是       | 别名         |
| message | string  | 否       | 消息内容     |

### 示例

```bash
$ curl "http://$YOU_SERVER_HOST:$PORT/webhook" \
  -H "Content-Type: application/json" \
  -H 'cache-control: no-cache' \
  --data-raw '{"star":true,"message":"Hello World"}' \
  --compressed
```
