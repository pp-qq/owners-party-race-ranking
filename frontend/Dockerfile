# Builder stage: install dependencies and generate static export
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: serve static assets with nginx behind Basic Auth
FROM nginx:1.25-alpine
WORKDIR /

# nginx:alpineイメージにはopensslが含まれていないため追加
RUN apk add --no-cache openssl

# Cloud Runはポート8080を期待する
EXPOSE 8080

# 静的ファイルを配置
COPY --from=builder /app/out /usr/share/nginx/html

# Nginx設定とエントリポイントをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Basic認証の資格情報はデプロイ時に環境変数で渡す想定
ENV BASIC_AUTH_USERNAME="" \
    BASIC_AUTH_PASSWORD=""

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
