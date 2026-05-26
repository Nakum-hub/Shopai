// =============================================================================
// Circuit Breaker — Resilience Pattern for External Dependencies
// =============================================================================
// Implements the Circuit Breaker pattern (Michael Nygard, 2007) to prevent
// cascading failures when external services become unresponsive.
//
// States:
//   CLOSED    — Normal operation. Requests pass through. Failure count tracked.
//   OPEN      — Failure threshold exceeded. Requests are rejected immediately.
//   HALF_OPEN — Timeout elapsed, testing recovery. Limited requests allowed.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Circuit breaker state machine */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Configuration for a circuit breaker instance */
export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit (default: 5) */
  failureThreshold: number;
  /** Number of consecutive successes in HALF_OPEN to close the circuit (default: 3) */
  successThreshold: number;
  /** Milliseconds to wait before transitioning OPEN → HALF_OPEN (default: 30000) */
  timeout: number;
  /** Maximum requests allowed in HALF_OPEN state (default: 3) */
  halfOpenMaxAttempts: number;
}

/** Metrics snapshot from a circuit breaker */
export interface CircuitBreakerMetrics {
  /** Total consecutive failures since last state reset */
  failures: number;
  /** Total consecutive successes in HALF_OPEN since opening */
  successes: number;
  /** ISO timestamp of last failure, or null */
  lastFailure: string | null;
  /** ISO timestamp of last success, or null */
  lastSuccess: string | null;
  /** Total number of state transitions since creation */
  stateChanges: number;
  /** Total requests executed through this circuit */
  totalRequests: number;
  /** Total requests rejected because circuit was OPEN */
  totalRejected: number;
}

/** Status snapshot for dashboard display */
export interface CircuitBreakerStatus {
  name: string;
  state: CircuitState;
  metrics: CircuitBreakerMetrics;
  config: CircuitBreakerConfig;
  /** ISO timestamp when the circuit opened (if currently OPEN) */
  openedAt: string | null;
  /** ISO timestamp when HALF_OPEN timeout expires (if currently OPEN) */
  halfOpenAvailableAt: string | null;
}

/** Error thrown when circuit is OPEN and request is rejected */
export class CircuitOpenError extends Error {
  public readonly circuitName: string;
  public readonly retryAfterMs: number;

  constructor(name: string, retryAfterMs: number) {
    super(`Circuit "${name}" is OPEN. Retry after ${retryAfterMs}ms.`);
    this.name = 'CircuitOpenError';
    this.circuitName = name;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Callback signature for state change events */
export type StateChangeCallback = (
  name: string,
  from: CircuitState,
  to: CircuitState
) => void;

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000,
  halfOpenMaxAttempts: 3,
};

// -----------------------------------------------------------------------------
// CircuitBreaker<T> Class
// -----------------------------------------------------------------------------

/**
 * Generic circuit breaker that wraps async functions with failure protection.
 *
 * @typeParam T - Return type of the protected function
 *
 * @example
 * ```ts
 * const breaker = new CircuitBreaker('llm', { failureThreshold: 5, timeout: 30000 });
 * const result = await breaker.execute(() => llm.chat(prompt));
 * ```
 */
export class CircuitBreaker<T = unknown> {
  private readonly name: string;
  private readonly config: CircuitBreakerConfig;

  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private halfOpenSuccesses = 0;
  private halfOpenAttempts = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private openedAt: number | null = null;
  private totalRequests = 0;
  private totalRejected = 0;
  private stateChangeCount = 0;
  private readonly listeners: StateChangeCallback[] = [];

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -------------------------------------------------------------------------
  // Core Execution
  // -------------------------------------------------------------------------

