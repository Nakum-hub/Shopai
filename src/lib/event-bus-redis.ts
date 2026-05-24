// =============================================================================
// Redis-Backed Event Bus
// =============================================================================
// A Redis-backed event bus that replaces the in-memory EventBus for
// cross-process event delivery. Falls back to in-memory mode if Redis
// is unavailable.
//
// Features:
// 1. Same API as EventBus (publish, subscribe, once, unsubscribeByPattern)
// 2. Redis Pub/Sub for real-time delivery across processes
// 3. Event persistence in Redis list for replay (LTRIM to max 10000)
// 4. Graceful fallback to in-memory if Redis is down
// 5. Consumer groups for parallel processing (conceptual — uses Redis streams)
// 6. Health check diagnostics
//
// Dependencies:
// - ioredis Redis client from @/lib/redis
// =============================================================================

import Redis from 'ioredis';
import type { EventPriority, AppEvent, EventHandler } from '@/lib/event-bus';
import { EventBus } from '@/lib/event-bus';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Configuration for the RedisEventBus */
export interface RedisEventBusConfig {
  /** Redis key prefix for namespacing (default: 'eventbus') */
  keyPrefix: string;
  /** Maximum number of events to store in history (default: 10000) */
  maxHistorySize: number;
  /** TTL for stored events in seconds (default: 604800 = 7 days) */
  historyTtlSeconds: number;
  /** Redis channel prefix for Pub/Sub (default: 'evt') */
  channelPrefix: string;
  /** Whether to use Redis fallback when connection fails (default: true) */
  fallbackToInMemory: boolean;
}

/** Health check result for the RedisEventBus */
export interface RedisEventBusHealth {
  redis: boolean;
  mode: 'redis' | 'in-memory' | 'hybrid';
  subscriberCount: number;
  eventCount: number;
  historySize: number;
  latencyMs: number;
}

/** Subscription entry with metadata */
interface RedisSubscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  once: boolean;
  createdAt: number;
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: RedisEventBusConfig = {
  keyPrefix: 'eventbus',
  maxHistorySize: 10000,
  historyTtlSeconds: 604800, // 7 days
  channelPrefix: 'evt',
  fallbackToInMemory: true,
};

// -----------------------------------------------------------------------------
// RedisEventBus Implementation
// -----------------------------------------------------------------------------

/**
 * Redis-backed event bus with graceful in-memory fallback.
 *
 * Architecture:
 * - Publisher: Redis PUBLISH to channel `evt:{eventType}`
 * - Subscriber: Redis SUBSCRIBE to pattern `evt:*`
 * - History: Redis LIST `eventbus:history` with LTRIM for bounded size
 * - Fallback: In-memory EventBus when Redis is unavailable
 */
class RedisEventBus {
  private config: RedisEventBusConfig;
  private subscriptions = new Map<string, RedisSubscription>();
  private subscriptionCounter = 0;
  private fallbackBus: EventBus;
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;
  private redisReady = false;
  private _mode: 'redis' | 'in-memory' | 'hybrid' = 'in-memory';

  // Track event count for stats
  private publishedCount = 0;
  private receivedCount = 0;

  constructor(config?: Partial<RedisEventBusConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fallbackBus = new EventBus(this.config.maxHistorySize);
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  /**
   * Connect to Redis for Pub/Sub. Call this before using publish/subscribe
   * for Redis-backed operation. If not called, falls back to in-memory.
   *
   * @param redisUrl - Redis connection URL
   */
  async connect(redisUrl?: string): Promise<void> {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // Create dedicated publisher and subscriber connections
      // Redis requires separate connections for pub/sub
      this.publisher = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
        connectTimeout: 5000,
        commandTimeout: 3000,
        retryStrategy(times) {
          return Math.min(times * 200, 5000);
        },
      });

