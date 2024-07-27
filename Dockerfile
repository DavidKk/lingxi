FROM ghcr.io/davidkk/puppet-chromium-nodejs:alpha AS builder

# 克隆文件
RUN mkdir -p ./ai-assistant-wechat
COPY ./package.json ./ai-assistant-wechat/package.json
COPY ./pnpm-lock.yaml ./ai-assistant-wechat/pnpm-lock.yaml
COPY ./libs ./ai-assistant-wechat/libs

# 安装依赖
RUN cd ./ai-assistant-wechat && pnpm install --prod --ignore-scripts

# 运行代码
CMD cd ./ai-assistant-wechat && pnpm start
