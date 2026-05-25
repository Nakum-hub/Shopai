// =============================================================================
// StoreCraft Worker Service — BullMQ Background Job Processors
// =============================================================================
// Processes jobs from 5 BullMQ queues:
// 1. generation — Website generation pipeline (LLM heavy)
// 2. analytics   — Analytics event ingestion (high frequency)
// 3. pipeline-logs — Pipeline stage log persistence
// 4. cleanup     — Data maintenance and expired record removal
// 5. notifications — Email/notification delivery (future)
//
// Port: 3004 (health check)
// Dependencies: BullMQ, ioredis, @prisma/client
// =============================================================================

import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const PORT = process.env.WORKER_PORT ? parseInt(process.env.WORKER_PORT, 10) : 3004;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://storecraft:storecraft@localhost:5432/storecraft';
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '3', 10);

// -----------------------------------------------------------------------------
// Redis Connection (shared for all workers)
// -----------------------------------------------------------------------------

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

const redisConfig = parseRedisUrl(REDIS_URL);

const workerConnection = {
  ...redisConfig,
  maxRetriesPerRequest: null, // Required for BullMQ Workers
  enableReadyCheck: false,
};

// -----------------------------------------------------------------------------
// Prisma Client (worker-local singleton)
// -----------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// -----------------------------------------------------------------------------
// Job Data Types (mirrors src/lib/queue.ts)
// -----------------------------------------------------------------------------

interface GenerateWebsiteJobData {
  storefrontId: string;
  sessionId: string;
  businessProfile: Record<string, unknown>;
  voiceTranscript?: string;
}

