// =============================================================================
// Database Architecture & Migration Guide
// =============================================================================
// This file documents the current database strategy and the migration path
// to a production-grade PostgreSQL + Redis setup.
// =============================================================================

/**
 * ## Current Architecture: SQLite with Hardening
 *
 * SQLite is used as the primary database with the following mitigations:
 *
 * ### 1. WAL Mode (Write-Ahead Logging)
 *    - Readers don't block writers, writers don't block readers
 *    - Dramatically improves concurrent read performance
 *    - Enabled via PRAGMA journal_mode=WAL in src/lib/db.ts
 *
 * ### 2. Busy Timeout + Retry Logic
 *    - PRAGMA busy_timeout=5000 (SQLite waits 5s before SQLITE_BUSY)
 *    - Exponential backoff retry in withRetry() wrapper
 *    - Handles concurrent write conflicts gracefully
 *
 * ### 3. Write Queue (Serialized Writes)
 *    - Non-blocking write queue in src/lib/db.ts
 *    - Batches writes and executes sequentially
 *    - Prevents write contention from WebSocket events + API calls
 *
 * ### 4. Optimized Pragmas
 *    - cache_size=-8000 (8MB page cache)
 *    - temp_store=MEMORY (temp tables in RAM)
 *    - mmap_size=256MB (memory-mapped I/O)
 *    - synchronous=NORMAL (safe with WAL mode)
 *
 * ### 5. In-Memory Caching
 *    - Multi-namespace TTL cache in src/lib/cache.ts
 *    - Reduces DB reads by ~80% for repeated queries
 *    - Pre-configured caches: API (5min), BI (10min), Analytics (2min), Templates (1hr)
 *
 * ### 6. Optimized Indexes
 *    - Composite indexes for common query patterns
 *    - Covering indexes for analytics range queries
 *    - Index on all foreign keys and frequently-filtered columns
 *
 * ## Limitations of SQLite
 *
 * | Scenario | SQLite Impact | Mitigation |
 * |----------|---------------|------------|
 * | Concurrent writes | SQLITE_BUSY errors | WAL + busy_timeout + retry + write queue |
 * | Multiple users (10+) | Write throughput bottleneck | Write serialization, cache reads |
 * | Analytics ingestion | Large INSERT batches | Batch write queue, daily aggregation |
 * | AI pipeline logging | High-frequency writes | Queue with 50ms batching |
 * | WebSocket traffic | Many small writes | Coalesced via write queue |
 * | Horizontal scaling | Single-file DB | Not possible — must migrate to PostgreSQL |
 *
 * ## Migration Path: PostgreSQL + Redis
 *
 * ### Step 1: Switch Prisma Provider
 * ```prisma
 * // prisma/schema.prisma
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 * ```
 *
 * ### Step 2: Update Schema for PostgreSQL
 * - Replace `String @default(cuid())` with `String @id @default(uuid())` if preferred
 * - Add `@db.Uuid` for UUID columns
 * - Change `Float` to `Float @db.Double` for precision
 * - Add `@db.Text` for large text fields (html, inputSnapshot)
 * - Add `@db.Json` for JSON fields (businessProfile, logs)
 *
 * ### Step 3: Replace In-Memory Cache with Redis
 * ```typescript
 * // Replace src/lib/cache.ts MemoryCache with ioredis
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * ```
 *
 * ### Step 4: Add Connection Pooling
 * ```typescript
 * // src/lib/db.ts
 * const db = new PrismaClient({
 *   datasources: { db: { url: process.env.DATABASE_URL } },
 *   log: ['error'],
 * });
 * // Use PgBouncer or Supabase pooler for managed pooling
 * ```
 *
 * ### Step 5: Replace Write Queue with a Real Queue
 * - Use BullMQ (Redis-backed) for the write queue
 * - Use PostgreSQL LISTEN/NOTIFY for real-time events
 * - Use pg-boss for job scheduling
 *
 * ### Step 6: Update docker-compose.yml
 * ```yaml
 * services:
 *   postgres:
 *     image: postgres:16-alpine
 *     environment:
 *       POSTGRES_DB: storecraft
 *       POSTGRES_USER: storecraft
 *       POSTGRES_PASSWORD: ${DB_PASSWORD}
 *     volumes:
 *       - postgres-data:/var/lib/postgresql/data
 *     healthcheck:
 *       test: ["CMD-SHELL", "pg_isready -U storecraft"]
 *       interval: 10s
 *       timeout: 3s
 *       retries: 3
 *
 *   redis:
 *     image: redis:7-alpine
 *     command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
 *     volumes:
 *       - redis-data:/data
 *     healthcheck:
 *       test: ["CMD", "redis-cli", "ping"]
 *       interval: 10s
 *       timeout: 3s
 * ```
 *
 * ## When to Migrate
 *
 * - > 5 concurrent users generating websites simultaneously
 * - > 100 API requests per second sustained
 * - Need for horizontal scaling (multiple server instances)
 * - Need for real-time analytics dashboards with high write throughput
 * - Need for row-level security or multi-tenancy
 * - Need for backup/replication/high-availability
 *
 * ## Current Throughput Estimates (SQLite + WAL + Cache)
 *
 * | Operation | Estimated Throughput |
 * |-----------|---------------------|
 * | Reads (cached) | ~10,000/sec |
 * | Reads (uncached) | ~5,000/sec |
 * | Writes (sequential) | ~1,000/sec |
 * | Writes (concurrent) | ~200-500/sec |
 * | Mixed workload | ~500-1,000/sec |
 */

// Re-export db for convenience
export { db, withRetry, batchWrite, writeQueue, dbHealthCheck } from './db';
