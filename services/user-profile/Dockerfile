# ─────────────────────────────────────────
# Stage 1: Production image
# ─────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "src/app.js"]
