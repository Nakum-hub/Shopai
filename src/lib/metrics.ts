// =============================================================================
// Metrics Collection — In-process instrumentation for observability
// =============================================================================
// Provides Counter, Gauge, Histogram, and Timer primitives for tracking
// application performance, LLM usage, database queries, cache hits, errors,
// and active connections. No external dependencies required.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Label set for dimensional metrics (e.g., { method: 'GET', path: '/api' }) */
export type Labels = Record<string, string>;

/** A single metric entry as stored in the registry */
export interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  value: number;
  labels: Labels;
  /** Timestamp of last update */
  updatedAt: string;
  /** For histograms: array of recorded values */
  values?: number[];
}

/** Snapshot of all metrics for dashboard / health endpoint export */
export interface MetricsSnapshot {
  /** ISO timestamp of when the snapshot was taken */
  timestamp: string;
  /** Total number of tracked metrics */
  count: number;
  /** All metric entries */
  metrics: MetricEntry[];
  /** Pre-computed summary for common metrics */
  summary: Record<string, unknown>;
}

/** Result of stopping a timer */
export interface TimerResult {
  /** Duration in milliseconds */
  durationMs: number;
}

/** Histogram bucket statistics */
export interface HistogramStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

// -----------------------------------------------------------------------------
// Metric Key Generation
// -----------------------------------------------------------------------------

/**
 * Generate a composite key from metric name and labels.
 * Labels are sorted by key for consistent ordering.
 */
function metricKey(name: string, labels: Labels): string {
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return labelStr ? `${name}{${labelStr}}` : name;
}

// -----------------------------------------------------------------------------
// MetricsRegistry
// -----------------------------------------------------------------------------

/**
 * In-process metrics registry. Thread-safe for single-threaded Node.js.
 * Supports counter, gauge, histogram, and timer metric types.
 *
 * @example
 * ```ts
 * const metrics = MetricsRegistry.getInstance();
 * metrics.incrementCounter('api.requests.total', 1, { method: 'GET', status: '200' });
 * const timer = metrics.startTimer('db.query.duration', { operation: 'find' });
 * // ... do work ...
 * timer.stop(); // records the duration as a histogram
 * ```
 */
export class MetricsRegistry {
  private static instance: MetricsRegistry | undefined;
  private readonly entries = new Map<string, MetricEntry>();

  private constructor() {}

  /** Get the singleton registry instance */
  static getInstance(): MetricsRegistry {
    if (!MetricsRegistry.instance) {
      MetricsRegistry.instance = new MetricsRegistry();
    }
    return MetricsRegistry.instance;
  }

  // -------------------------------------------------------------------------
  // Counter
  // -------------------------------------------------------------------------

