// =============================================================================
// Observability Dashboard — System-wide aggregation of metrics, health & errors
// =============================================================================
// Provides a single entry point for dashboard data, error tracking with
// deduplication, and a performance profiler for slow operation detection.
// =============================================================================

import { circuitRegistry, type CircuitBreakerStatus } from '@/lib/circuit-breaker';
import { metrics, type MetricsSnapshot } from '@/lib/metrics';
import { healthRegistry, type SystemHealthSummary, type ServiceStatus } from '@/lib/service-health';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Overall system status level */
export type OverallStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Aggregated system overview for dashboard display */
export interface SystemOverview {
  /** Overall system status */
  status: OverallStatus;
  /** Application uptime in seconds */
  uptime: number;
  /** Application version string */
  version: string;
  /** Runtime environment (production/development) */
  environment: string;
  /** Status of all tracked services */
  services: ServiceStatus[];
  /** Current metrics snapshot */
  metrics: MetricsSnapshot;
  /** Status of all circuit breakers */
  circuitBreakers: CircuitBreakerStatus[];
  /** Most recent errors */
  recentErrors: ErrorEntry[];
  /** Aggregate request statistics */
  requestStats: RequestStats;
}

/** A tracked error entry with deduplication info */
export interface ErrorEntry {
  /** Unique error fingerprint (based on message + code) */
  fingerprint: string;
  /** Error message */
  message: string;
  /** Error code or type */
  code: string;
  /** Number of times this error has occurred */
  count: number;
  /** ISO timestamp of first occurrence */
  firstSeen: string;
  /** ISO timestamp of last occurrence */
  lastSeen: string;
  /** Optional context data */
  context?: Record<string, unknown>;
}

/** Aggregate request statistics */
export interface RequestStats {
  /** Total API requests since startup */
  total: number;
  /** Average request latency in milliseconds */
  avgLatency: number;
  /** Error rate as a decimal (0.0 - 1.0) */
  errorRate: number;
  /** 95th percentile latency in milliseconds */
  p95: number;
  /** 99th percentile latency in milliseconds */
  p99: number;
}

/** A recorded slow operation */
export interface SlowOperation {
  /** Operation name */
  name: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** ISO timestamp when recorded */
  timestamp: string;
}

// -----------------------------------------------------------------------------
// Error Tracker
// -----------------------------------------------------------------------------

/**
 * Tracks recent errors with deduplication based on error message fingerprinting.
 * Prevents flooding the dashboard with duplicate error entries.
 */
export class ErrorTracker {
  private static instance: ErrorTracker | undefined;
  private readonly errors = new Map<string, ErrorEntry>();
  private readonly maxEntries: number;

  private constructor(maxEntries: number = 200) {
    this.maxEntries = maxEntries;
  }

  /** Get the singleton error tracker */
  static getInstance(maxEntries?: number): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker(maxEntries);
    }
    return ErrorTracker.instance;
  }

  /**
   * Track an error occurrence. Deduplicates based on message + code.
   *
   * @param error - The error to track (Error instance or unknown)
   * @param context - Optional additional context for debugging
   */
  track(error: unknown, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof Error ? (error.constructor.name || 'Error') : 'UnknownError';

    // Generate a simple fingerprint from message + code
    const fingerprint = generateFingerprint(message, code);
    const now = new Date().toISOString();

    const existing = this.errors.get(fingerprint);
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      existing.context = context || existing.context;
    } else {
      // Evict oldest entries if at capacity
      if (this.errors.size >= this.maxEntries) {
        const oldestKey = this.errors.keys().next().value;
        if (oldestKey) this.errors.delete(oldestKey);
      }

      this.errors.set(fingerprint, {
        fingerprint,
        message: truncate(message, 500),
        code,
        count: 1,
        firstSeen: now,
        lastSeen: now,
        context,
      });
    }
  }

  /**
   * Get recent error entries, optionally filtered by code/type.
   *
   * @param count - Maximum number of entries to return (default: 20)
   * @param filter - Optional filter function
   */
  getRecent(count: number = 20, filter?: (entry: ErrorEntry) => boolean): ErrorEntry[] {
    let entries = Array.from(this.errors.values()).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );

    if (filter) {
      entries = entries.filter(filter);
    }

    return entries.slice(0, count);
  }

  /**
   * Get error frequency counts grouped by error code.
   * @returns Map of error code → total occurrence count
   */
  getErrorFrequency(): Map<string, number> {
    const freq = new Map<string, number>();
    for (const entry of this.errors.values()) {
      freq.set(entry.code, (freq.get(entry.code) || 0) + entry.count);
    }
    return freq;
  }

  /** Get total number of tracked unique errors */
  get size(): number {
    return this.errors.size;
  }

  /** Clear all tracked errors (for testing) */
  reset(): void {
    this.errors.clear();
  }
}

