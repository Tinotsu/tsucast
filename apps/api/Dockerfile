# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files (standalone, no workspace)
COPY package.json ./
RUN npm install

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for health checks and create non-root user
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Set ownership
RUN chown -R hono:nodejs /app

USER hono

# Environment defaults
ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3001

# Health check (PORT defaults to 3001 locally; Railway injects its own)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3001}/health/ready || exit 1

CMD ["node", "dist/index.js"]
