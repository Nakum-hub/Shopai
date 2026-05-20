# =============================================================================
# StoreCraft AI - Multi-Stage Docker Build
# =============================================================================
FROM oven/bun:1 AS base

# Install dependencies
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production=false

# =============================================================================
# Development Stage
# =============================================================================
FROM base AS development
COPY . .

# Expose ports
# 3000 - Next.js app
# 3002 - Generation service (WebSocket)
ENV NODE_ENV=development
EXPOSE 3000 3002

CMD ["bun", "run", "dev"]

# =============================================================================
# Production Stage
# =============================================================================
FROM base AS builder
COPY . .
ENV NODE_ENV=production
RUN bun run build

FROM oven/bun:1 AS production
WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma schema for migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["bun", ".next/standalone/server.js"]
