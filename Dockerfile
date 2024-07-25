FROM debian:buster AS builder

# 安装必要的工具和依赖
RUN echo 'deb http://ftp.debian.org/debian sid main' > /etc/apt/sources.list
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y curl tar xz-utils python3 make g++ wget git
RUN apt-get install -y chromium
RUN apt-get -t sid install libc6-amd64 libc6-dev libc6-dbg

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
RUN mkdir -p ./ai-assistant-wechat
COPY ./package.json ./ai-assistant-wechat/package.json
COPY ./pnpm-lock.yaml ./ai-assistant-wechat/pnpm-lock.yaml
COPY ./libs ./ai-assistant-wechat/libs

# 安装依赖
RUN cd ./ai-assistant-wechat && pnpm install --prod --ignore-scripts

# 运行代码
CMD cd ./ai-assistant-wechat && pnpm start
