// =============================================================================
// Retry with Backoff — Resilient async execution with configurable strategies
// =============================================================================
// Provides retry logic with exponential, linear, or fixed backoff strategies,
// optional jitter to avoid thundering herd, and integration with circuit breakers.
// =============================================================================

import { type CircuitBreaker } from '@/lib/circuit-breaker';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Supported backoff strategies */
export type BackoffStrategy = 'exponential' | 'linear' | 'fixed';

/** Configuration for retry behavior */
export interface RetryOptions {
  /** Maximum number of attempts including the first (default: 3) */
  maxAttempts: number;
  /** Base delay in milliseconds before first retry (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelayMs: number;
  /** Backoff strategy for calculating delays (default: 'exponential') */
  backoff: BackoffStrategy;
  /** Add random jitter to delays to avoid thundering herd (default: true) */
  jitter: boolean;
  /** Custom predicate to decide if an error should trigger retry */
  retryOn?: (error: unknown) => boolean;
  /** Callback invoked on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

/** Record of a single retry attempt for debugging */
export interface RetryAttemptRecord {
  attempt: number;
  delay: number;
  error: string;
  timestamp: string;
}

/** Result of a retry operation with full history */
export interface RetryResult<T> {
  /** Final result value */
  value: T;
  /** Total attempts used */
  attempts: number;
  /** Total time spent including delays */
  totalDurationMs: number;
  /** History of retry attempts (empty if first attempt succeeded) */
  retryHistory: RetryAttemptRecord[];
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  backoff: 'exponential',
  jitter: true,
};

// -----------------------------------------------------------------------------
// Delay Calculation
// -----------------------------------------------------------------------------

/**
 * Calculate the delay for a given retry attempt based on backoff strategy.
 *
 * - **exponential**: `baseDelay * 2^(attempt - 1)` — doubles each time
 * - **linear**: `baseDelay * attempt` — increases by a fixed amount
 * - **fixed**: `baseDelay` — same delay every time
 *
 * @param attempt - 1-based attempt number (first retry = 1)
 * @param options - Retry configuration
 * @returns Delay in milliseconds, capped at maxDelayMs
 */
export function calculateDelay(attempt: number, options: RetryOptions): number {
  let delay: number;

  switch (options.backoff) {
    case 'exponential':
      delay = options.baseDelayMs * Math.pow(2, attempt - 1);
      break;
    case 'linear':
      delay = options.baseDelayMs * attempt;
      break;
    case 'fixed':
      delay = options.baseDelayMs;
      break;
    default:
      delay = options.baseDelayMs;
  }

  // Cap at maximum
  delay = Math.min(delay, options.maxDelayMs);

  // Add jitter (±25% randomization) to prevent synchronized retries
  if (options.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
    delay = Math.max(0, Math.round(delay));
  }

  return delay;
}

// -----------------------------------------------------------------------------
// Retry Function
// -----------------------------------------------------------------------------

/**
 * Execute an async function with retry logic and configurable backoff.
 *
 * @typeParam T - Return type of the function
 * @param fn - The async function to execute. Receives the current attempt number (1-based).
 * @param options - Retry configuration (merged with defaults)
 * @returns Promise resolving to `RetryResult<T>` with the value and metadata
 * @throws The last error if all attempts are exhausted
 *
 * @example
 * ```ts
 * const result = await retry(() => fetch('/api/data').then(r => r.json()), {
 *   maxAttempts: 3,
 *   baseDelayMs: 2000,
 *   backoff: 'exponential',
 * });
 * console.log(result.value, result.attempts);
 * ```
 */
export async function retry<T>(
  fn: (attempt: number) => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<RetryResult<T>> {
  const config: RetryOptions = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  const retryHistory: RetryAttemptRecord[] = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const value = await fn(attempt);
      return {
        value,
        attempts: attempt,
        totalDurationMs: Date.now() - startTime,
        retryHistory,
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry this specific error
      if (config.retryOn && !config.retryOn(error)) {
        throw error;
      }

      // If this was the last attempt, don't wait
      if (attempt >= config.maxAttempts) {
        break;
      }

      // Calculate delay and record
      const delay = calculateDelay(attempt, config);
      retryHistory.push({
        attempt,
        delay,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      // Notify callback
      if (config.onRetry) {
        try {
          config.onRetry(attempt, error, delay);
        } catch {
          // Swallow callback errors
        }
      }

      // Wait before next attempt
      await sleep(delay);
    }
  }

  // All attempts exhausted
  throw lastError;
}

// -----------------------------------------------------------------------------
// Combined Retry + Circuit Breaker
// -----------------------------------------------------------------------------

/**
 * Execute a function with both retry logic and circuit breaker protection.
 * The circuit breaker wraps the entire retry sequence — if the circuit is OPEN,
 * no retries are attempted at all.
 *
 * @typeParam T - Return type of the function
 * @param fn - The async function to execute through both layers
 * @param circuitBreaker - The circuit breaker to wrap the execution with
 * @param options - Retry configuration
 * @returns Promise resolving to `RetryResult<T>`
 * @throws {CircuitOpenError} If the circuit is OPEN (no retry attempted)
 * @throws The last error if all retries exhausted
 *
 * @example
 * ```ts
 * const result = await retryWithCircuitBreaker(
 *   () => llm.generate(prompt),
 *   llmCircuit,
 *   { maxAttempts: 3, baseDelayMs: 2000 }
 * );
 * ```
 */
export async function retryWithCircuitBreaker<T>(
  fn: (attempt: number) => Promise<T>,
  circuitBreaker: CircuitBreaker<T>,
  options?: Partial<RetryOptions>
): Promise<RetryResult<T>> {
  return retry(
    (attempt) => circuitBreaker.execute(() => fn(attempt)),
    options
  );
}

// -----------------------------------------------------------------------------
// Pre-built Retry Configs
// -----------------------------------------------------------------------------

/** Retry config for LLM API calls — 3 attempts, 2s base, exponential backoff */
export const llmRetry: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 2000,
  maxDelayMs: 30_000,
  backoff: 'exponential',
  jitter: true,
  retryOn: (error: unknown) => {
    // Retry on network errors, timeouts, rate limits, and server errors
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('econnreset') ||
        msg.includes('rate limit') ||
        msg.includes('429') ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('overloaded')
      );
    }
    return true; // Retry unknown errors by default
  },
};

/** Retry config for database operations — 2 attempts, 500ms base, linear backoff */
export const dbRetry: Partial<RetryOptions> = {
  maxAttempts: 2,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  backoff: 'linear',
  jitter: true,
  retryOn: (error: unknown) => {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('connection') ||
        msg.includes('timeout') ||
        msg.includes('busy') ||
        msg.includes(' deadlock') ||
        msg.includes('econnrefused')
      );
    }
    return false;
  },
};

/** Retry config for external API calls — 3 attempts, 1s base, exponential backoff */
export const externalApiRetry: Partial<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15_000,
  backoff: 'exponential',
  jitter: true,
  retryOn: (error: unknown) => {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('timeout') ||
        msg.includes('econnrefused') ||
        msg.includes('econnreset') ||
        msg.includes('429') ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504')
      );
    }
    return true;
  },
};

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------

/** Promise-based sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
