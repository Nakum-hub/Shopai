# =============================================================================
# StoreCraft AI - Generation Service Dockerfile
# =============================================================================
FROM oven/bun:1

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN bun install --frozen-lockfile --production=false

# Copy service source
COPY index.js ./

# Environment
ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

EXPOSE 3002

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["bun", "index.js"]