  /**
   * Increment a counter metric by a given value.
   * Creates the counter if it doesn't exist.
   */
  incrementCounter(name: string, value: number = 1, labels: Labels = {}): void {
    const key = metricKey(name, labels);
    const existing = this.entries.get(key);
    this.entries.set(key, {
      name,
      type: 'counter',
      value: (existing?.value ?? 0) + value,
      labels,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Decrement a counter metric. Creates with negative value if needed.
   * Note: Counters typically only increment. Use gauge for decrements.
   */
  decrementCounter(name: string, value: number = 1, labels: Labels = {}): void {
    this.incrementCounter(name, -value, labels);
  }

  // -------------------------------------------------------------------------
  // Gauge
  // -------------------------------------------------------------------------

  /**
   * Set a gauge metric to an absolute value.
   * Gauges represent a point-in-time value (e.g., active connections).
   */
  setGauge(name: string, value: number, labels: Labels = {}): void {
    const key = metricKey(name, labels);
    this.entries.set(key, {
      name,
      type: 'gauge',
      value,
      labels,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Increment a gauge by a value (can be negative).
   */
  incrementGauge(name: string, value: number = 1, labels: Labels = {}): void {
    const key = metricKey(name, labels);
    const existing = this.entries.get(key);
    this.entries.set(key, {
      name,
      type: 'gauge',
      value: (existing?.value ?? 0) + value,
      labels,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Decrement a gauge by a value.
   */
  decrementGauge(name: string, value: number = 1, labels: Labels = {}): void {
    this.incrementGauge(name, -value, labels);
  }

  // -------------------------------------------------------------------------
  // Histogram
  // -------------------------------------------------------------------------

  /**
   * Record a value in a histogram. Tracks the distribution of values.
   */
  recordHistogram(name: string, value: number, labels: Labels = {}): void {
    const key = metricKey(name, labels);
    const existing = this.entries.get(key);
    const values = existing?.values ? [...existing.values, value] : [value];

    this.entries.set(key, {
      name,
      type: 'histogram',
      value, // latest value
      labels,
      updatedAt: new Date().toISOString(),
      values,
    });
  }

  /**
   * Get computed statistics for a histogram metric.
   * @returns Statistics or null if metric doesn't exist or has no values
   */
  getHistogramStats(name: string, labels: Labels = {}): HistogramStats | null {
    const key = metricKey(name, labels);
    const entry = this.entries.get(key);
    if (!entry || entry.type !== 'histogram' || !entry.values || entry.values.length === 0) {
      return null;
    }

    const sorted = [...entry.values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: Math.round((sum / count) * 100) / 100,
      p50: percentile(sorted, 0.50),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
    };
  }

  // -------------------------------------------------------------------------
  // Timer
  // -------------------------------------------------------------------------

  /**
   * Start a timer. Calling `stop()` on the returned object records the
   * elapsed duration as a histogram value.
   *
   * @returns Object with a `stop()` method
   */
  startTimer(name: string, labels: Labels = {}): { stop: () => TimerResult } {
    const start = performance.now();
    return {
      stop: (): TimerResult => {
        const durationMs = Math.round((performance.now() - start) * 100) / 100;
        this.recordHistogram(name, durationMs, labels);
        return { durationMs };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /** Get the current value of a metric by name (optionally filtered by labels) */
  getMetric(name: string, labels?: Labels): number | null {
    if (labels) {
      const key = metricKey(name, labels);
      return this.entries.get(key)?.value ?? null;
    }
    // Sum all values for this metric name across all label combinations
    let total = 0;
    let found = false;
    for (const entry of this.entries.values()) {
      if (entry.name === name) {
        total += entry.value;
        found = true;
      }
    }
    return found ? total : null;
  }

  /** Get all entries for a given metric name */
  getMetricEntries(name: string): MetricEntry[] {
    return Array.from(this.entries.values()).filter((e) => e.name === name);
  }

  /** Get a full snapshot of all metrics */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: new Date().toISOString(),
      count: this.entries.size,
      metrics: Array.from(this.entries.values()),
      summary: this.buildSummary(),
    };
  }

  /** Get all metric names currently tracked */
  getNames(): string[] {
    const names = new Set<string>();
    for (const entry of this.entries.values()) {
      names.add(entry.name);
    }
    return Array.from(names);
  }

  /** Reset all metrics (useful for testing) */
  reset(): void {
    this.entries.clear();
  }

  /** Get total number of stored entries */
  get size(): number {
    return this.entries.size;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /** Build a pre-computed summary of key metrics */
  private buildSummary(): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    // API request metrics
    const apiRequests = this.getMetricEntries('api.requests.total');
    if (apiRequests.length > 0) {
      const total = apiRequests.reduce((s, e) => s + e.value, 0);
      const errors = apiRequests
        .filter((e) => e.labels.status && e.labels.status.startsWith('5'))
        .reduce((s, e) => s + e.value, 0);
      summary['api.total'] = total;
      summary['api.errorRate'] = total > 0 ? Math.round((errors / total) * 100) / 100 : 0;
    }

    // LLM request metrics
    const llmRequests = this.getMetricEntries('llm.requests.total');
    if (llmRequests.length > 0) {
      summary['llm.total'] = llmRequests.reduce((s, e) => s + e.value, 0);
    }

    // LLM token metrics
    const inputTokens = this.getMetric('llm.tokens.total', { type: 'input' });
    const outputTokens = this.getMetric('llm.tokens.total', { type: 'output' });
    if (inputTokens !== null || outputTokens !== null) {
      summary['llm.inputTokens'] = inputTokens ?? 0;
      summary['llm.outputTokens'] = outputTokens ?? 0;
    }

    // Cache metrics
    const cacheHits = this.getMetric('cache.hits');
    const cacheMisses = this.getMetric('cache.misses');
    if (cacheHits !== null || cacheMisses !== null) {
      const total = (cacheHits ?? 0) + (cacheMisses ?? 0);
      summary['cache.hitRate'] = total > 0 ? Math.round(((cacheHits ?? 0) / total) * 100) / 100 : 0;
      summary['cache.hits'] = cacheHits ?? 0;
      summary['cache.misses'] = cacheMisses ?? 0;
    }

    // Error metrics
    const totalErrors = this.getMetric('errors.total');
    if (totalErrors !== null) {
      summary['errors.total'] = totalErrors;
    }

    // DB query metrics
    const dbQueries = this.getMetricEntries('db.queries.total');
    if (dbQueries.length > 0) {
      summary['db.totalQueries'] = dbQueries.reduce((s, e) => s + e.value, 0);
    }

    return summary;
  }
}

// -----------------------------------------------------------------------------
// Utility: Percentile calculation
// -----------------------------------------------------------------------------

/**
 * Calculate the value at a given percentile from a sorted array.
 * Uses linear interpolation for non-integer indices.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  return Math.round((sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower])) * 100) / 100;
}

// -----------------------------------------------------------------------------
// Singleton & Pre-built Metric Names
// -----------------------------------------------------------------------------

/** The singleton metrics registry instance */
export const metrics = MetricsRegistry.getInstance();

// Pre-built metric names for consistent usage across the application
export const METRIC_NAMES = {
  // API
  API_REQUESTS_TOTAL: 'api.requests.total',
  API_REQUEST_DURATION: 'api.request.duration',
  // LLM
  LLM_REQUESTS_TOTAL: 'llm.requests.total',
  LLM_REQUEST_DURATION: 'llm.request.duration',
  LLM_TOKENS_TOTAL: 'llm.tokens.total',
  // Database
  DB_QUERIES_TOTAL: 'db.queries.total',
  DB_QUERY_DURATION: 'db.query.duration',
  // Cache
  CACHE_HITS: 'cache.hits',
  CACHE_MISSES: 'cache.misses',
  // Errors
  ERRORS_TOTAL: 'errors.total',
  // Connections
  ACTIVE_CONNECTIONS: 'active.connections',
  // Queue
  QUEUE_JOBS_TOTAL: 'queue.jobs.total',
} as const;

// -----------------------------------------------------------------------------
// Convenience Helpers
// -----------------------------------------------------------------------------

/**
 * Record an API request metric with method, path, and status code.
 */
export function recordApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs?: number
): void {
  const statusStr = String(statusCode);
  metrics.incrementCounter(METRIC_NAMES.API_REQUESTS_TOTAL, 1, { method, path, status: statusStr });
  if (durationMs !== undefined) {
    metrics.recordHistogram(METRIC_NAMES.API_REQUEST_DURATION, durationMs, { path });
  }
  if (statusCode >= 400) {
    metrics.incrementCounter(METRIC_NAMES.ERRORS_TOTAL, 1, { code: statusStr, type: 'api' });
  }
}

/**
 * Record an LLM request metric with type (chat/asr/tts) and optional token counts.
 */
export function recordLlmRequest(
  type: 'chat' | 'asr' | 'tts',
  durationMs?: number,
  inputTokens?: number,
  outputTokens?: number
): void {
  metrics.incrementCounter(METRIC_NAMES.LLM_REQUESTS_TOTAL, 1, { type });
  if (durationMs !== undefined) {
    metrics.recordHistogram(METRIC_NAMES.LLM_REQUEST_DURATION, durationMs);
  }
  if (inputTokens !== undefined) {
    metrics.incrementCounter(METRIC_NAMES.LLM_TOKENS_TOTAL, inputTokens, { type: 'input' });
  }
  if (outputTokens !== undefined) {
    metrics.incrementCounter(METRIC_NAMES.LLM_TOKENS_TOTAL, outputTokens, { type: 'output' });
  }
}

/**
 * Record a database query metric.
 */
export function recordDbQuery(operation: string, durationMs?: number): void {
  metrics.incrementCounter(METRIC_NAMES.DB_QUERIES_TOTAL, 1, { operation });
  if (durationMs !== undefined) {
    metrics.recordHistogram(METRIC_NAMES.DB_QUERY_DURATION, durationMs);
  }
}

/**
 * Record a cache hit or miss.
 */
export function recordCacheHit(hit: boolean): void {
  if (hit) {
    metrics.incrementCounter(METRIC_NAMES.CACHE_HITS);
  } else {
    metrics.incrementCounter(METRIC_NAMES.CACHE_MISSES);
  }
}

/**
 * Get a formatted metrics summary for health endpoints.
 */
export function getMetricsSummary(): Record<string, unknown> {
  const snapshot = metrics.getSnapshot();
  return {
    timestamp: snapshot.timestamp,
    totalMetrics: snapshot.count,
    ...snapshot.summary,
  };
}

/**
 * Reset all metrics (for testing only).
 */
export function resetMetrics(): void {
  metrics.reset();
}