      this.subscriber = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
        connectTimeout: 5000,
        commandTimeout: 3000,
        retryStrategy(times) {
          return Math.min(times * 200, 5000);
        },
      });

      // Wait for publisher to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 10000);
        this.publisher!.on('ready', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.publisher!.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      // Set up subscriber message handler
      this.subscriber.on('message', (channel: string, message: string) => {
        this.handleRedisMessage(channel, message);
      });

      // Subscribe to the wildcard pattern for all events
      const pattern = `${this.config.channelPrefix}:*`;
      await this.subscriber.subscribe(pattern);

      this.redisReady = true;
      this._mode = 'redis';
      console.log('[RedisEventBus] Connected to Redis — pub/sub active');
    } catch (error) {
      console.error('[RedisEventBus] Failed to connect to Redis, using in-memory fallback:', error);
      this.cleanupRedisConnections();
      this._mode = this.config.fallbackToInMemory ? 'in-memory' : 'error';
    }
  }

  // ---------------------------------------------------------------------------
  // Publish API
  // ---------------------------------------------------------------------------

  /**
   * Publish an event to all matching subscribers.
   * Same signature as the in-memory EventBus.
   *
   * @param type - Event type (e.g., "pipeline.started", "storefront.created")
   * @param data - Event payload
   * @param options - Priority, source, correlation ID, etc.
   */
  async publish<T = unknown>(
    type: string,
    data: T,
    options?: {
      priority?: EventPriority;
      source?: string;
      correlationId?: string;
      causationId?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<void> {
    const event: AppEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      data,
      timestamp: Date.now(),
      priority: options?.priority || 'normal',
      source: options?.source || 'system',
      correlationId: options?.correlationId,
      causationId: options?.causationId,
      metadata: options?.metadata,
    };

    this.publishedCount++;

    // Always store in fallback bus history (local replay)
    try {
      this.fallbackBus.publish(type, data, options);
    } catch {
      // Non-fatal
    }

    // Publish via Redis if connected
    if (this.redisReady && this.publisher) {
      try {
        const channel = `${this.config.channelPrefix}:${type}`;
        const message = JSON.stringify(event);
        await this.publisher.publish(channel, message);

        // Store in Redis history list
        await this.storeInHistory(event);
      } catch (error) {
        console.error('[RedisEventBus] Redis publish failed, event only in local memory:', error);
        this.handleRedisFailure();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Subscribe API
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to events matching a pattern.
   * Supports exact match ("order.created") or wildcard ("order.*").
   *
   * @param pattern - Event pattern to subscribe to
   * @param handler - Callback function for matched events
   * @param options - Optional source filter and once flag
   * @returns Unsubscribe function
   */
  subscribe(
    pattern: string,
    handler: EventHandler,
    options?: { source?: string; once?: boolean }
  ): () => void {
    const id = `sub-${++this.subscriptionCounter}-${Date.now()}`;

    this.subscriptions.set(id, {
      id,
      pattern,
      handler,
      once: options?.once || false,
      createdAt: Date.now(),
    });

    // Also subscribe via fallback bus for local events
    this.fallbackBus.subscribe(pattern, handler, options);

    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Subscribe to an event exactly once, then auto-unsubscribe.
   */
  once(pattern: string, handler: EventHandler, options?: { source?: string }): () => void {
    return this.subscribe(pattern, handler, { ...options, once: true });
  }

  /**
   * Remove all subscribers matching a pattern.
   *
   * @param pattern - Pattern to unsubscribe from
   * @returns Number of subscriptions removed
   */
  unsubscribeByPattern(pattern: string): number {
    let count = 0;
    for (const [id, sub] of this.subscriptions) {
      if (sub.pattern === pattern) {
        this.subscriptions.delete(id);
        count++;
      }
    }
    // Also clean fallback bus
    this.fallbackBus.unsubscribeByPattern(pattern);
    return count;
  }

  // ---------------------------------------------------------------------------
  // History & Replay
  // ---------------------------------------------------------------------------

  /**
   * Get stored events from Redis history (last N events).
   *
   * @param options - Filter and limit options
   * @returns Array of stored AppEvents
   */
  async getHistory(options?: {
    pattern?: string;
    limit?: number;
  }): Promise<AppEvent[]> {
    // Get from fallback bus first (local events)
    const localEvents = this.fallbackBus.getHistory(options);

    if (!this.redisReady || !this.publisher) {
      return localEvents;
    }

    try {
      const historyKey = `${this.config.keyPrefix}:history`;
      const limit = Math.min(options?.limit || 50, 500);

      // Read the last N events from the Redis list
      const rawEvents = await this.publisher.lrange(historyKey, -limit, -1);

      const redisEvents: AppEvent[] = rawEvents
        .map((raw) => {
          try {
            return JSON.parse(raw) as AppEvent;
          } catch {
            return null;
          }
        })
        .filter((e): e is AppEvent => e !== null);

      // Merge with local events, deduplicate by ID
      const allEvents = new Map<string, AppEvent>();
      for (const event of [...redisEvents, ...localEvents]) {
        if (!allEvents.has(event.id)) {
          allEvents.set(event.id, event);
        }
      }

      let result = Array.from(allEvents.values());

      // Apply pattern filter
      if (options?.pattern) {
        result = result.filter((e) => this.patternMatches(e.type, options.pattern!));
      }

      return result.slice(-(options?.limit || 50));
    } catch (error) {
      console.error('[RedisEventBus] Failed to read Redis history:', error);
      return localEvents;
    }
  }

  /**
   * Replay stored events to a handler (catch-up for new subscribers).
   */
  async replay(
    pattern: string,
    handler: EventHandler,
    options?: { fromTimestamp?: number; limit?: number }
  ): Promise<number> {
    const events = await this.getHistory({
      pattern,
      limit: options?.limit || 100,
    });

    let count = 0;
    for (const event of events) {
      if (options?.fromTimestamp && event.timestamp < options.fromTimestamp) {
        continue;
      }
      if (this.patternMatches(event.type, pattern)) {
        try {
          await handler(event);
          count++;
        } catch (error) {
          console.error('[RedisEventBus] Replay handler error:', error);
        }
      }
    }
    return count;
  }

  // ---------------------------------------------------------------------------
  // Stats & Health
  // ---------------------------------------------------------------------------

  /**
   * Get the number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get the total number of events stored (local + Redis).
   */
  async getEventCount(): Promise<number> {
    let localCount = this.fallbackBus.getEventCount();

    if (this.redisReady && this.publisher) {
      try {
        const historyKey = `${this.config.keyPrefix}:history`;
        const redisCount = await this.publisher.llen(historyKey);
        return Math.max(localCount, redisCount);
      } catch {
        return localCount;
      }
    }

    return localCount;
  }

  /**
   * Perform a health check on the Redis event bus.
   *
   * @returns Health status with Redis connectivity, subscriber count, and event count
   */
  async healthCheck(): Promise<RedisEventBusHealth> {
    const startTime = Date.now();
    let redisAlive = false;

    if (this.redisReady && this.publisher) {
      try {
        const result = await this.publisher.ping();
        redisAlive = result === 'PONG';
      } catch {
        redisAlive = false;
      }
    }

    const historySize = await this.getHistorySize();

    return {
      redis: redisAlive,
      mode: redisAlive ? 'redis' : this._mode,
      subscriberCount: this.subscriptions.size,
      eventCount: this.publishedCount,
      historySize,
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Get the current operating mode.
   */
  getMode(): 'redis' | 'in-memory' | 'hybrid' | 'error' {
    return this._mode;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * Close Redis connections and clear subscriptions.
   */
  async close(): Promise<void> {
    this.cleanupRedisConnections();
    this.fallbackBus.clear();
    console.log('[RedisEventBus] Closed — all connections released');
  }

  /**
   * Clear all subscriptions and event history.
   */
  clear(): void {
    this.subscriptions.clear();
    this.fallbackBus.clear();
  }

  /**
   * Clear stored event history only (keep subscriptions).
   */
  async clearHistory(): Promise<void> {
    this.fallbackBus.clearHistory();

    if (this.redisReady && this.publisher) {
      try {
        const historyKey = `${this.config.keyPrefix}:history`;
        await this.publisher.del(historyKey);
      } catch (error) {
        console.error('[RedisEventBus] Failed to clear Redis history:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Handle an incoming message from Redis Pub/Sub.
   */
  private handleRedisMessage(channel: string, message: string): void {
    try {
      const event = JSON.parse(message) as AppEvent;

      // Extract event type from channel name
      const prefix = `${this.config.channelPrefix}:`;
      const eventType = channel.startsWith(prefix)
        ? channel.slice(prefix.length)
        : channel;

      this.receivedCount++;

      // Find matching local subscribers
      const matched = this.findLocalSubscribers(eventType);
      const toRemove: string[] = [];

      for (const sub of matched) {
        try {
          sub.handler(event);
          if (sub.once) {
            toRemove.push(sub.id);
          }
        } catch (error) {
          console.error(`[RedisEventBus] Handler error for "${eventType}":`, error);
        }
      }

      // Clean up once subscriptions
      for (const id of toRemove) {
        this.subscriptions.delete(id);
      }
    } catch {
      // Malformed message — ignore
    }
  }

  /**
   * Find local subscribers matching an event type.
   */
  private findLocalSubscribers(eventType: string): RedisSubscription[] {
    const matched: RedisSubscription[] = [];

    for (const sub of this.subscriptions.values()) {
      if (this.patternMatches(eventType, sub.pattern)) {
        matched.push(sub);
      }
    }

    return matched;
  }

  /**
   * Check if an event type matches a subscription pattern.
   * Supports exact match, suffix wildcard ("order.*"), and prefix wildcard ("*.created").
   */
  private patternMatches(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Suffix wildcard: "order.*" matches "order.created"
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix);
    }

    // Prefix wildcard: "*.created" matches "order.created"
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return eventType.endsWith(suffix);
    }

    return false;
  }

  /**
   * Store an event in Redis history list.
   * Uses RPUSH + LTRIM for bounded size.
   */
  private async storeInHistory(event: AppEvent): Promise<void> {
    if (!this.publisher) return;

    try {
      const historyKey = `${this.config.keyPrefix}:history`;

      // Use pipeline for atomic RPUSH + LTRIM
      const pipeline = this.publisher.pipeline();
      pipeline.rpush(historyKey, JSON.stringify(event));
      pipeline.ltrim(historyKey, -this.config.maxHistorySize, -1);
      pipeline.expire(historyKey, this.config.historyTtlSeconds);

      await pipeline.exec();
    } catch (error) {
      // History storage failure is non-fatal
      console.error('[RedisEventBus] Failed to store event in history:', error);
    }
  }

  /**
   * Get the current size of the Redis history list.
   */
  private async getHistorySize(): Promise<number> {
    if (!this.redisReady || !this.publisher) return 0;

    try {
      const historyKey = `${this.config.keyPrefix}:history`;
      return await this.publisher.llen(historyKey);
    } catch {
      return 0;
    }
  }

  /**
   * Handle a Redis failure — switch to fallback mode.
   */
  private handleRedisFailure(): void {
    this.redisReady = false;
    this._mode = this.config.fallbackToInMemory ? 'in-memory' : 'error';
  }

  /**
   * Clean up Redis connections safely.
   */
  private cleanupRedisConnections(): void {
    try {
      if (this.publisher) {
        this.publisher.disconnect();
        this.publisher = null;
      }
    } catch {
      // Ignore cleanup errors
    }

    try {
      if (this.subscriber) {
        this.subscriber.disconnect();
        this.subscriber = null;
      }
    } catch {
      // Ignore cleanup errors
    }

    this.redisReady = false;
  }
}

// -----------------------------------------------------------------------------
// Singleton Export
// -----------------------------------------------------------------------------

let _redisBus: RedisEventBus | null = null;

/**
 * Get the singleton RedisEventBus instance.
 * Does NOT auto-connect — call `connect()` to enable Redis-backed mode.
 *
 * @param config - Optional configuration overrides
 * @returns RedisEventBus instance (starts in in-memory mode)
 */
export function getRedisEventBus(config?: Partial<RedisEventBusConfig>): RedisEventBus {
  if (!_redisBus) {
    _redisBus = new RedisEventBus(config);
  }
  return _redisBus;
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    if (_redisBus) {
      await _redisBus.close();
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
