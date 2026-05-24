---
Task ID: 2-b
Agent: Resilience & Observability Builder
Task: Build Resilience Layer + Metrics + Service Health (Audit #9 — UI-to-Core Imbalance)

Work Log:
- Created src/lib/circuit-breaker.ts (444 lines):
  - CircuitBreaker<T> class with CLOSED/OPEN/HALF_OPEN state machine
  - Configurable failureThreshold, successThreshold, timeout, halfOpenMaxAttempts
  - execute(fn) method: routes through state machine, rejects with CircuitOpenError when OPEN
  - getMetrics() returns failures, successes, lastFailure, lastSuccess, stateChanges, totalRequests, totalRejected
  - getStatus() full dashboard snapshot with openedAt and halfOpenAvailableAt timestamps
  - reset(), forceOpen(), forceClose() for testing and recovery
  - onStateChange(callback) with unsubscribe — defensive listener error swallowing
  - 4 pre-built circuits: llmCircuit (5/30s), dbCircuit (10/10s), redisCircuit (8/15s), externalApiCircuit (3/20s)
  - CircuitBreakerRegistry singleton: register, get, remove, getAllStatus, hasOpenCircuits, resetAll
  - Auto-registers all 4 pre-built breakers on module load

- Created src/lib/retry.ts (315 lines):
  - retry<T>(fn, options) with full RetryResult<T> return (value, attempts, totalDurationMs, retryHistory)
  - RetryOptions: maxAttempts, baseDelayMs, maxDelayMs, backoff strategy, jitter, retryOn predicate, onRetry callback
  - calculateDelay() supports exponential (2^n), linear (n*x), fixed strategies with ±25% jitter
  - retryWithCircuitBreaker<T>(fn, circuit, options) — circuit wraps the entire retry sequence
  - 3 pre-built configs: llmRetry (3/2s/exp, retries on timeouts/rate-limits/5xx), dbRetry (2/500ms/linear), externalApiRetry (3/1s/exp)
  - All callbacks defensively wrapped to prevent cascade failures

- Created src/lib/service-health.ts (482 lines):
  - HealthRegistry singleton with register(name, checker), checkAll(), check(name), getHistory()
  - ServiceStatus: name, status (healthy/degraded/unhealthy/unknown), latencyMs, lastChecked, details, uptime
  - SystemHealthSummary: overall status (worst-of-all), services[], uptime, version, memory (usedMb/totalMb/percentage), eventLoopLagMs
  - onStatusChange(callback) with unsubscribe for degradation alerts
  - Auto-check loop (30s interval, unref'd to not block process exit): startAutoCheck() / stopAutoCheck()
  - 4 built-in checkers: database (via dbHealthCheck), redis (via redisHealthCheck), queues (via queueHealthCheck), memory (heapUsed/heapTotal)
  - measureEventLoopLag() via setImmediate timing
  - Health history with configurable maxHistoryPerService (default: 100)

- Created src/lib/metrics.ts (490 lines):
  - MetricsRegistry singleton with counter, gauge, histogram, timer support
  - incrementCounter/setGauge/recordHistogram/startTimer with label-based dimensional metrics
  - metricKey() generates consistent composite keys from name + sorted labels
  - getHistogramStats() computes min, max, avg, p50, p95, p99 from recorded values
  - getSnapshot() returns all metrics with pre-computed summary (api totals, error rates, cache hit rates, token counts)
  - METRIC_NAMES constant: 12 pre-defined metric names for consistent usage
  - 5 convenience helpers: recordApiRequest, recordLlmRequest, recordDbQuery, recordCacheHit, resetMetrics
  - getMetricsSummary() formatted for health endpoints

- Created src/lib/observability.ts (454 lines):
  - ObservabilityDashboard singleton aggregating all subsystems into SystemOverview
  - SystemOverview: status, uptime, version, environment, services, metrics, circuitBreakers, recentErrors, requestStats
  - ErrorTracker: track(error, context) with deduplication via fingerprint hashing, getRecent(count, filter?), getErrorFrequency()
  - PerformanceProfiler: profile(name, fn) returns { result, durationMs }, getSlowOperations(thresholdMs) sorted desc
  - computeOverallStatus(): unhealthy if health=unhealthy or >50 errors/5min, degraded if health=degraded or open circuits or >10 errors
  - computeRequestStats(): total, avgLatency, errorRate, p95, p99 from metrics snapshot
  - Request stats merge latency values across all label combinations

- Verification: eslint 0 errors ✅, all 5 files fully JSDoc-documented ✅

Stage Summary:
- 5 new files, 2,185 lines of production TypeScript
- Circuit Breaker: 4 pre-built breakers (LLM, DB, Redis, external API) with registry and state machine
- Retry: 3 strategies (exponential/linear/fixed), jitter, custom retry predicates, combined with circuit breaker
- Service Health: 4 built-in checkers (DB, Redis, queues, memory), auto-check loop, status change alerts, history tracking
- Metrics: Counter/Gauge/Histogram/Timer with dimensional labels, pre-computed summaries, 5 convenience helpers
- Observability: Dashboard aggregator, error tracker with deduplication, performance profiler for slow operation detection
- Zero ESLint errors, fully JSDoc-documented, defensive design throughout
