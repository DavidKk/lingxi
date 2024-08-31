FROM ghcr.io/davidkk/puppet-chromium-nodejs:alpha AS builder

# 克隆文件，安装依赖，创建登录文件
COPY . ./app
RUN cd ./app && \
    pnpm install --prod --ignore-scripts && \
    touch LingXi.memory-card.json

# 运行代码
CMD cd ./app && pnpm start --verbose
