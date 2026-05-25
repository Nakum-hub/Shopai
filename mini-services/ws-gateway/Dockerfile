# =============================================================================
# StoreCraft AI - WebSocket Gateway Dockerfile
# =============================================================================
FROM oven/bun:1

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY mini-services/ws-gateway/package.json mini-services/ws-gateway/bun.lock ./
RUN bun install --frozen-lockfile --production=false

# Copy service source (bun natively supports TypeScript)
COPY mini-services/ws-gateway/index.ts ./

# Environment
ENV NODE_ENV=production
ENV WS_GATEWAY_PORT=3005

EXPOSE 3005

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s \
  CMD curl -f http://localhost:3005/health || exit 1

CMD ["bun", "index.ts"]
