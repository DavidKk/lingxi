# Assistant

[![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/lingxi/blob/main/README.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/lingxi/blob/main/README.en.md)

## Feature

- Based on Wechaty, connect to WeChat.

## Docker Deployment

Refer to the `docker-compose.example.yml` file.

## Local Running

```bash
$ pnpm i
$ pnpm dev
```

## Gemini

### Environment Variables (ENV)

**GEMINI_API_SERVER_ENDPOINT**: Gemini API address

Since it cannot be directly accessed in China, a forwarding layer is needed. I deployed it in Vercel. Refer to the project [Vercel-Gemini-Proxy](https://github.com/DavidKk/lingxi)

**GEMINI_API_TOKEN**: Gemini API request token

The Gemini API token obtained from the Google application.

**GEMINI_VERCEL_SECRET**: Gemini Vercel secret

If the Gemini proxy is deployed to Vercel, you need to set the access secret.

## Apprise

### Environment Variables (ENV)

**APPRISE_SERVER_URL**: Apprise service address

WeChat login requires scanning the QR code. By configuring Apprise, the login information can be sent to the email in a unified manner.

Refer to [Apprise Configuration](https://github.com/caronc/apprise?tab=readme-ov-file#productivity-based-notifications)

## Webhook

It is mainly used to connect message notifications from other services.
Since the WeChat ID cannot be obtained, please use aliases or stars for administrators.

**Server listening address**: 127.0.0.1:3000

### URL

http://127.0.0.1:3000/webhook

### Parameters

| Parameter | Type    | Optional | Description     |
| --------- | ------- | -------- | --------------- |
| star      | boolean | Yes      | Whether starred |
| alias     | string  | Yes      | Alias           |
| message   | string  | No       | Message content |

### Example

```bash
$ curl "http://$YOU_SERVER_HOST:$PORT/webhook" \
  -H "Content-Type: application/json" \
  -H 'cache-control: no-cache' \
  --data-raw '{"star":true,"message":"Hello World"}' \
  --compressed
```
