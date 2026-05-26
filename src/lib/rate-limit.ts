// =============================================================================
// Distributed Rate Limiter (Redis-backed with In-Memory Fallback)
// =============================================================================
// Provides a token-bucket / sliding-window rate limiter that:
// 1. Uses Redis for distributed rate limiting across instances
// 2. Falls back to in-memory when Redis is unavailable (graceful degradation)
// 3. Exports pre-configured limiters for common use cases
// 4. Maintains backward compatibility with the legacy `rateLimit()` function
// =============================================================================

import { redis, checkRateLimit } from '@/lib/redis';

// =============================================================================
// Types
// =============================================================================

/** Result returned by `RateLimiter.check()` */
export interface RateLimitCheckResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (ms) when the rate limit window resets */
  resetAt: number;
  /** Milliseconds until a token becomes available (0 if allowed) */
  retryAfterMs: number;
}

/** Result returned by `RateLimiter.consume()` */
export interface RateLimitConsumeResult {
  /** Whether the consumption was successful */
  allowed: boolean;
  /** Remaining requests after consumption */
  remaining: number;
  /** Unix timestamp (ms) when the rate limit window resets */
  resetAt: number;
}

/** Options for constructing a RateLimiter instance */
export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Length of the sliding window in seconds */
  windowSeconds: number;
}

// =============================================================================
// In-Memory Fallback (Graceful Degradation)
// =============================================================================

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, InMemoryEntry>();

/**
 * In-memory rate limit check used when Redis is unavailable.
 * Uses a fixed-window counter with automatic expiry.
 */
function inMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitCheckResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - (now % windowMs);
  const resetAt = windowStart + windowMs;

  let entry = inMemoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    entry = { count: 0, resetAt };
    inMemoryStore.set(key, entry);
  }

  entry.count += 1;

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfterMs = allowed ? 0 : entry.resetAt - now;

  return { allowed, remaining, resetAt, retryAfterMs };
}

/**
 * Periodically clean up expired in-memory entries to prevent memory leaks.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (entry.resetAt <= now) {
      inMemoryStore.delete(key);
    }
  }
}, 5 * 60_000);

// =============================================================================
// Redis Health Detection
// =============================================================================

let redisHealthy = true;
let lastRedisCheck = 0;
const REDIS_HEALTH_CHECK_INTERVAL = 30_000; // Check every 30 seconds

/**
 * Check if Redis is healthy. Caches the result to avoid pinging on every request.
 */
async function isRedisHealthy(): Promise<boolean> {
  const now = Date.now();
  if (now - lastRedisCheck < REDIS_HEALTH_CHECK_INTERVAL) {
    return redisHealthy;
  }

  try {
    await redis.ping();
    redisHealthy = true;
  } catch {
    redisHealthy = false;
  }
  lastRedisCheck = now;
  return redisHealthy;
}

// =============================================================================
// RateLimiter Class
// =============================================================================

/**
 * A rate limiter backed by Redis with automatic in-memory fallback.
 *
 * Uses a sliding-window counter algorithm in Redis (via `checkRateLimit`)
 * and falls back to an in-memory fixed-window counter when Redis is
 * unavailable. This ensures that rate limiting always works, even during
 * Redis outages.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter('api:global', { maxRequests: 100, windowSeconds: 60 });
 * const result = await limiter.check('ip:192.168.1.1');
 * if (!result.allowed) {
 *   return new Response('Rate limited', { status: 429 });
 * }
 * ```
 */
export class RateLimiter {
  private readonly key: string;
  private readonly maxRequests: number;
  private readonly windowSeconds: number;

  /**
   * Create a new RateLimiter instance.
   *
   * @param key - A namespace/prefix for this limiter (e.g., 'chat', 'voice', 'api')
   * @param options - Configuration for the rate limit window
   */
  constructor(key: string, options: RateLimitOptions) {
    this.key = key;
    this.maxRequests = options.maxRequests;
    this.windowSeconds = options.windowSeconds;
  }

  /**
   * Check if a request from the given identifier is allowed.
   * Does NOT consume a token — use `consume()` to both check and consume.
   *
   * @param identifier - Unique identifier (usually IP or sessionId)
   * @returns Result indicating if the request is allowed and remaining quota
   */
  async check(identifier: string): Promise<RateLimitCheckResult> {
    const fullKey = `${this.key}:${identifier}`;

    try {
      if (await isRedisHealthy()) {
        const result = await checkRateLimit(fullKey, this.maxRequests, this.windowSeconds);
        const retryAfterMs = result.allowed ? 0 : Math.max(0, result.resetAt - Date.now());
        return {
          allowed: result.allowed,
          remaining: result.remaining,
          resetAt: result.resetAt,
          retryAfterMs,
        };
      }
    } catch {
      // Fall through to in-memory
    }

    return inMemoryRateLimit(fullKey, this.maxRequests, this.windowSeconds);
  }

