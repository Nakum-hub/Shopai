// =============================================================================
// Audit Logger — Structured Audit Trail
// =============================================================================
// Provides structured audit logging with:
// 1. Typed event categories (AUTH, DATA, SECURITY, SYSTEM, AI)
// 2. Batch writes for performance (flush every 5s or 100 events)
// 3. Graceful degradation (memory buffer fallback if DB fails)
// 4. Real-time event bus emission for consumers
// 5. Convenience methods for common audit patterns
//
// Usage:
//   import { auditLogger } from '@/lib/audit-log';
//   auditLogger.log('storefront.create', 'storefront', storefrontId, { name });
//   auditLogger.logSecurity('warn', 'rate_limit_exceeded', { ip, endpoint });
// =============================================================================

import { getEventBus } from '@/lib/event-bus';
import {
  writeAuditLog,
  writeAuditLogBatch,
  type AuditLogInput,
} from '@/lib/audit-db';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Audit log levels */
export type AuditLevel = 'info' | 'warn' | 'critical';

/** Actor types that can perform actions */
export type ActorType = 'user' | 'system' | 'admin' | 'anonymous';

/** Options for log calls */
export interface AuditLogOptions {
  actorId?: string;
  actorType?: ActorType;
  level?: AuditLevel;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
}

/** Internal buffered audit event awaiting flush */
interface BufferedAuditEvent extends AuditLogInput {
  timestamp: number;
}

/** Configuration for the audit logger */
export interface AuditLoggerConfig {
  /** Maximum events to buffer before auto-flush (default: 100) */
  flushBatchSize: number;
  /** Maximum milliseconds between auto-flushes (default: 5000) */
  flushIntervalMs: number;
  /** Maximum in-memory buffer size before dropping oldest (default: 10000) */
  maxBufferSize: number;
  /** Whether to emit events to the event bus (default: true) */
  emitToEventBus: boolean;
}

// -----------------------------------------------------------------------------
// Default Configuration
// -----------------------------------------------------------------------------

const DEFAULT_CONFIG: AuditLoggerConfig = {
  flushBatchSize: 100,
  flushIntervalMs: 5000,
  maxBufferSize: 10000,
  emitToEventBus: true,
};

// -----------------------------------------------------------------------------
// Pre-defined Event Types
// -----------------------------------------------------------------------------

/** AUTH category events */
export const AUTH_EVENTS = {
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  TOKEN_REFRESH: 'auth.token_refresh',
  TOKEN_REVOKE: 'auth.token_revoke',
} as const;

/** DATA category events (per resource) */
export const DATA_EVENTS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

/** SECURITY category events */
export const SECURITY_EVENTS = {
  RATE_LIMIT_EXCEEDED: 'security.rate_limit_exceeded',
  SUSPICIOUS_INPUT: 'security.suspicious_input',
  BLOCKED_REQUEST: 'security.blocked_request',
  CSRF_FAILURE: 'security.csrf_failure',
} as const;

/** SYSTEM category events */
export const SYSTEM_EVENTS = {
  CONFIG_CHANGE: 'system.config_change',
  DEPLOYMENT: 'system.deployment',
  HEALTH_ALERT: 'system.health_alert',
  SERVICE_STATUS_CHANGE: 'system.service_status_change',
} as const;

/** AI category events */
export const AI_EVENTS = {
  GENERATION_STARTED: 'ai.generation_started',
  GENERATION_COMPLETED: 'ai.generation_completed',
  GENERATION_FAILED: 'ai.generation_failed',
  PROMPT_INJECTION_DETECTED: 'ai.prompt_injection_detected',
} as const;

// -----------------------------------------------------------------------------
// AuditLogger Class
// -----------------------------------------------------------------------------

/**
 * Structured audit logging system with batch writes and graceful degradation.
 *
 * Features:
 * - Accumulates events in an in-memory buffer
 * - Flushes to database periodically (every 5s or 100 events)
 * - Falls back to keeping events in memory if DB is unavailable
 * - Emits to event bus for real-time consumers
 * - Provides convenience methods for common audit patterns
 */
class AuditLogger {
  private buffer: BufferedAuditEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private config: AuditLoggerConfig;
  private flushing = false;
  private shutdownInitiated = false;
  private stats = {
    totalLogged: 0,
    totalFlushed: 0,
    totalDropped: 0,
    flushCount: 0,
    dbFailures: 0,
  };

  constructor(config?: Partial<AuditLoggerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startFlushTimer();
  }

  // ---------------------------------------------------------------------------
  // Core Logging API
  // ---------------------------------------------------------------------------

  /**
   * Log an audit event.
   *
   * @param action - Action identifier (e.g., "storefront.create", "auth.login")
   * @param resource - Resource type (e.g., "storefront", "user", "session")
   * @param resourceId - Optional specific resource ID
   * @param details - Optional structured details about the event
   * @param options - Optional actor, level, IP, and correlation info
   */
  log(
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    options?: AuditLogOptions
  ): void {
    try {
      const event: BufferedAuditEvent = {
        action,
        resource,
        resourceId: resourceId ?? null,
        level: options?.level || 'info',
        actorId: options?.actorId ?? null,
        actorType: options?.actorType || 'anonymous',
        details: details ?? null,
        ip: options?.ip ?? null,
        userAgent: options?.userAgent ?? null,
        sessionId: options?.sessionId ?? null,
        correlationId: options?.correlationId ?? null,
        timestamp: Date.now(),
      };

      this.buffer.push(event);
      this.stats.totalLogged++;

      // Emit to event bus for real-time consumers
      if (this.config.emitToEventBus) {
        this.emitToBus(event);
      }

      // Auto-flush if batch size reached
      if (this.buffer.length >= this.config.flushBatchSize) {
        this.flush().catch(() => { /* handled internally */ });
      }

      // Enforce max buffer size — drop oldest if exceeded
      if (this.buffer.length > this.config.maxBufferSize) {
        const excess = this.buffer.length - this.config.maxBufferSize;
        this.buffer.splice(0, excess);
        this.stats.totalDropped += excess;
      }
    } catch (error) {
      console.error('[AuditLogger] Failed to buffer audit event:', error);
      this.stats.totalDropped++;
    }
  }

