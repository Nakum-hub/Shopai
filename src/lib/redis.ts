import Redis, { type RedisOptions } from 'ioredis';

// =============================================================================
// Redis Client Singleton
// =============================================================================
// Provides:
// 1. Singleton connection (prevents multiple connections in dev hot reload)
// 2. Automatic reconnection with exponential backoff
// 3. Health check diagnostics
// 4. Pub/Sub support for real-time events
// 5. Graceful shutdown
// =============================================================================

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000); // 100ms → 3000ms max
    return delay;
  },
  reconnectOnError(err) {
    // Reconnect on READONLY errors (happens in Redis Cluster failover)
    return err.message.includes('READONLY');
  },
  enableReadyCheck: true,
  lazyConnect: true, // Don't connect immediately — connect on first command
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// -----------------------------------------------------------------------------
// Singleton Pattern
// -----------------------------------------------------------------------------

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

const createRedisClient = (): Redis => {
  const client = new Redis(REDIS_URL, redisOptions);

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected to Redis server');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting to Redis server...');
  });

  client.on('close', () => {
    console.log('[Redis] Connection closed');
  });

  return client;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// -----------------------------------------------------------------------------
// Pub/Sub Support (separate connection required by Redis protocol)
// -----------------------------------------------------------------------------

let publisherInstance: Redis | undefined;
let subscriberInstance: Redis | undefined;

/**
 * Get a Redis client dedicated to publishing messages.
 * Pub/Sub requires a dedicated connection — you cannot publish on a subscriber.
 */
export function getPublisher(): Redis {
  if (!publisherInstance) {
    publisherInstance = new Redis(REDIS_URL, {
      ...redisOptions,
      lazyConnect: true,
    });
    publisherInstance.on('error', (err) => {
      console.error('[Redis:Publisher] Error:', err.message);
    });
  }
  return publisherInstance;
}

/**
 * Get a Redis client dedicated to subscribing to channels.
 */
export function getSubscriber(): Redis {
  if (!subscriberInstance) {
    subscriberInstance = new Redis(REDIS_URL, {
      ...redisOptions,
      lazyConnect: true,
    });
    subscriberInstance.on('error', (err) => {
      console.error('[Redis:Subscriber] Error:', err.message);
    });
  }
  return subscriberInstance;
}

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------

export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  connected: boolean;
  version: string;
  memory: string;
  keysCount: number;
}> {
  const start = Date.now();

  try {
    const [pingResult, infoResult, dbSizeResult] = await Promise.all([
      redis.ping(),
      redis.info('server'),
      redis.dbsize(),
    ]);

    const latencyMs = Date.now() - start;

    // Parse Redis version from INFO response
    const versionMatch = infoResult.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch?.[1] || 'unknown';

    // Parse used memory
    const memoryMatch = infoResult.match(/used_memory_human:([^\r\n]+)/);
    const memory = memoryMatch?.[1] || 'unknown';

    return {
      status: latencyMs < 5 ? 'healthy' : latencyMs < 50 ? 'degraded' : 'unhealthy',
      latencyMs,
      connected: pingResult === 'PONG',
      version,
      memory,
      keysCount: dbSizeResult,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      connected: false,
      version: 'unavailable',
      memory: 'unknown',
      keysCount: 0,
    };
  }
}

// -----------------------------------------------------------------------------
// Session Store Helpers (for NextAuth / custom session management)
// -----------------------------------------------------------------------------

/**
 * Store a session in Redis with TTL.
 */
export async function setSession(
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds: number = 3600
): Promise<void> {
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify(data),
    'EX',
    ttlSeconds
  );
}

/**
 * Get a session from Redis.
 */
export async function getSession<T = Record<string, unknown>>(
  sessionId: string
): Promise<T | null> {
  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;
  return JSON.parse(data) as T;
}

/**
 * Delete a session from Redis.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}

/**
 * Refresh a session TTL (keep-alive).
 */
export async function refreshSession(
  sessionId: string,
  ttlSeconds: number = 3600
): Promise<boolean> {
  const result = await redis.expire(`session:${sessionId}`, ttlSeconds);
  return result === 1;
}

// -----------------------------------------------------------------------------
// Rate Limiting Helper
// -----------------------------------------------------------------------------

/**
 * Check and increment a rate limit counter.
 * Returns true if the request is allowed, false if rate limited.
 *
 * @param key - Rate limit key (e.g., "ratelimit:ip:192.168.1.1")
 * @param limit - Max requests in the window
 * @param windowSeconds - Time window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${now - (now % windowSeconds)}`;

  const current = await redis.incr(windowKey);

  if (current === 1) {
    await redis.expire(windowKey, windowSeconds);
  }

  const resetAt = (now - (now % windowSeconds) + windowSeconds) * 1000;
  const remaining = Math.max(0, limit - current);

  return {
    allowed: current <= limit,
    remaining,
    resetAt,
  };
}

// -----------------------------------------------------------------------------
// Graceful Shutdown
// -----------------------------------------------------------------------------

export async function disconnectRedis(): Promise<void> {
  try {
    await redis.quit();
    if (publisherInstance) await publisherInstance.quit();
    if (subscriberInstance) await subscriberInstance.quit();
    console.log('[Redis] All connections closed');
  } catch (err) {
    console.error('[Redis] Error closing connections:', err);
  }
}

if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await disconnectRedis();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
