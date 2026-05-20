import { PrismaClient } from '@prisma/client';

// =============================================================================
// Resilient Database Client
// =============================================================================
// Wraps PrismaClient with:
// 1. WAL mode for concurrent read performance
// 2. Retry/backoff for SQLITE_BUSY errors
// 3. Optimized connection settings for production workloads
// 4. Graceful degradation under load
// =============================================================================

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const DB_MAX_RETRIES = 3;
const DB_RETRY_BASE_DELAY_MS = 100;
const DB_RETRY_MAX_DELAY_MS = 2000;
const DB_BUSY_TIMEOUT_MS = 5000;
const DB_CONNECTION_TIMEOUT_MS = 10000;

// -----------------------------------------------------------------------------
// Singleton Pattern (prevents multiple connections in dev with hot reload)
// -----------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// -----------------------------------------------------------------------------
// WAL Mode Initialization
// -----------------------------------------------------------------------------

/**
 * Enable SQLite WAL (Write-Ahead Logging) mode for dramatically better
 * concurrent read performance. WAL allows readers to not block writers
 * and vice versa, which is critical for WebSocket + API traffic patterns.
 *
 * Also sets:
 * - busy_timeout: How long SQLite waits for a locked table (prevents SQLITE_BUSY)
 * - journal_mode: WAL (enables concurrent reads during writes)
 * - synchronous: NORMAL (good balance of safety vs speed with WAL)
 * - cache_size: -8000 (8MB page cache — 8000 pages × 1KB)
 * - temp_store: MEMORY (temp tables in RAM)
 * - mmap_size: 268435456 (256MB memory-mapped I/O)
 */
async function enableWalMode(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$executeRawUnsafe(`PRAGMA busy_timeout=${DB_BUSY_TIMEOUT_MS};`);
    await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
    await prisma.$executeRawUnsafe('PRAGMA cache_size=-8000;');
    await prisma.$executeRawUnsafe('PRAGMA temp_store=MEMORY;');
    await prisma.$executeRawUnsafe('PRAGMA mmap_size=268435456;');
    await prisma.$executeRawUnsafe('PRAGMA wal_autocheckpoint=1000;');
    console.log('[DB] SQLite WAL mode enabled with optimized settings');
  } catch (err) {
    console.warn('[DB] Could not set SQLite pragmas (may already be set or not SQLite):', err);
  }
}

// -----------------------------------------------------------------------------
// Retry Logic for SQLITE_BUSY
// -----------------------------------------------------------------------------

/**
 * Execute a Prisma operation with exponential backoff retry for SQLITE_BUSY.
 * SQLite returns SQLITE_BUSY when another write is in progress. With WAL mode
 * and busy_timeout, this should be rare, but we handle it defensively.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = DB_MAX_RETRIES,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      // Check if it's a SQLITE_BUSY / database locked error
      const isBusyError =
        error instanceof Error && (
          error.message.includes('SQLITE_BUSY') ||
          error.message.includes('database is locked') ||
          error.message.includes('database locked') ||
          error.message.includes('busy')
        );

      if (!isBusyError || attempt === retries) {
        throw error;
      }

      // Exponential backoff with jitter
      const baseDelay = DB_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      const jitter = Math.random() * DB_RETRY_BASE_DELAY_MS;
      const delay = Math.min(baseDelay + jitter, DB_RETRY_MAX_DELAY_MS);

      console.warn(
        `[DB] SQLITE_BUSY (attempt ${attempt + 1}/${retries + 1}), retrying in ${Math.round(delay)}ms...`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// -----------------------------------------------------------------------------
// Create & Initialize Client
// -----------------------------------------------------------------------------

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db',
      },
    },
  });

  // Initialize WAL mode on first connection
  enableWalMode(client).catch(() => {
    // Non-blocking — if WAL setup fails, we still work in default journal mode
  });

  return client;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// -----------------------------------------------------------------------------
// Helper: Execute with Retry
// -----------------------------------------------------------------------------

/**
 * Wrapper for any Prisma operation that needs retry protection.
 * Use this for write operations that might conflict with concurrent writes.
 *
 * @example
 * await withRetry(() => db.storefront.create({ data: {...} }));
 * await withRetry(() => db.pipelineLog.create({ data: {...} }));
 */
export { withRetry };

// -----------------------------------------------------------------------------
// Helper: Batch Write (serialize multiple writes)
// -----------------------------------------------------------------------------

/**
 * Execute multiple write operations sequentially to avoid SQLITE_BUSY conflicts.
 * Each operation is retried independently.
 *
 * @example
 * await batchWrite([
 *   () => db.pipelineLog.create({ data: log1 }),
 *   () => db.pipelineLog.create({ data: log2 }),
 *   () => db.semanticMemory.upsert({ ... }),
 * ]);
 */
export async function batchWrite<T>(
  operations: Array<() => Promise<T>>,
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    const result = await withRetry(operation);
    results.push(result);
  }

  return results;
}

// -----------------------------------------------------------------------------
// Write Queue (non-blocking, serialized writes for high-throughput scenarios)
// -----------------------------------------------------------------------------

type WriteOperation = () => Promise<unknown>;

class WriteQueue {
  private queue: Array<{
    operation: WriteOperation;
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
  }> = [];
  private processing = false;
  private batchSize = 10;
  private batchIntervalMs = 50;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Enqueue a write operation. Returns a promise that resolves when the
   * operation completes. Operations are batched and executed sequentially.
   */
  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        operation: operation as WriteOperation,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.scheduleFlush();
    });
  }

  /**
   * Schedule a batch flush. Multiple enqueues within the interval are batched.
   */
  private scheduleFlush(): void {
    if (this.processing) return;
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.batchIntervalMs);
    }
  }

  /**
   * Process the current queue in batches.
   */
  private async flush(): Promise<void> {
    this.flushTimer = null;
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      // Take up to batchSize operations
      const batch = this.queue.splice(0, this.batchSize);

      for (const { operation, resolve, reject } of batch) {
        try {
          const result = await withRetry(operation);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    } finally {
      this.processing = false;

      // If more items were enqueued during processing, schedule another flush
      if (this.queue.length > 0) {
        this.flushTimer = setTimeout(() => this.flush(), this.batchIntervalMs);
      }
    }
  }

  /**
   * Get the current queue size (for monitoring).
   */
  get size(): number {
    return this.queue.length;
  }
}

/** Global write queue for serialized DB writes */
export const writeQueue = new WriteQueue();

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------

/**
 * Verify database connectivity and return diagnostic info.
 */
export async function dbHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  walMode: boolean;
  queueSize: number;
}> {
  const start = Date.now();

  try {
    await db.$queryRawUnsafe('SELECT 1');
    const latencyMs = Date.now() - start;

    // Check WAL mode
    let walMode = false;
    try {
      const result = await db.$queryRawUnsafe<Array<{ journal_mode: string }>>(
        'PRAGMA journal_mode;'
      );
      walMode = result[0]?.journal_mode === 'wal';
    } catch {
      // Ignore — not critical
    }

    return {
      status: latencyMs < 100 ? 'healthy' : latencyMs < 500 ? 'degraded' : 'unhealthy',
      latencyMs,
      walMode,
      queueSize: writeQueue.size,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      walMode: false,
      queueSize: writeQueue.size,
    };
  }
}
