# Stage 1: Build the Vite/React app
FROM node:20-alpine AS builder

WORKDIR /monorepo

# Copy root package.json (satisfies "melodai-microservices": "file:.." dep)
COPY package.json ./

WORKDIR /monorepo/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci && npm cache clean --force

COPY frontend/ ./

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /monorepo/frontend/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
