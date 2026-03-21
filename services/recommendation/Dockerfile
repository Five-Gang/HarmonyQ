FROM node:22-alpine AS production

RUN apk upgrade --no-cache

WORKDIR /monorepo

COPY package.json ./

WORKDIR /monorepo/services/recommendation

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/recommendation/package.json services/recommendation/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY services/recommendation/src/ ./src/

RUN chown -R appuser:appgroup /monorepo
USER appuser

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "src/app.js"]
