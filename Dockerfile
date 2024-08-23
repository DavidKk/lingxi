FROM ghcr.io/davidkk/puppet-chromium-nodejs:alpha AS builder

# 克隆文件，安装依赖，创建登录文件
COPY . ./ai-assistant-wechat
RUN cd ./ai-assistant-wechat && \
    pnpm install --prod --ignore-scripts && \
    touch LingXi.memory-card.json

# 运行代码
CMD cd ./ai-assistant-wechat && pnpm start --verbose