// -----------------------------------------------------------------------------
// Performance Profiler
// -----------------------------------------------------------------------------

/**
 * Profiles function execution times and tracks slow operations.
 * Useful for identifying performance bottlenecks.
 */
export class PerformanceProfiler {
  private static instance: PerformanceProfiler | undefined;
  private readonly operations: SlowOperation[] = [];
  private readonly maxEntries: number;
  private thresholdMs: number;

  private constructor(maxEntries: number = 500, thresholdMs: number = 1000) {
    this.maxEntries = maxEntries;
    this.thresholdMs = thresholdMs;
  }

  /** Get the singleton performance profiler */
  static getInstance(maxEntries?: number, thresholdMs?: number): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler(maxEntries, thresholdMs);
    }
    return PerformanceProfiler.instance;
  }

  /**
   * Profile a function's execution and record it.
   * Automatically records slow operations (above threshold).
   *
   * @param name - Operation name for identification
   * @param fn - The async function to profile
   * @returns Result and duration
   */
  async profile<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
    const start = performance.now();
    const result = await fn();
    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    this.recordOperation(name, durationMs);
    return { result, durationMs };
  }

  /**
   * Get all operations slower than a given threshold, sorted by duration descending.
   *
   * @param thresholdMs - Minimum duration to include (default: uses profiler default)
   */
  getSlowOperations(thresholdMs?: number): SlowOperation[] {
    const threshold = thresholdMs ?? this.thresholdMs;
    return this.operations
      .filter((op) => op.durationMs >= threshold)
      .sort((a, b) => b.durationMs - a.durationMs);
  }

  /** Set the slow operation threshold */
  setThreshold(ms: number): void {
    this.thresholdMs = ms;
  }

  /** Get all recorded operations */
  getAllOperations(): SlowOperation[] {
    return [...this.operations];
  }

  /** Get total number of recorded operations */
  get size(): number {
    return this.operations.length;
  }

  /** Clear all recorded operations (for testing) */
  reset(): void {
    this.operations.length = 0;
  }

  /** Record an operation internally */
  private recordOperation(name: string, durationMs: number): void {
    // Evict oldest if at capacity
    if (this.operations.length >= this.maxEntries) {
      this.operations.shift();
    }

    this.operations.push({
      name: name.length,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }
}

// -----------------------------------------------------------------------------
// Observability Dashboard — Main Aggregator
// -----------------------------------------------------------------------------

/**
 * Aggregates all observability data into a single system overview.
 * Combines service health, metrics, circuit breaker status, errors, and profiling.
 */
export class ObservabilityDashboard {
  private static instance: ObservabilityDashboard | undefined;

  private constructor() {}

  /** Get the singleton dashboard */
  static getInstance(): ObservabilityDashboard {
    if (!ObservabilityDashboard.instance) {
      ObservabilityDashboard.instance = new ObservabilityDashboard();
    }
    return ObservabilityDashboard.instance;
  }

  /**
   * Get a complete system overview for the observability dashboard.
   * This is the primary method consumed by dashboard UI / health endpoints.
   */
  async getSystemOverview(): Promise<SystemOverview> {
    // Gather data in parallel for performance
    const [healthSummary, metricsSnapshot, circuitStatuses, recentErrors, slowOps] =
      await Promise.all([
        healthRegistry.getSystemSummary(),
        Promise.resolve(metrics.getSnapshot()),
        Promise.resolve(circuitRegistry.getAllStatus()),
        Promise.resolve(ErrorTracker.getInstance().getRecent(20)),
        Promise.resolve(PerformanceProfiler.getInstance().getSlowOperations()),
      ]);

    // Determine overall status
    const status = computeOverallStatus(
      healthSummary.overall,
      circuitStatuses,
      recentErrors
    );

    // Compute request statistics
    const requestStats = computeRequestStats(metricsSnapshot);

    return {
      status,
      uptime: healthSummary.uptime,
      version: healthSummary.version,
      environment: process.env.NODE_ENV || 'development',
      services: healthSummary.services,
      metrics: metricsSnapshot,
      circuitBreakers: circuitStatuses,
      recentErrors,
      requestStats,
    };
  }
}

// -----------------------------------------------------------------------------
// Singleton Instances
// -----------------------------------------------------------------------------

/** Global error tracker instance */
export const errorTracker = ErrorTracker.getInstance();

/** Global performance profiler instance */
export const performanceProfiler = PerformanceProfiler.getInstance();

/** Global observability dashboard instance */
export const observabilityDashboard = ObservabilityDashboard.getInstance();

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Compute the overall system status from individual component statuses.
 */
function computeOverallStatus(
  healthStatus: string,
  circuits: CircuitBreakerStatus[],
  errors: ErrorEntry[]
): OverallStatus {
  // Any OPEN circuit breaker = degraded
  const hasOpenCircuit = circuits.some((c) => c.state === 'OPEN');

  // Recent error burst detection
  const recentErrorCount = errors.filter((e) => {
    const since = Date.now() - 5 * 60 * 1000; // 5 minutes
    return new Date(e.lastSeen).getTime() > since;
  }).reduce((sum, e) => sum + e.count, 0);

  if (healthStatus === 'unhealthy' || recentErrorCount > 50) {
    return 'unhealthy';
  }
  if (healthStatus === 'degraded' || hasOpenCircuit || recentErrorCount > 10) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Compute request statistics from metrics snapshot.
 */
function computeRequestStats(snapshot: MetricsSnapshot): RequestStats {
  const apiEntries = snapshot.metrics.filter(
    (m) => m.name === 'api.requests.total' && m.type === 'counter'
  );

  const total = apiEntries.reduce((sum, e) => sum + e.value, 0);
  const errorCount = apiEntries
    .filter((e) => e.labels.status && Number(e.labels.status) >= 400)
    .reduce((sum, e) => sum + e.value, 0);

  // Get latency histogram stats
  const durationEntries = snapshot.metrics.filter(
    (m) => m.name === 'api.request.duration' && m.type === 'histogram' && m.values
  );

  let avgLatency = 0;
  let p95 = 0;
  let p99 = 0;

  if (durationEntries.length > 0) {
    // Merge all duration values
    const allValues = durationEntries.flatMap((e) => e.values ?? []);
    if (allValues.length > 0) {
      const sorted = [...allValues].sort((a, b) => a - b);
      avgLatency = Math.round((allValues.reduce((s, v) => s + v, 0) / allValues.length) * 100) / 100;
      p95 = valueAtPercentile(sorted, 95);
      p99 = valueAtPercentile(sorted, 99);
    }
  }

  return {
    total,
    avgLatency,
    errorRate: total > 0 ? Math.round((errorCount / total) * 100) / 100 : 0,
    p95,
    p99,
  };
}

/**
 * Generate a simple fingerprint for error deduplication.
 */
function generateFingerprint(message: string, code: string): string {
  // Normalize: lowercase, trim, collapse whitespace
  const normalized = `${code}:${message}`.toLowerCase().trim().replace(/\s+/g, ' ');
  // Simple hash using built-in
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `${hash.toString(16)}-${normalized.slice(0, 100)}`;
}

/**
 * Get value at a given percentile from a sorted array.
 */
function valueAtPercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

/**
 * Truncate a string to a maximum length.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
