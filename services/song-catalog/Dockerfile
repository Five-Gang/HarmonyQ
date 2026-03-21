FROM node:20-alpine AS production

# Mirror monorepo structure so file:../.. in package-lock.json resolves correctly
WORKDIR /monorepo

# Copy root package.json (this IS the melodai-microservices local dep target)
COPY package.json ./

# Switch into service directory at the same relative path as local dev
WORKDIR /monorepo/services/song-catalog

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy service package files
COPY services/song-catalog/package.json services/song-catalog/package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY services/song-catalog/src/ ./src/

RUN chown -R appuser:appgroup /monorepo
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/app.js"]