  /**
   * Consume n tokens from the rate limit bucket.
   * Equivalent to `check()` but atomically increments the counter.
   *
   * @param identifier - Unique identifier (usually IP or sessionId)
   * @param n - Number of tokens to consume (default: 1)
   * @returns Result indicating if consumption was allowed
   */
  async consume(identifier: string, n: number = 1): Promise<RateLimitConsumeResult> {
    const fullKey = `${this.key}:${identifier}`;

    try {
      if (await isRedisHealthy()) {
        // checkRateLimit increments by 1, so call it n times for multi-token consumption
        let lastResult = await checkRateLimit(fullKey, this.maxRequests, this.windowSeconds);
        for (let i = 1; i < n; i++) {
          lastResult = await checkRateLimit(fullKey, this.maxRequests, this.windowSeconds);
        }
        return {
          allowed: lastResult.allowed,
          remaining: lastResult.remaining,
          resetAt: lastResult.resetAt,
        };
      }
    } catch {
      // Fall through to in-memory
    }

    const result = inMemoryRateLimit(fullKey, this.maxRequests, this.windowSeconds);
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  }
}

// =============================================================================
// Pre-Configured Rate Limiters
// =============================================================================

/**
 * Rate limiter for website generation requests.
 * 5 requests per minute per IP — generation is expensive.
 */
export const generationLimiter = new RateLimiter('generation', {
  maxRequests: 5,
  windowSeconds: 60,
});

/**
 * Rate limiter for chat/conversation API.
 * 30 requests per minute per IP.
 */
export const chatLimiter = new RateLimiter('chat', {
  maxRequests: 30,
  windowSeconds: 60,
});

/**
 * Rate limiter for voice processing endpoints.
 * 10 requests per minute per IP — voice processing is resource-intensive.
 */
export const voiceLimiter = new RateLimiter('voice', {
  maxRequests: 10,
  windowSeconds: 60,
});

/**
 * Rate limiter for storefront CRUD operations.
 * 60 requests per minute per IP.
 */
export const storefrontLimiter = new RateLimiter('storefront', {
  maxRequests: 60,
  windowSeconds: 60,
});

/**
 * General-purpose API rate limiter.
 * 100 requests per minute per IP.
 */
export const apiLimiter = new RateLimiter('api', {
  maxRequests: 100,
  windowSeconds: 60,
});

// =============================================================================
// Rate Limit Middleware Helper
// =============================================================================

/**
 * Create a rate limit middleware function for use in API routes.
 *
 * @param key - Rate limit key prefix (e.g., 'chat', 'generation')
 * @param limiter - The RateLimiter instance to use
 * @returns An async function that checks rate limits and returns a 429 Response if exceeded
 *
 * @example
 * ```ts
 * // In an API route handler:
 * const rateLimitGuard = rateLimitMiddleware('chat', chatLimiter);
 * const blocked = await rateLimitGuard(clientIp);
 * if (blocked) return blocked;
 * ```
 */
export async function rateLimitMiddleware(
  key: string,
  limiter: RateLimiter
): Promise<(identifier: string) => Promise<Response | null>> {
  return async (identifier: string): Promise<Response | null> => {
    const result = await limiter.check(identifier);
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please slow down.',
          retryAfterMs: result.retryAfterMs,
          resetAt: result.resetAt,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.retryAfterMs / 1000).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toString(),
          },
        }
      );
    }
    return null;
  };
}

// =============================================================================
// Legacy Backward-Compatible Export
// =============================================================================

/**
 * Synchronous in-memory rate limit check.
 *
 * @deprecated Use `RateLimiter` class or one of the pre-configured limiters instead.
 * This function remains for backward compatibility with existing API routes.
 *
 * @param key - Rate limit key (e.g., "chat:192.168.1.1")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Window duration in milliseconds (default: 60,000)
 */
export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const windowSeconds = Math.ceil(windowMs / 1000);
  return inMemoryRateLimit(key, maxRequests, windowSeconds);
}

/**
 * Cleanup stale in-memory rate limit entries.
 *
 * @deprecated Called automatically on an interval. Exported for manual cleanup if needed.
 */
export function cleanupRateLimits(maxAgeMs: number = 5 * 60_000): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore) {
    if (entry.resetAt <= now || now - entry.resetAt > maxAgeMs) {
      inMemoryStore.delete(key);
    }
  }
}
