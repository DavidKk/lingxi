FROM debian:buster AS builder

# 安装必要的工具和依赖
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install -y curl tar xz-utils python3 make g++ wget build-essential git chromium
RUN mkdir /glibc && cd /glibc
RUN wget http://ftp.gnu.org/gnu/glibc/glibc-2.33.tar.gz
RUN tar -xzvf glibc-2.33.tar.gz
RUN cd glibc-2.33
RUN mkdir build && cd build
RUN ../configure --prefix=/usr
RUN make -j$(nproc)
RUN make install

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