  /**
   * Log a security-related event.
   *
   * @param level - Severity level ('warn' or 'critical')
   * @param action - Security action (e.g., 'rate_limit_exceeded', 'blocked_request')
   * @param details - Details about the security event
   * @param options - Optional actor, IP, and correlation info
   */
  logSecurity(
    level: 'warn' | 'critical',
    action: string,
    details?: Record<string, unknown>,
    options?: AuditLogOptions
  ): void {
    this.log(action, 'security', undefined, details, {
      ...options,
      level,
      actorType: options?.actorType || 'system',
    });
  }

  /**
   * Log a data access event (CRUD).
   *
   * @param action - Data action ('create', 'read', 'update', 'delete')
   * @param resource - Resource type
   * @param resourceId - Resource ID
   * @param actorId - Actor who performed the action
   * @param details - Optional additional details
   * @param options - Additional options
   */
  logDataAccess(
    action: string,
    resource: string,
    resourceId: string,
    actorId?: string,
    details?: Record<string, unknown>,
    options?: AuditLogOptions
  ): void {
    this.log(
      `${resource}.${action}`,
      resource,
      resourceId,
      details,
      { ...options, actorId, level: options?.level || 'info' }
    );
  }

  /**
   * Log a system event (config changes, deployments, health alerts).
   *
   * @param action - System action (e.g., 'config_change', 'health_alert')
   * @param details - Details about the system event
   * @param options - Optional actor and correlation info
   */
  logSystem(
    action: string,
    details?: Record<string, unknown>,
    options?: AuditLogOptions
  ): void {
    this.log(action, 'system', undefined, details, {
      ...options,
      actorType: 'system',
    });
  }

  /**
   * Log an AI-related event (generation, prompt injection detection).
   *
   * @param action - AI action (e.g., 'generation_started', 'generation_failed')
   * @param resourceId - Optional storefront or session ID
   * @param details - Details about the AI event
   * @param options - Optional actor and correlation info
   */
  logAI(
    action: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    options?: AuditLogOptions
  ): void {
    this.log(action, 'ai', resourceId, details, options);
  }

  // ---------------------------------------------------------------------------
  // Flush Management
  // ---------------------------------------------------------------------------

  /**
   * Manually flush the buffer to the database.
   * Called automatically by the timer and when batch size is reached.
   */
  async flush(): Promise<{ written: number; remaining: number }> {
    if (this.flushing || this.buffer.length === 0) {
      return { written: 0, remaining: this.buffer.length };
    }

    this.flushing = true;
    const batch = this.buffer.splice(0, this.config.flushBatchSize);
    let written = 0;

    try {
      written = await writeAuditLogBatch(batch);
      this.stats.totalFlushed += written;
      this.stats.flushCount++;

      if (written < batch.length) {
        // Some events failed to write — push them back for retry
        const failed = batch.slice(written);
        this.buffer.unshift(...failed);
        this.stats.dbFailures++;
      }
    } catch (error) {
      console.error('[AuditLogger] Flush failed, re-buffering events:', error);
      // Push batch back to the front of the buffer for retry
      this.buffer.unshift(...batch);
      this.stats.dbFailures++;
    } finally {
      this.flushing = false;
    }

    return { written, remaining: this.buffer.length };
  }

  /**
   * Get current logger statistics.
   */
  getStats() {
    return {
      ...this.stats,
      bufferSize: this.buffer.length,
      isFlushing: this.flushing,
    };
  }

  /**
   * Gracefully shut down the audit logger.
   * Flushes remaining events and stops the timer.
   */
  async shutdown(): Promise<void> {
    if (this.shutdownInitiated) return;
    this.shutdownInitiated = true;

    // Stop the flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    if (this.buffer.length > 0) {
      console.log(`[AuditLogger] Shutting down — flushing ${this.buffer.length} remaining events`);
      await this.flush();
    }

    console.log(`[AuditLogger] Shutdown complete — stats:`, this.stats);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Start the periodic flush timer.
   */
  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush().catch(() => { /* handled internally */ });
      }
    }, this.config.flushIntervalMs);

    // Allow the Node.js process to exit even if the timer is running
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  /**
   * Emit an audit event to the event bus for real-time consumers.
   * Falls back silently if the event bus is unavailable.
   */
  private emitToBus(event: BufferedAuditEvent): void {
    try {
      const bus = getEventBus();
      bus.publish('audit.log', event, {
        source: 'audit-logger',
        priority: event.level === 'critical' ? 'critical' : 'normal',
      }).catch(() => {
        // Event bus publish failure is non-fatal
      });
    } catch {
      // Event bus not available — silently ignore
    }
  }
}

// -----------------------------------------------------------------------------
// Singleton Export
// -----------------------------------------------------------------------------

let _auditLogger: AuditLogger | null = null;

/**
 * Get the singleton AuditLogger instance.
 * Thread-safe in Node.js (single-threaded event loop).
 */
export function getAuditLogger(): AuditLogger {
  if (!_auditLogger) {
    _auditLogger = new AuditLogger();
  }
  return _auditLogger;
}

/** Default audit logger singleton for convenience */
export const auditLogger = getAuditLogger();

// Register shutdown handler
if (typeof process !== 'undefined') {
  const shutdown = async () => {
    await auditLogger.shutdown();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