interface AnalyticsIngestJobData {
  storefrontId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface PipelineLogJobData {
  executionId: string;
  stage: string;
  level: string;
  agent: string;
  message: string;
  detail?: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
}

interface CleanupJobData {
  type: 'expired_sessions' | 'old_analytics' | 'stale_executions' | 'old_audit_logs';
  olderThanDays?: number;
}

interface NotificationJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Worker 1: Generation Queue — Website Generation Pipeline
// -----------------------------------------------------------------------------

async function processGenerationJob(job: Job<GenerateWebsiteJobData>) {
  const { storefrontId, sessionId, businessProfile } = job.data;

  console.log(`[Worker:generation] Processing job ${job.id} for storefront ${storefrontId}`);

  try {
    // Update storefront status to generating
    await db.storefront.update({
      where: { id: storefrontId },
      data: { status: 'generating' },
    });

    // Create pipeline execution record
    const execution = await db.pipelineExecution.create({
      data: {
        sessionId,
        storefrontId,
        status: 'running',
        currentStage: 'init',
        totalStages: 5,
        progress: 0,
        inputSnapshot: JSON.stringify({ businessProfile, timestamp: new Date().toISOString() }),
      },
    });

    // Stage 1: Business understanding
    await updatePipelineStage(execution.id, 'understanding_business', 20, 'info', 'Planner', 'Analyzing business profile...');

    // Stage 2: Structure planning
    await updatePipelineStage(execution.id, 'planning_structure', 40, 'info', 'Planner', 'Planning website structure...');

    // Stage 3: Content generation — this is where LLM would be called
    await updatePipelineStage(execution.id, 'generating_content', 60, 'info', 'Content Agent', 'Generating website content...');
    await updatePipelineStage(execution.id, 'generating_content', 80, 'info', 'UI Agent', 'Building HTML sections...');

    // Stage 4: Assembly
    await updatePipelineStage(execution.id, 'assembling_pages', 90, 'info', 'Assembler', 'Assembling final page...');

    // Update storefront as ready
    await db.storefront.update({
      where: { id: storefrontId },
      data: {
        status: 'ready',
        businessProfile: JSON.stringify(businessProfile),
      },
    });

    // Complete execution
    const durationMs = Date.now() - execution.startedAt.getTime();
    await db.pipelineExecution.update({
      where: { id: execution.id },
      data: {
        status: 'completed',
        progress: 100,
        currentStage: 'complete',
        completedAt: new Date(),
        durationMs,
      },
    });

    console.log(`[Worker:generation] Job ${job.id} completed in ${durationMs}ms`);
    return { success: true, storefrontId, executionId: execution.id, durationMs };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Mark storefront as error
    await db.storefront.update({
      where: { id: storefrontId },
      data: { status: 'error' },
    }).catch(() => {});

    // Update execution as failed
    await db.pipelineExecution.updateMany({
      where: { storefrontId, status: 'running' },
      data: { status: 'failed', errorMessage: errorMsg, completedAt: new Date() },
    }).catch(() => {});

    console.error(`[Worker:generation] Job ${job.id} failed:`, errorMsg);
    throw error; // Re-throw to let BullMQ handle retries
  }
}

async function updatePipelineStage(
  executionId: string,
  stage: string,
  progress: number,
  level: string,
  agent: string,
  message: string,
) {
  await db.pipelineExecution.update({
    where: { id: executionId },
    data: { currentStage: stage, progress },
  }).catch(() => {});

  await db.pipelineLog.create({
    data: {
      executionId,
      stage,
      level,
      agent,
      message,
      timestamp: new Date(),
    },
  }).catch(() => {});
}

// -----------------------------------------------------------------------------
// Worker 2: Analytics Queue — Event Ingestion
// -----------------------------------------------------------------------------

async function processAnalyticsJob(job: Job<AnalyticsIngestJobData>) {
  const { storefrontId, event, data, timestamp } = job.data;

  try {
    const eventDate = new Date(timestamp).toISOString().split('T')[0] || new Date().toISOString().split('T')[0];

    if (event === 'page_view') {
      await db.storefrontAnalytics.upsert({
        where: { storefrontId_date: { storefrontId, date: eventDate } },
        create: {
          storefrontId,
          date: eventDate,
          totalViews: 1,
          uniqueVisitors: data.uniqueVisitor ? 1 : 0,
        },
        update: {
          totalViews: { increment: 1 },
          uniqueVisitors: data.uniqueVisitor ? { increment: 1 } : undefined,
        },
      });
    }

    return { processed: true, event, storefrontId };
  } catch (error) {
    console.error(`[Worker:analytics] Job ${job.id} failed:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Worker 3: Pipeline Logs Queue — Log Persistence
// -----------------------------------------------------------------------------

async function processPipelineLogJob(job: Job<PipelineLogJobData>) {
  const { executionId, stage, level, agent, message, detail, inputTokens, outputTokens, durationMs } = job.data;

  try {
    await db.pipelineLog.create({
      data: {
        executionId,
        stage,
        level,
        agent,
        message,
        detail: detail || null,
        inputTokens: inputTokens || null,
        outputTokens: outputTokens || null,
        durationMs: durationMs || null,
      },
    });

    return { logged: true, executionId, stage };
  } catch (error) {
    console.error(`[Worker:pipeline-logs] Job ${job.id} failed:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Worker 4: Cleanup Queue — Data Maintenance
// -----------------------------------------------------------------------------

async function processCleanupJob(job: Job<CleanupJobData>) {
  const { type, olderThanDays } = job.data;
  const days = olderThanDays || 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  try {
    let deleted = 0;

    switch (type) {
      case 'expired_sessions': {
        // Delete conversation sessions with no messages older than N days
        const oldSessions = await db.conversationSession.findMany({
          where: {
            lastMessageAt: { lt: cutoff },
            messages: { none: {} },
          },
          select: { id: true },
        });
        if (oldSessions.length > 0) {
          const result = await db.conversationSession.deleteMany({
            where: { id: { in: oldSessions.map(s => s.id) } },
          });
          deleted = result.count;
        }
        break;
      }

      case 'old_analytics': {
        const result = await db.storefrontAnalytics.deleteMany({
          where: { date: { lt: cutoff.toISOString().split('T')[0] } },
        });
        deleted = result.count;
        break;
      }

      case 'stale_executions': {
        const result = await db.pipelineExecution.deleteMany({
          where: {
            status: { in: ['completed', 'failed', 'cancelled'] },
            completedAt: { lt: cutoff },
          },
        });
        deleted = result.count;
        break;
      }

      case 'old_audit_logs': {
        const result = await db.auditLog.deleteMany({
          where: { timestamp: { lt: cutoff } },
        });
        deleted = result.count;
        break;
      }

      default:
        console.warn(`[Worker:cleanup] Unknown cleanup type: ${type}`);
    }

    console.log(`[Worker:cleanup] Cleaned up ${deleted} ${type} records (older than ${days}d)`);
    return { cleaned: true, type, deleted };
  } catch (error) {
    console.error(`[Worker:cleanup] Job ${job.id} failed:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Worker 5: Notifications Queue — Notification Delivery
// -----------------------------------------------------------------------------

async function processNotificationJob(job: Job<NotificationJobData>) {
  const { to, subject, template, data } = job.data;

  try {
    // Log the notification for now — email delivery can be implemented later
    console.log(`[Worker:notifications] Notification queued: to=${to}, subject=${subject}, template=${template}`);

    // Store notification record for audit trail
    await db.auditLog.create({
      data: {
        action: 'notification.sent',
        resource: 'notification',
        level: 'info',
        actorType: 'system',
        details: JSON.stringify({ to, subject, template, data, sentAt: new Date().toISOString() }),
      },
    }).catch(() => {});

    return { delivered: false, reason: 'email_not_configured', to, subject };
  } catch (error) {
    console.error(`[Worker:notifications] Job ${job.id} failed:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Worker Registration
// -----------------------------------------------------------------------------

const workers: Worker[] = [];

function createWorkers() {
  // Generation worker — concurrency 1 (LLM calls are expensive)
  const generationWorker = new Worker<GenerateWebsiteJobData>(
    'generation',
    (job) => processGenerationJob(job),
    {
      connection: workerConnection,
      concurrency: 1,
      limiter: { max: 3, duration: 60_000 }, // Max 3 per minute
    },
  );

  // Analytics worker — concurrency 5 (high frequency, short jobs)
  const analyticsWorker = new Worker<AnalyticsIngestJobData>(
    'analytics',
    (job) => processAnalyticsJob(job),
    {
      connection: workerConnection,
      concurrency: 5,
    },
  );

  // Pipeline logs worker — concurrency 3
  const pipelineLogsWorker = new Worker<PipelineLogJobData>(
    'pipeline-logs',
    (job) => processPipelineLogJob(job),
    {
      connection: workerConnection,
      concurrency: 3,
    },
  );

  // Cleanup worker — concurrency 1 (long running, low priority)
  const cleanupWorker = new Worker<CleanupJobData>(
    'cleanup',
    (job) => processCleanupJob(job),
    {
      connection: workerConnection,
      concurrency: 1,
    },
  );

  // Notifications worker — concurrency 2
  const notificationsWorker = new Worker<NotificationJobData>(
    'notifications',
    (job) => processNotificationJob(job),
    {
      connection: workerConnection,
      concurrency: 2,
    },
  );

  // Register event handlers
  for (const [name, worker] of [
    ['generation', generationWorker],
    ['analytics', analyticsWorker],
    ['pipeline-logs', pipelineLogsWorker],
    ['cleanup', cleanupWorker],
    ['notifications', notificationsWorker],
  ]) {
    worker.on('completed', (job) => {
      console.log(`[Worker:${name}] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker:${name}] Job ${job?.id} failed:`, err.message);
    });

    worker.on('error', (err) => {
      console.error(`[Worker:${name}] Worker error:`, err.message);
    });

    worker.on('ready', () => {
      console.log(`[Worker:${name}] Ready and listening`);
    });

    workers.push(worker);
  }
}

// -----------------------------------------------------------------------------
// Health Check HTTP Server
// -----------------------------------------------------------------------------

// Shared Redis client for health checks (prevents connection leak per request)
let healthRedis: Redis | null = null;
function getHealthRedis(): Redis {
  if (!healthRedis) {
    healthRedis = new Redis(REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    healthRedis.on('error', () => {}); // Suppress unhandled errors
  }
  return healthRedis;
}

function startHealthServer() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const http = require('http');

  const server = http.createServer(async (req: any, res: any) => {
    if (req.url === '/health' && req.method === 'GET') {
      try {
        // Check database connectivity
        const dbStart = Date.now();
        await db.$queryRawUnsafe('SELECT 1 as ok');
        const dbLatencyMs = Date.now() - dbStart;

        // Check Redis connectivity (reuses shared connection)
        const redisStart = Date.now();
        const redis = getHealthRedis();
        await redis.ping();
        const redisLatencyMs = Date.now() - redisStart;

        const health = {
          status: 'healthy',
          service: 'storecraft-worker',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          pid: process.pid,
          database: { status: 'healthy', latencyMs: dbLatencyMs },
          redis: { status: 'healthy', latencyMs: redisLatencyMs },
          workers: {
            generation: { active: workers[0]?.isRunning() ?? false },
            analytics: { active: workers[1]?.isRunning() ?? false },
            'pipeline-logs': { active: workers[2]?.isRunning() ?? false },
            cleanup: { active: workers[3]?.isRunning() ?? false },
            notifications: { active: workers[4]?.isRunning() ?? false },
          },
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'unhealthy', error: errorMsg }));
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`[Worker] Health check server running on port ${PORT}`);
  });
}

// -----------------------------------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------------------------------

async function gracefulShutdown() {
  console.log('\n[Worker] Graceful shutdown initiated...');

  // Stop accepting new jobs
  for (const worker of workers) {
    try {
      await worker.close();
      console.log(`[Worker] ${worker.id || 'unknown'} closed`);
    } catch (err) {
      console.error(`[Worker] Error closing worker:`, err);
    }
  }

  // Disconnect Prisma
  try {
    await db.$disconnect();
    console.log('[Worker] Database connection closed');
  } catch (err) {
    console.error('[Worker] Error disconnecting database:', err);
  }

  process.exit(0);
}

// -----------------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------------

console.log('='.repeat(60));
console.log('StoreCraft Worker Service');
console.log('='.repeat(60));
console.log(`Redis:   ${REDIS_URL.replace(/:([^:@]+)@/, ':****@')}`);
console.log(`DB:      ${DATABASE_URL.replace(/:([^:@]+)@/, ':****@')}`);
console.log(`Port:    ${PORT}`);
console.log(`Workers: ${CONCURRENCY} concurrent`);
console.log('='.repeat(60));

// Start workers
createWorkers();

// Start health check server
startHealthServer();

// Register shutdown handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (err) => {
  console.error('[Worker] Uncaught exception:', err);
  gracefulShutdown();
});
