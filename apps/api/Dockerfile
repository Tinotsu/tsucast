# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace structure for npm resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/

# Install all workspace dependencies
RUN npm ci

# Copy API source and build
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/src apps/api/src
RUN npm run build --workspace=apps/api

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for health checks and create non-root user
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Copy workspace structure for production install
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci --omit=dev && npm cache clean --force

# Copy built files
COPY --from=builder /app/apps/api/dist apps/api/dist

# Set ownership
RUN chown -R hono:nodejs /app

USER hono

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV LOG_LEVEL=info

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health/ready || exit 1

CMD ["node", "apps/api/dist/index.js"]
