# Stage 1: Build the Vite/React app
FROM node:22-alpine AS builder

RUN apk upgrade --no-cache

WORKDIR /monorepo

# Copy root package.json (satisfies "melodai-microservices": "file:.." dep)
COPY package.json ./

WORKDIR /monorepo/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci && npm cache clean --force

COPY frontend/ ./

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_SONG_CATALOG_URL
ARG VITE_USER_PROFILE_URL
ARG VITE_PLAYLIST_URL
ARG VITE_RECOMMENDATION_URL

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_SONG_CATALOG_URL=$VITE_SONG_CATALOG_URL
ENV VITE_USER_PROFILE_URL=$VITE_USER_PROFILE_URL
ENV VITE_PLAYLIST_URL=$VITE_PLAYLIST_URL
ENV VITE_RECOMMENDATION_URL=$VITE_RECOMMENDATION_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS production

RUN apk upgrade --no-cache

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /monorepo/frontend/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
