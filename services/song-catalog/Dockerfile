# ─────────────────────────────────────────
# Stage 1: Production image
# ─────────────────────────────────────────
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Add a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files first (layer caching)
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source
COPY src/ ./src/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Expose service port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the service
CMD ["node", "src/app.js"]
