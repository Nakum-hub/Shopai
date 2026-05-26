import { Queue, Worker, type Processor, type Job } from 'bullmq';
import type { RedisOptions } from 'ioredis';

// =============================================================================
// BullMQ Queue System
// =============================================================================
// Redis-backed job queue for:
// 1. Website generation pipeline (heavy LLM work)
// 2. Analytics ingestion (high-frequency writes)
// 3. AI pipeline logging (non-blocking persistence)
// 4. Email notifications (async delivery)
// 5. Data cleanup and maintenance
// =============================================================================

// -----------------------------------------------------------------------------
// Redis Connection Config (shared with BullMQ)
// -----------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function parseRedisUrl(url: string): { host: string; port: number; password?: string } {
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

const redisParsed = parseRedisUrl(REDIS_URL);

const connection: RedisOptions = {
  host: redisParsed.host,
  port: redisParsed.port,
  password: redisParsed.password,
  maxRetriesPerRequest: null, // BullMQ requires null for Worker connections
  enableReadyCheck: false,
};

// Publisher connection (Queue uses this)
const publisherConnection: RedisOptions = {
  ...connection,
  maxRetriesPerRequest: 3,
};

// -----------------------------------------------------------------------------
// Queue Definitions
// -----------------------------------------------------------------------------

export interface GenerateWebsiteJobData {
  storefrontId: string;
  sessionId: string;
  businessProfile: Record<string, unknown>;
  voiceTranscript?: string;
}

export interface AnalyticsIngestJobData {
  storefrontId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface PipelineLogJobData {
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

export interface CleanupJobData {
  type: 'expired_sessions' | 'old_analytics' | 'stale_executions';
  olderThanDays?: number;
}

export interface EmailNotificationJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Queue Instances
// -----------------------------------------------------------------------------

/** Website generation pipeline — heavy LLM work, long-running jobs */
export const generationQueue = new Queue<GenerateWebsiteJobData>('generation', {
  connection: publisherConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
    removeOnFail: { count: 200 }, // Keep last 200 failed jobs for debugging
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s → 10s → 20s
    },
    // Note: Job timeout handled by Worker's autorun handler, not DefaultJobOptions (BullMQ v5)
  },
});

/** Analytics event ingestion — high-frequency, short-lived jobs */
export const analyticsQueue = new Queue<AnalyticsIngestJobData>('analytics', {
  connection: publisherConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 500,
    attempts: 2,
    backoff: { type: 'fixed', delay: 1000 },
  },
});

/** Pipeline logging — non-blocking persistence of stage logs */
export const pipelineLogQueue = new Queue<PipelineLogJobData>('pipeline-logs', {
  connection: publisherConnection,
  defaultJobOptions: {
    removeOnComplete: 5000,
    removeOnFail: 100,
    attempts: 2,
    backoff: { type: 'fixed', delay: 500 },
  },
});

/** Data cleanup and maintenance */
export const cleanupQueue = new Queue<CleanupJobData>('cleanup', {
  connection: publisherConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 10,
    attempts: 2,
    backoff: { type: 'fixed', delay: 5000 },
  },
});

/** Email/notification delivery */
export const notificationQueue = new Queue<EmailNotificationJobData>('notifications', {
  connection: publisherConnection,
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 100,
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
  },
});

// -----------------------------------------------------------------------------
// Worker Registration
// -----------------------------------------------------------------------------

const workers: Worker[] = [];

/**
 * Register a worker for a queue. Workers process jobs from the queue.
 * Only call this in the main server process, not in API routes.
 */
export function registerWorker<T = unknown>(
  queueName: string,
  processor: Processor<T>,
  concurrency: number = 1
): Worker {
  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on('completed', (job: Job) => {
    console.log(`[Queue:${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`[Queue:${queueName}] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err: Error) => {
    console.error(`[Queue:${queueName}] Worker error:`, err.message);
  });

  workers.push(worker);
  return worker;
}

// -----------------------------------------------------------------------------
// Queue Health Check
// -----------------------------------------------------------------------------

export interface QueueHealth {
  name: string;
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}

export async function queueHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  queues: QueueHealth[];
}> {
  const queues = [
    { name: 'generation', queue: generationQueue },
    { name: 'analytics', queue: analyticsQueue },
    { name: 'pipeline-logs', queue: pipelineLogQueue },
    { name: 'cleanup', queue: cleanupQueue },
    { name: 'notifications', queue: notificationQueue },
  ];

  const results: QueueHealth[] = [];

  try {
    for (const { name, queue } of queues) {
      const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
      results.push({
        name,
        active: counts.active,
        waiting: counts.waiting,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      });
    }

    const totalWaiting = results.reduce((sum, q) => sum + q.waiting + q.active, 0);
    const totalFailed = results.reduce((sum, q) => sum + q.failed, 0);

    return {
      status: totalFailed > 100 ? 'unhealthy' : totalWaiting > 50 ? 'degraded' : 'healthy',
      queues: results,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      queues: results,
    };
  }
}

// -----------------------------------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------------------------------

export async function closeQueues(): Promise<void> {
  try {
    // Close workers first (stop processing)
    for (const worker of workers) {
      await worker.close();
    }

    // Close queues
    await Promise.all([
      generationQueue.close(),
      analyticsQueue.close(),
      pipelineLogQueue.close(),
      cleanupQueue.close(),
      notificationQueue.close(),
    ]);

    console.log('[Queue] All queues and workers closed');
  } catch (err) {
    console.error('[Queue] Error closing queues:', err);
  }
}

if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await closeQueues();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
