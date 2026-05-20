// =============================================================================
// Database Architecture — PostgreSQL + Redis + BullMQ
// =============================================================================
// Production-grade data layer with:
// 1. PostgreSQL 16 — Primary relational database
// 2. Redis 7 — Distributed cache + pub/sub + rate limiting
// 3. BullMQ — Redis-backed job queue for async workloads
// 4. Prisma ORM — Type-safe database access with connection pooling
// =============================================================================

/**
 * ## Architecture Overview
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                        StoreCraft AI                                │
 * │                                                                     │
 * │  Next.js App ──┐          ┌──────────┐          ┌───────────────┐  │
 * │                │          │          │          │               │  │
 * │  Generation ───┼──────────┤ Prisma   ├──────────┤ PostgreSQL 16 │  │
 * │  Service       │          │ Client   │          │               │  │
 * │                │          │          │          │ • Storefronts  │  │
 * │  API Routes ───┤          │ Pool: 10 │          │ • Analytics   │  │
 * │                │          │          │          │ • Pipeline     │  │
 * │  Workers ──────┤          └──────────┘          │   Executions  │  │
 * │                │                                  │ • Chat History│  │
 * │                │          ┌──────────┐          │ • Templates   │  │
 * │                ├──────────┤ ioredis  ├──────────┤ • Memory      │  │
 * │                │          │          │          └───────────────┘  │
 * │                │          │          │                              │
 * │                │          │ • Cache  │          ┌───────────────┐  │
 * │                │          │ • PubSub │          │  BullMQ       │  │
 * │                │          │ • Rate   │          │               │  │
 * │                │          │   Limit  │◄─────────┤ • Generation  │  │
 * │                │          │ • Sessions│         │ • Analytics   │  │
 * │                │          └──────────┘          │ • Pipeline    │  │
 * │                │                                 │   Logs       │  │
 * │                │          ┌──────────┐          │ • Cleanup     │  │
 * │                │          │ Redis 7  │          │ • Notification│  │
 * │                │          └──────────┘          └───────────────┘  │
 * └─────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Components
 *
 * ### 1. PostgreSQL 16 (Primary Database)
 *    - **Purpose**: All persistent relational data
 *    - **Connection**: Prisma ORM with pg-pool (10 connections)
 *    - **Tables**: Storefronts, Analytics, PipelineExecutions, PipelineLogs,
 *      ConversationSessions, ChatHistory, Templates, SemanticMemory
 *    - **Features**: MVCC, ACID transactions, composite indexes, JSONB-ready
 *    - **Resilience**: Health checks, graceful shutdown, connection timeout
 *
 * ### 2. Redis 7 (Cache + Infrastructure)
 *    - **Purpose**: Distributed cache, session store, rate limiting, pub/sub
 *    - **Connection**: ioredis with automatic reconnection
 *    - **Features**:
 *      - Namespaced TTL caches (api, bi, analytics, template, pipeline, session)
 *      - Distributed rate limiting with sliding windows
 *      - Session management with TTL refresh
 *      - Pub/Sub for real-time cross-instance events
 *    - **Memory**: 256MB max with LRU eviction
 *    - **Persistence**: AOF (Append-Only File) with everysec fsync
 *
 * ### 3. BullMQ (Job Queue)
 *    - **Purpose**: Asynchronous background job processing
 *    - **Backend**: Redis 7 (shared with cache)
 *    - **Queues**:
 *      - `generation` — Website generation pipeline (5min timeout, 3 retries)
 *      - `analytics` — Event ingestion (30s timeout, 2 retries)
 *      - `pipeline-logs` — Non-blocking log persistence (10s timeout)
 *      - `cleanup` — Data maintenance jobs (60s timeout)
 *      - `notifications` — Email/notification delivery (60s, 5 retries)
 *    - **Features**: Exponential backoff, dead letter tracking, concurrency control
 *
 * ### 4. Prisma ORM
 *    - **Provider**: PostgreSQL (native)
 *    - **Pooling**: connection_limit=10, pool_timeout=30s
 *    - **Types**: @db.Text for large fields, @db.Double for Float precision
 *    - **Indexes**: Composite indexes on common query patterns
 *    - **Singleton**: Single PrismaClient instance per process (hot-reload safe)
 *
 * ## Connection URLs
 *
 * ```
 * DATABASE_URL=postgresql://storecraft:PASSWORD@postgres:5432/storecraft?connection_limit=10&pool_timeout=30
 * REDIS_URL=redis://redis:6379
 * ```
 *
 * ## Scaling Characteristics
 *
 * | Scenario | SQLite (Before) | PostgreSQL + Redis (Now) |
 * |----------|-----------------|--------------------------|
 * | Concurrent writes | SQLITE_BUSY (200-500/sec) | MVCC unlimited |
 * | Multiple users (10+) | Bottleneck | Scales horizontally |
 * | Analytics ingestion | Batch write queue needed | Direct + BullMQ |
 * | AI pipeline logging | Rate-limited via queue | Non-blocking via queue |
 * | WebSocket traffic | Coalesced writes | Native PostgreSQL |
 * | Horizontal scaling | Impossible | Add app instances + PgBouncer |
 * | Cache invalidation | Process-local only | Redis distributed |
 * | Session sharing | Not possible | Redis shared sessions |
 * | Rate limiting | In-process only | Distributed via Redis |
 * | Job processing | In-process queue | BullMQ workers |
 */

// Re-export db for convenience
export { db, dbHealthCheck, disconnectDb } from './db';

// Re-export Redis utilities
export {
  redis,
  redisHealthCheck,
  getPublisher,
  getSubscriber,
  setSession,
  getSession,
  deleteSession,
  checkRateLimit,
} from './redis';

// Re-export queue system
export {
  generationQueue,
  analyticsQueue,
  pipelineLogQueue,
  cleanupQueue,
  notificationQueue,
  queueHealthCheck,
  registerWorker,
} from './queue';

// Re-export cache
export {
  apiCache,
  biCache,
  analyticsCache,
  templateCache,
  validationCache,
  pipelineCache,
  sessionCache,
  storefrontKey,
  analyticsKey,
  pipelineKey,
  chatKey,
} from './cache';
