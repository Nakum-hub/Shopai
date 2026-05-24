// =============================================================================
// Service Health Checker — Comprehensive dependency monitoring
// =============================================================================
// Monitors all external dependencies (database, Redis, queues, LLM, system)
// with periodic auto-checking, status history, and degradation alerts.
// =============================================================================

import { dbHealthCheck } from '@/lib/db';
import { redisHealthCheck } from '@/lib/redis';
import { queueHealthCheck } from '@/lib/queue';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Health status levels */
export type ServiceStatusLevel = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/** Status of a single service dependency */
export interface ServiceStatus {
  /** Service name / identifier */
  name: string;
  /** Current health level */
  status: ServiceStatusLevel;
  /** Round-trip latency of the last health check in milliseconds */
  latencyMs: number;
  /** ISO timestamp of the last check */
  lastChecked: string;
  /** Additional details (varies by service type) */
  details: Record<string, unknown>;
  /** How long the service has been continuously healthy (seconds), or null */
  uptime: number | null;
}

/** Configuration for the health checker */
export interface HealthCheckerConfig {
  /** Auto-check interval in milliseconds (default: 30000 = 30s) */
  checkIntervalMs: number;
  /** Maximum history entries to keep per service (default: 100) */
  maxHistoryPerService: number;
}

/** Full system health summary for dashboard */
export interface SystemHealthSummary {
  /** Overall system status (worst among all services) */
  overall: ServiceStatusLevel;
  /** Individual service statuses */
  services: ServiceStatus[];
  /** Application uptime in seconds */
  uptime: number;
  /** Application version (from package.json or env) */
  version: string;
  /** Memory usage information */
  memory: {
    usedMb: number;
    totalMb: number;
    percentage: number;
  };
  /** Node.js event loop lag in milliseconds */
  eventLoopLagMs: number;
}

/** Callback for status change alerts */
export type StatusChangeCallback = (
  name: string,
  previousStatus: ServiceStatusLevel,
  newStatus: ServiceStatusLevel
) => void;

/** A health check function that returns a ServiceStatus */
export type HealthCheckFn = () => Promise<ServiceStatus>;

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: HealthCheckerConfig = {
  checkIntervalMs: 30_000,
  maxHistoryPerService: 100,
};

// -----------------------------------------------------------------------------
// HealthRegistry
// -----------------------------------------------------------------------------

/**
 * Central registry for service health checks.
 * Auto-checks all registered dependencies on a configurable interval
 * and maintains history for trend analysis.
 */
export class HealthRegistry {
  private static instance: HealthRegistry | undefined;
  private readonly checkers = new Map<string, HealthCheckFn>();
  private readonly statusMap = new Map<string, ServiceStatus>();
  private readonly historyMap = new Map<string, ServiceStatus[]>();
  private readonly listeners: StatusChangeCallback[] = [];
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private readonly startTime = Date.now();
  private lastEventLoopLag = 0;
  private config: HealthCheckerConfig;

