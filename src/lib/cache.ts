// =============================================================================
// In-Memory Cache Layer
// =============================================================================
// Provides TTL-based caching for API responses, BI reports, and frequently
// accessed data. Prevents redundant DB queries and expensive LLM calls.
// =============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
}

interface CacheStats {
  size: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  evictions: number;
  namespaces: Record<string, number>;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private totalHits = 0;
  private totalMisses = 0;
  private evictions = 0;

  /**
   * Get a value from cache. Returns null if expired or not found.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.totalMisses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.evictions++;
      this.totalMisses++;
      return null;
    }

    entry.hits++;
    this.totalHits++;
    return entry.value as T;
  }

  /**
   * Set a value in cache with a TTL (time-to-live) in milliseconds.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    // Evict expired entries periodically (every 100 sets)
    if (this.totalHits + this.totalMisses % 100 === 0) {
      this.evictExpired();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific key.
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete all keys matching a prefix (e.g., for cache invalidation).
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get or compute a value. If the key exists in cache, return it.
   * Otherwise, call the factory function, cache the result, and return it.
   */
  async getOrSet<T>(key: string, factory: () => T | Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const namespaces: Record<string, number> = {};
    for (const key of this.store.keys()) {
      const ns = key.split(':')[0] || 'default';
      namespaces[ns] = (namespaces[ns] || 0) + 1;
    }

    const total = this.totalHits + this.totalMisses;
    return {
      size: this.store.size,
      hitRate: total > 0 ? parseFloat(((this.totalHits / total) * 100).toFixed(1)) : 0,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      evictions: this.evictions,
      namespaces,
    };
  }

  /**
   * Evict all expired entries.
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        this.evictions++;
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Pre-configured Cache Instances
// -----------------------------------------------------------------------------

/** General-purpose API response cache (5-minute TTL) */
export const apiCache = new MemoryCache();

/** BI report cache (10-minute TTL — expensive to compute) */
export const biCache = new MemoryCache();

/** Analytics data cache (2-minute TTL) */
export const analyticsCache = new MemoryCache();

/** Template cache (1-hour TTL — rarely changes) */
export const templateCache = new MemoryCache();

/** Validation result cache (5-minute TTL) */
export const validationCache = new MemoryCache();

// Auto-cleanup every 10 minutes
setInterval(() => {
  apiCache.clear();
  biCache.clear();
  analyticsCache.clear();
  validationCache.clear();
}, 10 * 60_000);

// Template cache clears less frequently (every hour)
setInterval(() => {
  templateCache.clear();
}, 60 * 60_000);

// -----------------------------------------------------------------------------
// Cache Key Helpers
// -----------------------------------------------------------------------------

/**
 * Generate a cache key for storefront-related data.
 */
export function storefrontKey(storefrontId: string, suffix: string): string {
  return `sf:${storefrontId}:${suffix}`;
}

/**
 * Generate a cache key for BI/analytics data.
 */
export function analyticsKey(storefrontId: string, days: number): string {
  return `analytics:${storefrontId}:${days}`;
}

/**
 * Generate a cache key for a pipeline execution.
 */
export function pipelineKey(executionId: string): string {
  return `pipeline:${executionId}`;
}

/**
 * Generate a cache key for chat/conversation data.
 */
export function chatKey(sessionId: string): string {
  return `chat:${sessionId}`;
}
