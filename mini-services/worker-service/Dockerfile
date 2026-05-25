# =============================================================================
# StoreCraft AI - Worker Service Dockerfile
# =============================================================================
FROM oven/bun:1

WORKDIR /app

# Install PostgreSQL client for Prisma + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY mini-services/worker-service/package.json mini-services/worker-service/bun.lock ./
RUN bun install --frozen-lockfile --production=false

# Copy Prisma schema from project root (build context is project root)
COPY prisma/ ./prisma/

# Copy service source (bun natively supports TypeScript)
COPY mini-services/worker-service/index.ts ./

# Generate Prisma client from project schema
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Environment
ENV NODE_ENV=production
ENV WORKER_PORT=3004
ENV HOSTNAME="0.0.0.0"

EXPOSE 3004

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD curl -f http://localhost:3004/health || exit 1

CMD ["bun", "index.ts"]