  private constructor(config?: Partial<HealthCheckerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Get or create the singleton HealthRegistry instance */
  static getInstance(config?: Partial<HealthCheckerConfig>): HealthRegistry {
    if (!HealthRegistry.instance) {
      HealthRegistry.instance = new HealthRegistry(config);
    }
    return HealthRegistry.instance;
  }

  // -------------------------------------------------------------------------
  // Registration
  // -------------------------------------------------------------------------

  /**
   * Register a service health checker.
   * @param name - Unique service identifier
   * @param checker - Async function that returns the service's status
   */
  register(name: string, checker: HealthCheckFn): void {
    this.checkers.set(name, checker);
    // Initialize with unknown status
    if (!this.statusMap.has(name)) {
      this.statusMap.set(name, {
        name,
        status: 'unknown',
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
        details: {},
        uptime: null,
      });
    }
  }

  /** Remove a registered service checker */
  unregister(name: string): void {
    this.checkers.delete(name);
    this.statusMap.delete(name);
    this.historyMap.delete(name);
  }

  // -------------------------------------------------------------------------
  // Checking
  // -------------------------------------------------------------------------

  /**
   * Check all registered services and return individual statuses.
   * Updates internal state and triggers alerts on status changes.
   */
  async checkAll(): Promise<ServiceStatus[]> {
    const results: ServiceStatus[] = [];

    for (const [name, checker] of this.checkers) {
      try {
        const status = await checker();
        this.updateStatus(name, status);
        results.push(status);
      } catch (error) {
        // If the checker itself throws, mark as unhealthy
        const fallbackStatus: ServiceStatus = {
          name,
          status: 'unhealthy',
          latencyMs: 0,
          lastChecked: new Date().toISOString(),
          details: { error: error instanceof Error ? error.message : String(error) },
          uptime: null,
        };
        this.updateStatus(name, fallbackStatus);
        results.push(fallbackStatus);
      }
    }

    // Check event loop lag
    this.lastEventLoopLag = await measureEventLoopLag();

    return results;
  }

  /**
   * Check a single service by name.
   * @returns The service status, or null if not registered
   */
  async check(name: string): Promise<ServiceStatus | null> {
    const checker = this.checkers.get(name);
    if (!checker) return null;

    try {
      const status = await checker();
      this.updateStatus(name, status);
      return status;
    } catch (error) {
      const fallbackStatus: ServiceStatus = {
        name,
        status: 'unhealthy',
        latencyMs: 0,
        lastChecked: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
        uptime: null,
      };
      this.updateStatus(name, fallbackStatus);
      return fallbackStatus;
    }
  }

  // -------------------------------------------------------------------------
  // History & Alerts
  // -------------------------------------------------------------------------

  /** Get the last N health check results for a service */
  getHistory(name: string, count?: number): ServiceStatus[] {
    const history = this.historyMap.get(name) || [];
    return count ? history.slice(-count) : history;
  }

  /**
   * Register a callback invoked when any service status changes.
   * @returns Unsubscribe function
   */
  onStatusChange(callback: StatusChangeCallback): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  // -------------------------------------------------------------------------
  // System Summary
  // -------------------------------------------------------------------------

  /** Get a comprehensive system health summary for dashboards */
  async getSystemSummary(): Promise<SystemHealthSummary> {
    const services = await this.checkAll();

    // Determine overall status (worst among all)
    const overall = worstStatus(services.map((s) => s.status));

    // Memory info
    const mem = process.memoryUsage();
    const usedMb = Math.round(mem.heapUsed / (1024 * 1024));
    const totalMb = Math.round(mem.heapTotal / (1024 * 1024));
    const percentage = totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0;

    return {
      overall,
      services,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '0.2.0',
      memory: { usedMb, totalMb, percentage },
      eventLoopLagMs: this.lastEventLoopLag,
    };
  }

  // -------------------------------------------------------------------------
  // Auto-check Interval
  // -------------------------------------------------------------------------

  /** Start the periodic auto-check loop */
  startAutoCheck(): void {
    if (this.intervalHandle) return; // Already running
    this.intervalHandle = setInterval(async () => {
      try {
        await this.checkAll();
      } catch {
        // Auto-check errors are silently swallowed to prevent crashes
      }
    }, this.config.checkIntervalMs);

    // Don't prevent process exit
    if (this.intervalHandle && typeof this.intervalHandle.unref === 'function') {
      this.intervalHandle.unref();
    }
  }

  /** Stop the periodic auto-check loop */
  stopAutoCheck(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  /** Update stored status, track history, and fire alerts */
  private updateStatus(name: string, newStatus: ServiceStatus): void {
    const previous = this.statusMap.get(name);
    this.statusMap.set(name, newStatus);

    // Track history
    const history = this.historyMap.get(name) || [];
    history.push(newStatus);
    // Trim to max
    if (history.length > this.config.maxHistoryPerService) {
      history.splice(0, history.length - this.config.maxHistoryPerService);
    }
    this.historyMap.set(name, history);

    // Fire alert on status change
    if (previous && previous.status !== newStatus.status) {
      for (const listener of this.listeners) {
        try {
          listener(name, previous.status, newStatus.status);
        } catch {
          // Swallow listener errors
        }
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Built-in Health Checkers
// -----------------------------------------------------------------------------

/** Check PostgreSQL database health */
async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const result = await dbHealthCheck();
    return {
      name: 'database',
      status: result.status,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        version: result.version,
        poolSize: result.poolSize,
        activeConnections: result.activeConnections,
        maxConnections: result.maxConnections,
      },
      uptime: result.status === 'healthy' ? null : null,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: { error: error instanceof Error ? error.message : String(error) },
      uptime: null,
    };
  }
}

/** Check Redis health */
async function checkRedisService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const result = await redisHealthCheck();
    return {
      name: 'redis',
      status: result.status,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        version: result.version,
        memory: result.memory,
        keysCount: result.keysCount,
        connected: result.connected,
      },
      uptime: null,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: { error: error instanceof Error ? error.message : String(error) },
      uptime: null,
    };
  }
}

