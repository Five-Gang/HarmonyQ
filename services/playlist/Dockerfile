FROM node:22-alpine AS production

RUN apk upgrade --no-cache

WORKDIR /monorepo

COPY package.json ./

WORKDIR /monorepo/services/playlist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/playlist/package.json services/playlist/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY services/playlist/src/ ./src/

RUN chown -R appuser:appgroup /monorepo
USER appuser

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health || exit 1

CMD ["node", "src/app.js"]
