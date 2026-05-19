// =============================================================================
// In-Memory Rate Limiter (per-session, sliding window)
// =============================================================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_REQUESTS = 30; // requests per window
const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const REFILL_RATE = DEFAULT_MAX_REQUESTS / DEFAULT_WINDOW_MS; // tokens per ms

/**
 * Check if a request is allowed under the rate limit.
 * Uses a token bucket algorithm for smooth throttling.
 */
export function rateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();

  let entry = store.get(key);

  if (!entry) {
    // First request: grant full bucket
    entry = { tokens: maxRequests, lastRefill: now };
    store.set(key, entry);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refill = (elapsed / windowMs) * maxRequests;
  entry.tokens = Math.min(maxRequests, entry.tokens + refill);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return { allowed: true, remaining: Math.floor(entry.tokens), retryAfterMs: 0 };
  }

  // Calculate when the next token will be available
  const retryAfterMs = Math.ceil((1 - entry.tokens) / (maxRequests / windowMs));
  return { allowed: false, remaining: 0, retryAfterMs };
}

/**
 * Cleanup stale entries to prevent memory leaks.
 * Call periodically (e.g., every 5 minutes).
 */
export function cleanupRateLimits(maxAgeMs: number = 5 * 60_000): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > maxAgeMs) {
      store.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => cleanupRateLimits(), 5 * 60_000);