/** Check BullMQ queue health */
async function checkQueues(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const result = await queueHealthCheck();
    return {
      name: 'queues',
      status: result.status,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: {
        queues: result.queues.map((q) => ({
          name: q.name,
          active: q.active,
          waiting: q.waiting,
          failed: q.failed,
          delayed: q.delayed,
        })),
      },
      uptime: null,
    };
  } catch (error) {
    return {
      name: 'queues',
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString(),
      details: { error: error instanceof Error ? error.message : String(error) },
      uptime: null,
    };
  }
}

/** Check memory usage */
function checkMemory(): ServiceStatus {
  const mem = process.memoryUsage();
  const usedMb = Math.round(mem.heapUsed / (1024 * 1024));
  const totalMb = Math.round(mem.heapTotal / (1024 * 1024));
  const rssMb = Math.round(mem.rss / (1024 * 1024));
  const percentage = totalMb > 0 ? Math.round((usedMb / totalMb) * 100) : 0;

  let status: ServiceStatusLevel = 'healthy';
  if (percentage > 90) status = 'unhealthy';
  else if (percentage > 75) status = 'degraded';

  return {
    name: 'memory',
    status,
    latencyMs: 0,
    lastChecked: new Date().toISOString(),
    details: {
      heapUsedMb: usedMb,
      heapTotalMb: totalMb,
      rssMb,
      percentage,
      arrayBuffersMb: Math.round(mem.arrayBuffers / (1024 * 1024)),
    },
    uptime: null,
  };
}

// -----------------------------------------------------------------------------
// Event Loop Lag Measurement
// -----------------------------------------------------------------------------

/**
 * Measure the Node.js event loop lag by scheduling a deferred callback.
 * Returns the lag in milliseconds. Higher values indicate event loop blocking.
 */
function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = Date.now();
    setImmediate(() => {
      resolve(Date.now() - start);
    });
  });
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Determine the worst status among an array */
function worstStatus(statuses: ServiceStatusLevel[]): ServiceStatusLevel {
  if (statuses.includes('unhealthy')) return 'unhealthy';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.includes('unknown')) return 'unknown';
  return 'healthy';
}

// -----------------------------------------------------------------------------
// Initialize & Export
// -----------------------------------------------------------------------------

/** The singleton health registry with all built-in services registered */
export const healthRegistry = HealthRegistry.getInstance();

// Register built-in service checkers
healthRegistry.register('database', checkDatabase);
healthRegistry.register('redis', checkRedisService);
healthRegistry.register('queues', checkQueues);
healthRegistry.register('memory', () => Promise.resolve(checkMemory()));
