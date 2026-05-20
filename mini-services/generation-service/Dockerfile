# =============================================================================
# StoreCraft AI - Generation Service Dockerfile
# =============================================================================
FROM oven/bun:1

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production=false

# Copy Prisma schema from project root (build context is project root)
COPY prisma/ ./prisma/

# Copy service source (bun natively supports TypeScript)
COPY mini-services/generation-service/index.ts ./

# Generate Prisma client from project schema
RUN bunx prisma generate --schema=./prisma/schema.prisma

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/storecraft.db"

EXPOSE 3002

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["bun", "index.ts"]