  /**
   * Execute a function through the circuit breaker.
   * If the circuit is OPEN, rejects immediately with CircuitOpenError.
   * If HALF_OPEN, allows limited attempts to test recovery.
   *
   * @param fn - Async function to execute
   * @returns Promise resolving to the function's return value
   * @throws {CircuitOpenError} If circuit is OPEN
   * @throws {Error} The original error if the function fails
   */
  async execute(fn: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === 'OPEN') {
      this.totalRejected++;
      const retryAfter = Math.max(
        0,
        (this.lastFailureTime ?? 0) + this.config.timeout - Date.now()
      );
      throw new CircuitOpenError(this.name, retryAfter);
    }

    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.totalRejected++;
        throw new CircuitOpenError(this.name, this.config.timeout);
      }
      this.halfOpenAttempts++;
    }

    this.totalRequests++;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // State Transitions
  // -------------------------------------------------------------------------

  /** Check if timeout has elapsed and transition OPEN → HALF_OPEN */
  private evaluateState(): void {
    if (
      this.state === 'OPEN' &&
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.config.timeout
    ) {
      this.transitionTo('HALF_OPEN');
    }
  }

  /** Record a successful execution */
  private onSuccess(): void {
    this.failures = 0;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo('CLOSED');
      }
    }
  }

  /** Record a failed execution */
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.lastSuccessTime = null;

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('OPEN');
    } else if (this.state === 'CLOSED') {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('OPEN');
      }
    }
  }

  /** Transition to a new state, resetting counters and notifying listeners */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    this.stateChangeCount++;

    // Reset counters on state change
    if (newState === 'CLOSED') {
      this.failures = 0;
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
      this.openedAt = null;
    } else if (newState === 'HALF_OPEN') {
      this.halfOpenSuccesses = 0;
      this.halfOpenAttempts = 0;
    } else if (newState === 'OPEN') {
      this.openedAt = Date.now();
    }

    // Notify listeners (defensive — errors in listeners should not break the circuit)
    for (const listener of this.listeners) {
      try {
        listener(this.name, oldState, newState);
      } catch {
        // Swallow listener errors
      }
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Get the current circuit state */
  getState(): CircuitState {
    this.evaluateState();
    return this.state;
  }

  /** Get current metrics snapshot */
  getMetrics(): CircuitBreakerMetrics {
    return {
      failures: this.failures,
      successes: this.halfOpenSuccesses,
      lastFailure: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastSuccess: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : null,
      stateChanges: this.stateChangeCount,
      totalRequests: this.totalRequests,
      totalRejected: this.totalRejected,
    };
  }

  /** Get full status for dashboard display */
  getStatus(): CircuitBreakerStatus {
    this.evaluateState();
    return {
      name: this.name,
      state: this.state,
      metrics: this.getMetrics(),
      config: { ...this.config },
      openedAt: this.openedAt ? new Date(this.openedAt).toISOString() : null,
      halfOpenAvailableAt:
        this.state === 'OPEN' && this.lastFailureTime
          ? new Date(this.lastFailureTime + this.config.timeout).toISOString()
          : null,
    };
  }

  /** Reset the circuit to CLOSED state, clearing all counters */
  reset(): void {
    this.transitionTo('CLOSED');
    this.failures = 0;
    this.halfOpenSuccesses = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.openedAt = null;
    this.totalRequests = 0;
    this.totalRejected = 0;
    this.stateChangeCount = 0;
  }

  /** Force the circuit into OPEN state (useful for testing / maintenance) */
  forceOpen(): void {
    this.lastFailureTime = Date.now();
    this.transitionTo('OPEN');
  }

  /** Force the circuit into CLOSED state (useful for testing / recovery) */
  forceClose(): void {
    this.transitionTo('CLOSED');
  }

  /**
   * Register a callback to be invoked on every state change.
   * Returns an unsubscribe function.
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }
}

// -----------------------------------------------------------------------------
// Pre-built Circuit Breakers
// -----------------------------------------------------------------------------

/** Circuit breaker for LLM API calls (z-ai-web-dev-sdk) — 5 failures, 30s timeout */
export const llmCircuit = new CircuitBreaker('llm', {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30_000,
  halfOpenMaxAttempts: 2,
});

/** Circuit breaker for database operations — 10 failures, 10s timeout */
export const dbCircuit = new CircuitBreaker('database', {
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 10_000,
  halfOpenMaxAttempts: 3,
});

/** Circuit breaker for Redis operations — 8 failures, 15s timeout */
export const redisCircuit = new CircuitBreaker('redis', {
  failureThreshold: 8,
  successThreshold: 3,
  timeout: 15_000,
  halfOpenMaxAttempts: 3,
});

/** Circuit breaker for any external API calls — 3 failures, 20s timeout */
export const externalApiCircuit = new CircuitBreaker('external-api', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 20_000,
  halfOpenMaxAttempts: 2,
});

// -----------------------------------------------------------------------------
// CircuitBreakerRegistry — Global tracking of all circuit breakers
// -----------------------------------------------------------------------------

/**
 * Registry that tracks all circuit breakers in the application.
 * Provides a single point to inspect the state of all resilience gates.
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry | undefined;
  private readonly breakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  /** Get the singleton registry instance */
  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Register a circuit breaker with the registry.
   * @returns The same breaker instance (for chaining)
   */
  register(breaker: CircuitBreaker): CircuitBreaker {
    this.breakers.set(breaker['name'], breaker);
    return breaker;
  }

  /** Get a registered circuit breaker by name */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /** Remove a circuit breaker from the registry */
  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  /** Get status of all registered circuit breakers */
  getAllStatus(): CircuitBreakerStatus[] {
    return Array.from(this.breakers.values()).map((b) => b.getStatus());
  }

  /** Get the names of all registered circuit breakers */
  getNames(): string[] {
    return Array.from(this.breakers.keys());
  }

  /** Check if any circuit breaker is OPEN */
  hasOpenCircuits(): boolean {
    return Array.from(this.breakers.values()).some(
      (b) => b.getState() === 'OPEN'
    );
  }

  /** Reset all registered circuit breakers */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /** Get count of registered circuit breakers */
  get size(): number {
    return this.breakers.size;
  }
}

// -----------------------------------------------------------------------------
// Auto-register pre-built breakers
// -----------------------------------------------------------------------------

const registry = CircuitBreakerRegistry.getInstance();
registry.register(llmCircuit);
registry.register(dbCircuit);
registry.register(redisCircuit);
registry.register(externalApiCircuit);

/** Convenience export for the global registry instance */
export const circuitRegistry = registry;
