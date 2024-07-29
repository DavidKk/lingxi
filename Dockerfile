FROM ghcr.io/davidkk/puppet-chromium-nodejs:alpha AS builder

# 克隆文件
COPY . ./ai-assistant-wechat
# 安装依赖
RUN cd ./ai-assistant-wechat && pnpm install --prod --ignore-scripts
# 运行代码
CMD cd ./ai-assistant-wechat && pnpm start --verbose
