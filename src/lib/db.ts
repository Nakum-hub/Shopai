import { PrismaClient } from '@prisma/client';

// =============================================================================
// Database Client — PostgreSQL via Prisma ORM
// =============================================================================
// Features:
// 1. Singleton pattern (prevents connection leaks in dev hot reload)
// 2. Environment-aware logging
// 3. Health check diagnostics
// 4. Graceful shutdown handlers
// =============================================================================

// -----------------------------------------------------------------------------
// Singleton Pattern (prevents multiple connections in dev with hot reload)
// -----------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// -----------------------------------------------------------------------------
// Create & Initialize Client
// -----------------------------------------------------------------------------

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  });

  return client;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------

/**
 * Verify database connectivity and return diagnostic info.
 * Works with PostgreSQL.
 */
export async function dbHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  poolSize: number;
  activeConnections: number;
  maxConnections: number;
  version: string;
}> {
  const start = Date.now();

  try {
    const result = await db.$queryRawUnsafe<Array<{ version: string }>>(
      `SELECT version() as version`
    );
    const version = result[0]?.version || 'unknown';

    const poolStats = await db.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()`
    );
    const activeConnections = poolStats[0]?.count || 0;

    const maxResult = await db.$queryRawUnsafe<Array<{ max_connections: number }>>(
      `SHOW max_connections`
    );
    const maxConnections = maxResult[0]?.max_connections || 100;

    const latencyMs = Date.now() - start;
    return {
      status: latencyMs < 50 ? 'healthy' : latencyMs < 200 ? 'degraded' : 'unhealthy',
      latencyMs,
      poolSize: activeConnections,
      activeConnections,
      maxConnections,
      version,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      poolSize: 0,
      activeConnections: 0,
      maxConnections: 0,
      version: 'unavailable',
    };
  }
}

// -----------------------------------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------------------------------

/**
 * Disconnect the Prisma client. Call on process shutdown.
 */
export async function disconnectDb(): Promise<void> {
  try {
    await db.$disconnect();
    console.log('[DB] Database connection closed');
  } catch (err) {
    console.error('[DB] Error closing database connection:', err);
  }
}

// Register shutdown handler
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
