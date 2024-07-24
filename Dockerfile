FROM debian:buster AS builder
# 安装必要的工具和依赖
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl tar xz-utils python3 make g++ git && \
    apt-get install -y chromium
# 安装 NodeJS 与 NPM
RUN apt-get install -y nodejs npm
# 安装 NodeJS 版本管理器 
RUN npm i -g n
# 安装最新 Nodejs
RUN n latest
# 升级 NPM
RUN npm i -g npm@latest
# 开启 corepack
RUN corepack enable
# 克隆文件
COPY ./ ./ai-assistant-wechat
# 安装依赖
RUN cd ./ai-assistant-wechat && pnpm install --prod --ignore-scripts
# 运行代码
CMD cd ./ai-assistant-wechat && \
    git pull origin main && \
    pnpm install --prod --ignore-scripts && \
    pnpm start
