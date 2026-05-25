// =============================================================================
// Scalability Layer — Connection Pool & Scaling Abstractions
// =============================================================================
// Provides connection management, backpressure handling, resource limits,
// and horizontal scaling preparation. Built for PostgreSQL + Redis
// with support for horizontal scaling in production.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface PoolStats {
  active: number;
  idle: number;
  waiting: number;
  totalCreated: number;
  totalReleased: number;
  totalErrors: number;
  maxCapacity: number;
  utilizationPercent: number;
}

export interface ResourceLimiterConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
}

export interface RateLimitEntry {
  key: string;
  count: number;
  windowStart: number;
  windowEnd: number;
}

// -----------------------------------------------------------------------------
// Generic Resource Pool
// -----------------------------------------------------------------------------

/**
 * A generic pool for managing reusable resources (DB connections, HTTP clients,
 * browser instances, etc.). Supports:
 * - Max capacity with backpressure
 * - Queue for excess requests
 * - Timeout on acquisition
 * - Health check for idle resources
 * - Auto-cleanup of stale resources
 */
export class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Map<T, number>(); // resource -> acquired timestamp
  private queue: Array<{ resolve: (res: T) => void; reject: (err: Error) => void; timeout: NodeJS.Timeout }> = [];
  private totalCreated = 0;
  private totalReleased = 0;
  private totalErrors = 0;
  private destroy: (resource: T) => Promise<void>;
  private healthCheck: (resource: T) => boolean;
  private idleTimeoutMs: number;

  constructor(
    private readonly factory: () => Promise<T>,
    options: {
      initialSize?: number;
      maxSize?: number;
      destroy?: (resource: T) => Promise<void>;
      healthCheck?: (resource: T) => boolean;
      idleTimeoutMs?: number;
    } = {},
  ) {
    this.destroy = options.destroy || (async () => {});
    this.healthCheck = options.healthCheck || (() => true);
    this.idleTimeoutMs = options.idleTimeoutMs || 5 * 60_000;
  }

  /**
   * Acquire a resource from the pool. Will wait in queue if pool is exhausted.
   */
  async acquire(timeoutMs = 30_000): Promise<T> {
    // Try to get an available resource
    while (this.available.length > 0) {
      const resource = this.available.pop()!;
      if (this.healthCheck(resource)) {
        this.inUse.set(resource, Date.now());
        return resource;
      } else {
        await this.destroy(resource);
        this.totalErrors++;
      }
    }

    // Create new if under max
    const maxSize = (this.factory as unknown as { _maxSize?: number })._maxSize ?? 10;
    if (this.inUse.size + this.available.length < maxSize) {
      try {
        const resource = await this.factory();
        this.totalCreated++;
        this.inUse.set(resource, Date.now());
        return resource;
      } catch (err) {
        this.totalErrors++;
        throw new Error(`Failed to create resource: ${String(err)}`);
      }
    }

    // Enqueue with timeout
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.queue.findIndex(q => q.resolve === resolve);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error(`Resource acquisition timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.queue.push({ resolve, reject, timeout });
    });
  }

  /**
   * Release a resource back to the pool.
   */
  release(resource: T): void {
    if (!this.inUse.has(resource)) return;
    this.inUse.delete(resource);
    this.totalReleased++;

    // If someone is waiting, give it to them
    if (this.queue.length > 0) {
      const waiter = this.queue.shift()!;
      clearTimeout(waiter.timeout);
      this.inUse.set(resource, Date.now());
      waiter.resolve(resource);
    } else {
      this.available.push(resource);
    }
  }

  /**
   * Get pool statistics.
   */
  getStats(): PoolStats {
    const maxSize = (this.factory as unknown as { _maxSize?: number })._maxSize || 10;
    return {
      active: this.inUse.size,
      idle: this.available.length,
      waiting: this.queue.length,
      totalCreated: this.totalCreated,
      totalReleased: this.totalReleased,
      totalErrors: this.totalErrors,
      maxCapacity: maxSize,
      utilizationPercent: maxSize > 0
        ? Math.round(((this.inUse.size) / maxSize) * 100)
        : 0,
    };
  }

  /**
   * Drain the pool — release all resources.
   */
  async drain(): Promise<void> {
    // Reject all waiting requests
    for (const waiter of this.queue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool drained'));
    }
    this.queue = [];

    // Destroy available resources
    for (const resource of this.available) {
      await this.destroy(resource);
    }
    this.available = [];

    // Destroy in-use resources
    for (const resource of this.inUse.keys()) {
      await this.destroy(resource);
    }
    this.inUse.clear();
  }

  /**
   * Clean up idle resources that have been available too long.
   */
  cleanupStale(): number {
    const now = Date.now();
    const before = this.available.length;
    this.available = this.available.filter(resource => {
      const isHealthy = this.healthCheck(resource);
      if (!isHealthy) {
        this.destroy(resource).catch(() => {});
        this.totalErrors++;
        return false;
      }
      return true;
    });
    return before - this.available.length;
  }
}

// -----------------------------------------------------------------------------
// Backpressure Controller
// -----------------------------------------------------------------------------

/**
 * Controls the rate of operations to prevent system overload.
 * Uses a sliding window approach with configurable concurrency limits.
 */
export class BackpressureController {
  private active = 0;
  private queue: Array<{ execute: () => Promise<void>; resolve: () => void; reject: (err: Error) => void }> = [];
  private config: ResourceLimiterConfig;

  constructor(config?: Partial<ResourceLimiterConfig>) {
    this.config = {
      maxConcurrent: config?.maxConcurrent || 5,
      maxQueueSize: config?.maxQueueSize || 100,
      timeoutMs: config?.timeoutMs || 60_000,
      retryDelayMs: config?.retryDelayMs || 1000,
      maxRetries: config?.maxRetries || 2,
    };
  }

  /**
   * Submit work to the controller. Will execute when concurrency allows.
   */
  async submit<T>(work: () => Promise<T>): Promise<T> {
    if (this.active < this.config.maxConcurrent) {
      this.active++;
      try {
        return await work();
      } finally {
        this.active--;
        this.processQueue();
      }
    }

    // Queue the work
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error(`Backpressure: queue full (${this.queue.length}/${this.config.maxQueueSize})`);
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: async () => {
          try {
            resolve(await work());
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        },
        resolve: () => {},
        reject: () => {},
      });

      const timeout = setTimeout(() => {
        const idx = this.queue.findIndex(q => q.execute === work);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          reject(new Error(`Backpressure: queued work timed out after ${this.config.timeoutMs}ms`));
        }
      }, this.config.timeoutMs);
    });
  }

  /**
   * Process queued work when concurrency drops.
   */
  private processQueue(): void {
    while (this.active < this.config.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.active++;
      item.execute().finally(() => {
        this.active--;
        this.processQueue();
      });
    }
  }

  getStats() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.config.maxConcurrent,
      maxQueueSize: this.config.maxQueueSize,
    };
  }
}

// -----------------------------------------------------------------------------
// Sliding Window Rate Limiter (per-key)
// -----------------------------------------------------------------------------

/**
 * More advanced rate limiter using sliding windows with per-key tracking.
 * Complements the token-bucket limiter in rate-limit.ts.
 */
export class SlidingWindowLimiter {
  private entries = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed under the rate limit.
   */
  check(key: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.entries.get(key);

    // Create or reset window
    if (!entry || now > entry.windowEnd) {
      this.entries.set(key, {
        key,
        count: 1,
        windowStart: now,
        windowEnd: now + this.windowMs,
      });
      return { allowed: true, remaining: this.maxRequests - 1, retryAfterMs: 0 };
    }

    // Within window
    entry.count++;
    if (entry.count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.windowEnd - now,
      };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      retryAfterMs: 0,
    };
  }

  /**
   * Clean up expired entries.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.entries) {
      if (now > entry.windowEnd) {
        this.entries.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Get number of tracked keys.
   */
  size(): number {
    return this.entries.size;
  }
}

// -----------------------------------------------------------------------------
// Pre-configured Instances
// -----------------------------------------------------------------------------

/** Controls concurrent website generation operations */
export const generationBackpressure = new BackpressureController({
  maxConcurrent: 3,
  maxQueueSize: 20,
  timeoutMs: 120_000,
});

/** Controls concurrent LLM API calls */
export const llmBackpressure = new BackpressureController({
  maxConcurrent: 5,
  maxQueueSize: 50,
  timeoutMs: 60_000,
});

/** Per-IP sliding window rate limiter for API endpoints */
export const apiSlidingLimiter = new SlidingWindowLimiter(100, 60_000);

// Auto-cleanup every 5 minutes
setInterval(() => {
  apiSlidingLimiter.cleanup();
}, 5 * 60_000);
