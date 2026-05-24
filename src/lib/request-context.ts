/**
 * @module request-context
 * @description Request tracing, context management, and structured logging for StoreCraft AI.
 *
 * Uses Node.js `AsyncLocalStorage` to automatically propagate per-request data
 * through the entire async call chain without explicit parameter threading.
 *
 * ## RequestContext
 * Stores per-request metadata: request ID, correlation ID, timing, client info.
 *
 * ## RequestContextManager
 * Factory that wraps the incoming `NextRequest` in an `AsyncLocalStorage` store.
 *
 * ## StructuredLogger
 * JSON-structured logger that automatically includes request context from
 * `AsyncLocalStorage` when available.
 *
 * Usage in API routes:
 * ```ts
 * const ctx = RequestContextManager.create(request);
 * logger.info('Processing chat message', { sessionId });
 * // ... later in any async function:
 * const currentCtx = RequestContextManager.getCurrent();
 * ```
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

// =============================================================================
// RequestContext — Per-request metadata
// =============================================================================

/**
 * Immutable per-request context data.
 *
 * Created at the edge of the request lifecycle (API route handler) and
 * propagated automatically via `AsyncLocalStorage`.
 */
export interface RequestContext {
  /** Unique request identifier (UUID v4). */
  requestId: string;
  /** Correlation ID for tracing across services (from header or generated). */
  correlationId: string;
  /** High-resolution timestamp when the request started. */
  startTime: number;
  /** HTTP method (GET, POST, etc.). */
  method: string;
  /** URL pathname (e.g. '/api/chat'). */
  path: string;
  /** Client IP address (from X-Forwarded-For or X-Real-IP). */
  clientIp: string;
  /** User-Agent header value. */
  userAgent: string;
  /** Optional session identifier. */
  sessionId?: string;
  /** Optional authenticated user ID. */
  userId?: string;
}

// =============================================================================
// RequestContextManager — AsyncLocalStorage-based context propagation
// =============================================================================

/** The type stored in AsyncLocalStorage. */
type ContextStore = {
  context: RequestContext;
  extra: Map<string, unknown>;
};

/** Global AsyncLocalStorage instance for request context propagation. */
const asyncLocalStorage = new AsyncLocalStorage<ContextStore>();

/**
 * Creates a new RequestContext from an incoming NextRequest and runs a callback
 * within the AsyncLocalStorage context.
 *
 * The correlation ID is read from the `X-Correlation-ID` header if present,
 * otherwise a new UUID v4 is generated.
 *
 * @param request - The incoming NextRequest.
 * @param fn      - The async callback to execute within context.
 * @returns       - The return value of `fn`.
 */
export async function withRequestContext<T>(
  request: NextRequest,
  fn: () => T | Promise<T>,
): Promise<T> {
  const context = buildContext(request);
  const store: ContextStore = { context, extra: new Map() };

  return asyncLocalStorage.run(store, () => fn());
}

/**
 * Creates a RequestContext without running it in an AsyncLocalStorage scope.
 * Use this when you need the context object directly (e.g. for ResponseTimings).
 */
export function createRequestContext(request: NextRequest): RequestContext {
  return buildContext(request);
}

/**
 * Returns the current RequestContext if called within a `withRequestContext` scope.
 * Returns `undefined` if no context is active.
 */
export function getCurrentContext(): RequestContext | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.context;
}

/**
 * Returns the current request ID, or a fallback string if no context is active.
 */
export function getCurrentRequestId(): string {
  return getCurrentContext()?.requestId ?? 'no-context';
}

/**
 * Sets an arbitrary key-value pair in the current request context's extra store.
 * Values are only available within the same async scope.
 */
export function setContextValue(key: string, value: unknown): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.extra.set(key, value);
  }
}

/**
 * Gets an arbitrary value from the current request context's extra store.
 * Returns `undefined` if the key does not exist or no context is active.
 */
export function getContextValue<T = unknown>(key: string): T | undefined {
  const store = asyncLocalStorage.getStore();
  if (store) {
    return store.extra.get(key) as T | undefined;
  }
  return undefined;
}

/**
 * Returns the raw AsyncLocalStorage store (for advanced use only).
 */
export function getStore(): AsyncLocalStorage<ContextStore> {
  return asyncLocalStorage;
}

// =============================================================================
// StructuredLogger — JSON-structured logging with automatic context injection
// =============================================================================

/** Log levels in ascending severity order. */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Shape of a structured log entry emitted by the logger. */
export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  correlationId: string;
  path?: string;
  method?: string;
  message: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  durationMs?: number;
}

/**
 * Structured logger that outputs JSON-formatted log entries.
 *
 * Automatically enriches every log with request context (requestId, correlationId,
 * path, method) when called within a `withRequestContext` scope.
 *
 * Usage:
 * ```ts
 * import { logger } from '@/lib/request-context';
 * logger.info('Chat message processed', { sessionId, messageCount });
 * logger.error('LLM call failed', error);
 * ```
 */
export const logger = {
  /**
   * Log a debug-level message.
   * Debug logs are only emitted in non-production environments.
   */
  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'production') return;
    emitLog('debug', message, data);
  },

  /**
   * Log an info-level message.
   */
  info(message: string, data?: unknown): void {
    emitLog('info', message, data);
  },

  /**
   * Log a warning-level message.
   */
  warn(message: string, data?: unknown): void {
    emitLog('warn', message, data);
  },

  /**
   * Log an error-level message.
   * If `err` is an Error instance, its stack trace is included.
   */
  error(message: string, err?: unknown): void {
    emitLog('error', message, undefined, err);
  },
} as const;

// =============================================================================
// Private Helpers
// =============================================================================

/** Build a RequestContext from a NextRequest. */
function buildContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const correlationId =
    request.headers.get('x-correlation-id') || crypto.randomUUID();

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return {
    requestId,
    correlationId,
    startTime: performance.now(),
    method: request.method,
    path: request.nextUrl.pathname,
    clientIp,
    userAgent: request.headers.get('user-agent') || 'unknown',
    sessionId: request.headers.get('x-session-id') || undefined,
    userId: request.headers.get('x-user-id') || undefined,
  };
}

/** Emit a structured log entry to stdout. */
function emitLog(
  level: LogLevel,
  message: string,
  data?: unknown,
  err?: unknown,
): void {
  const ctx = getCurrentContext();
  const now = new Date().toISOString();

  const entry: StructuredLogEntry = {
    timestamp: now,
    level,
    requestId: ctx?.requestId ?? 'no-context',
    correlationId: ctx?.correlationId ?? 'no-context',
    ...(ctx && { path: ctx.path, method: ctx.method }),
    message,
    ...(data !== undefined && { data }),
    ...(err instanceof Error && {
      error: {
        name: err.name,
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      },
    }),
  };

  // Include request duration if context is available
  if (ctx) {
    entry.durationMs = Math.round(performance.now() - ctx.startTime);
  }

  const jsonLine = JSON.stringify(entry);

  switch (level) {
    case 'debug':
      console.debug(jsonLine);
      break;
    case 'info':
      console.log(jsonLine);
      break;
    case 'warn':
      console.warn(jsonLine);
      break;
    case 'error':
      console.error(jsonLine);
      break;
  }
}

/**
 * @deprecated Use `logger` directly instead.
 * Exported RequestContextManager namespace for backward compatibility.
 */
export const RequestContextManager = {
  create: createRequestContext,
  getStore,
  getCurrent: getCurrentContext,
  set: setContextValue,
  get: getContextValue,
} as const;
