FROM node:22-alpine AS production

WORKDIR /monorepo

COPY package.json ./

WORKDIR /monorepo/services/user-profile

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY services/user-profile/package.json services/user-profile/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY services/user-profile/src/ ./src/

RUN chown -R appuser:appgroup /monorepo
USER appuser

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "src/app.js"]
