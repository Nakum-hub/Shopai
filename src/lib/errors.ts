/**
 * @module errors
 * @description Comprehensive error handling system for StoreCraft AI.
 *
 * Provides a typed error hierarchy, automatic classification of unknown errors,
 * structured serialization for API responses and logs, and a global error boundary
 * for Next.js API routes.
 *
 * Error Hierarchy:
 *   AppError (base, abstract)
 *     ├── ValidationError        (400)
 *     ├── AuthenticationError   (401)
 *     ├── AuthorizationError    (403)
 *     ├── NotFoundError         (404)
 *     ├── RateLimitError        (429)
 *     ├── ExternalServiceError  (502) — LLM / external API failures
 *     ├── ServiceUnavailableError (503)
 *     └── InternalError         (500)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

// =============================================================================
// Machine-Readable Error Codes
// =============================================================================

/** Exhaustive list of machine-readable error codes used across the application. */
export const ErrorCodes = {
  // --- 4xx Client Errors ---
  VALIDATION_FAILED:       'VALIDATION_FAILED',
  AUTH_MISSING:            'AUTH_MISSING',
  AUTH_INVALID:            'AUTH_INVALID',
  AUTH_EXPIRED:            'AUTH_EXPIRED',
  FORBIDDEN:               'FORBIDDEN',
  NOT_FOUND:               'NOT_FOUND',
  RATE_LIMIT_EXCEEDED:     'RATE_LIMIT_EXCEEDED',
  CONFLICT:                'CONFLICT',
  PAYLOAD_TOO_LARGE:       'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE:  'UNSUPPORTED_MEDIA_TYPE',

  // --- 5xx Server Errors ---
  INTERNAL_ERROR:          'INTERNAL_ERROR',
  DATABASE_ERROR:          'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR:  'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE:     'SERVICE_UNAVAILABLE',
  QUEUE_ERROR:             'QUEUE_ERROR',
  CACHE_ERROR:             'CACHE_ERROR',

  // --- Domain-Specific ---
  LLM_RESPONSE_INVALID:   'LLM_RESPONSE_INVALID',
  LLM_TIMEOUT:             'LLM_TIMEOUT',
  STOREFRONT_GENERATION:   'STOREFRONT_GENERATION',
  VOICE_PROCESSING:        'VOICE_PROCESSING',
  PIPELINE_EXECUTION:      'PIPELINE_EXECUTION',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// AppError — Base Error Class
// =============================================================================

/**
 * Base application error with structured metadata.
 * All domain-specific errors extend this class.
 *
 * @property code        - Machine-readable error code (e.g. 'VALIDATION_FAILED').
 * @property statusCode   - HTTP status code.
 * @property message     - Human-readable error message.
 * @property details      - Optional additional context (e.g. field-level validation errors).
 * @property isOperational - `true` if the error is expected (client fault), `false` if it is a bug.
 * @property timestamp    - ISO-8601 timestamp when the error was created.
 * @property correlationId - Optional correlation ID for tracing across services.
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public correlationId?: string;

  constructor(
    code: ErrorCode,
    statusCode: number,
    message: string,
    options?: {
      details?: unknown;
      isOperational?: boolean;
      cause?: Error;
      correlationId?: string;
    },
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
  }
}

// =============================================================================
// Concrete Error Classes
// =============================================================================

/**
 * Thrown when request input fails validation (Zod, custom rules, etc.).
 * HTTP 400.
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Request validation failed',
    details?: unknown,
    cause?: Error,
  ) {
    super(ErrorCodes.VALIDATION_FAILED, 400, message, {
      details,
      isOperational: true,
      cause,
    });
  }
}

/**
 * Thrown when authentication is missing or invalid (no token, expired token, bad credentials).
 * HTTP 401.
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    code: ErrorCode = ErrorCodes.AUTH_MISSING,
    cause?: Error,
  ) {
    super(code, 401, message, { isOperational: true, cause });
  }
}

/**
 * Thrown when the authenticated user lacks permission for the requested action.
 * HTTP 403.
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    details?: unknown,
  ) {
    super(ErrorCodes.FORBIDDEN, 403, message, { details });
  }
}

/**
 * Thrown when a requested resource does not exist.
 * HTTP 404.
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    resource?: string,
  ) {
    super(ErrorCodes.NOT_FOUND, 404, message, {
      details: resource ? { resource } : undefined,
    });
  }
}

/**
 * Thrown when a client exceeds rate limits.
 * HTTP 429.
 */
export class RateLimitError extends AppError {
  public readonly retryAfterMs: number;

  constructor(
    message: string = 'Too many requests',
    retryAfterMs: number = 60_000,
  ) {
    super(ErrorCodes.RATE_LIMIT_EXCEEDED, 429, message, {
      details: { retryAfterMs, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) },
    });
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Thrown when an external service (LLM API, payment gateway, etc.) fails.
 * HTTP 502.
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string = 'External service unavailable',
    service?: string,
    cause?: Error,
  ) {
    super(ErrorCodes.EXTERNAL_SERVICE_ERROR, 502, message, {
      details: service ? { service } : undefined,
      isOperational: true,
      cause,
    });
  }
}

/**
 * Thrown when a required subsystem (DB, Redis, queue) is unavailable.
 * HTTP 503.
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = 'Service temporarily unavailable',
    service?: string,
    cause?: Error,
  ) {
    super(ErrorCodes.SERVICE_UNAVAILABLE, 503, message, {
      details: service ? { service } : undefined,
      isOperational: true,
      cause,
    });
  }
}

/**
 * Thrown for unexpected server-side errors (bugs).
 * HTTP 500.
 */
export class InternalError extends AppError {
  constructor(
    message: string = 'An unexpected error occurred',
    cause?: Error,
  ) {
    super(ErrorCodes.INTERNAL_ERROR, 500, message, {
      isOperational: false,
      cause,
    });
  }
}

// =============================================================================
// ErrorClassifier — Converts unknown errors into AppError instances
// =============================================================================

/**
 * Classifies an unknown thrown value into a typed AppError.
 *
 * Handles:
 * - Already-classified AppError instances (passthrough)
 * - Prisma errors (unique constraint → 409, not found → 404, connection → 503)
 * - ZodError objects
 * - Standard Error with known message patterns (network, timeout, JSON parse)
 * - Fallback → InternalError (500)
 */
export function classifyError(error: unknown, correlationId?: string): AppError {
  // 1. Already an AppError — attach correlation ID if missing
  if (error instanceof AppError) {
    if (!error.correlationId && correlationId) {
      error.correlationId = correlationId;
    }
    return error;
  }

  // 2. Prisma-specific errors
  if (isPrismaError(error)) {
    return classifyPrismaError(error, correlationId);
  }

  // 3. Zod validation errors (check for ZodError shape)
  if (isZodError(error)) {
    const formatted = formatZodError(error);
    return new ValidationError('Request validation failed', formatted, error instanceof Error ? error : undefined);
  }

  // 4. Standard Error — classify by message pattern
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    // Network / timeout errors → ExternalServiceError (502)
    if (
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('socket hang up') ||
      msg.includes('network error') ||
      msg.includes('fetch failed')
    ) {
      return new ExternalServiceError('Network error communicating with external service', undefined, error);
    }

    // Timeout errors
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('abort')) {
      return new ExternalServiceError('Request to external service timed out', undefined, error);
    }

    // JSON parse errors → ValidationError
    if (msg.includes('json') && msg.includes('parse')) {
      return new ValidationError('Invalid JSON in request body', undefined, error);
    }

    // Payload too large
    if (msg.includes('payload too large') || msg.includes('request entity too large')) {
      return new ValidationError('Request payload exceeds maximum allowed size', undefined, error);
    }

    // LLM-specific patterns
    if (
      msg.includes('max_tokens') ||
      msg.includes('content_filter') ||
      msg.includes('model_not_found') ||
      msg.includes('invalid_api_key')
    ) {
      return new ExternalServiceError('LLM service error', 'llm', error);
    }

    // Rate limit from upstream
    if (msg.includes('rate_limit') || msg.includes('too many requests')) {
      return new RateLimitError('Upstream rate limit exceeded', 60_000);
    }
  }

  // 5. Fallback → InternalError (bug)
  const detail = error instanceof Error ? error.message : String(error);
  return new InternalError(
    process.env.NODE_ENV === 'development'
      ? `Unexpected error: ${detail}`
      : 'An unexpected error occurred',
    error instanceof Error ? error : new Error(String(error)),
  );
}

// =============================================================================
// ErrorSerializer — Structured output for responses and logs
// =============================================================================

/**
 * Serialized error shape returned in API responses.
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Structured log entry for errors.
 */
export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn';
  code: string;
  statusCode: number;
  message: string;
  details?: unknown;
  isOperational: boolean;
  stack?: string;
  cause?: string;
  requestId?: string;
  correlationId?: string;
  path?: string;
  method?: string;
}

/**
 * Serialize an AppError into a standardized API response body.
 * In production, details are stripped for non-operational (bug) errors.
 */
export function toResponse(error: AppError, requestId?: string): ErrorResponse {
  const isProduction = process.env.NODE_ENV === 'production';

  // Hide internal details in production for non-operational errors
  const safeDetails =
    !isProduction || error.isOperational ? error.details : undefined;

  return {
    error: {
      code: error.code,
      message: error.message,
      ...(safeDetails !== undefined && { details: safeDetails }),
      ...(requestId && { requestId }),
    },
  };
}

/**
 * Serialize an AppError into a structured log object.
 * Always includes full details for observability.
 */
export function toLog(
  error: AppError,
  context?: {
    requestId?: string;
    path?: string;
    method?: string;
  },
): ErrorLogEntry {
  return {
    timestamp: error.timestamp.toISOString(),
    level: error.isOperational ? 'warn' : 'error',
    code: error.code,
    statusCode: error.statusCode,
    message: error.message,
    details: error.details,
    isOperational: error.isOperational,
    stack: error.stack,
    cause: error.cause?.message,
    requestId: context?.requestId,
    correlationId: error.correlationId,
    path: context?.path,
    method: context?.method,
  };
}

// =============================================================================
// Global Error Handler — For use in API route catch blocks / middleware
// =============================================================================

/**
 * Handles an unknown error and returns a standardized NextResponse.
 *
 * Usage in API routes:
 * ```ts
 * try { ... } catch (err) {
 *   return errorHandler(err, request);
 * }
 * ```
 */
export function errorHandler(error: unknown, request?: NextRequest): NextResponse {
  const requestId = request?.headers.get('x-request-id') || crypto.randomUUID();

  // Generate a correlation ID from header if present
  const correlationId = request?.headers.get('x-correlation-id') || undefined;

  const appError = classifyError(error, correlationId);

  // Attach request context to correlation if not set
  if (!appError.correlationId && correlationId) {
    appError.correlationId = correlationId;
  }

  // Structured log
  const logEntry = toLog(appError, {
    requestId,
    path: request?.nextUrl?.pathname,
    method: request?.method,
  });

  // Log appropriately based on severity
  if (appError.isOperational) {
    console.warn('[API_ERROR]', JSON.stringify(logEntry));
  } else {
    console.error('[API_ERROR]', JSON.stringify(logEntry));
  }

  // Build response
  const body = toResponse(appError, requestId);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
  };

  // Rate limit header
  if (appError instanceof RateLimitError) {
    headers['Retry-After'] = String(Math.ceil(appError.retryAfterMs / 1000));
  }

  return NextResponse.json(body, {
    status: appError.statusCode,
    headers,
  });
}

// =============================================================================
// Helper — Prisma Error Detection & Classification
// =============================================================================

/** Check if an error is a Prisma client error (duck-typing, no import needed). */
function isPrismaError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return (
      e.code !== undefined &&
      typeof e.code === 'string' &&
      (e.code.startsWith('P') || e.code.startsWith('P2'))
    );
  }
  return false;
}

/** Classify a Prisma error into an appropriate AppError. */
function classifyPrismaError(error: unknown, correlationId?: string): AppError {
  const e = error as Record<string, unknown>;
  const code = String(e.code ?? 'UNKNOWN');
  const message = e.message ? String(e.message) : 'Database error';

  switch (code) {
    // Unique constraint violation → 409 Conflict (mapped to ValidationError for simplicity)
    case 'P2002':
      return new ValidationError(
        'A record with this value already exists',
        { constraint: (e.meta as Record<string, unknown>)?.target },
        error instanceof Error ? error : undefined,
      );

    // Record not found
    case 'P2025':
      return new NotFoundError('Record not found in database');

    // Foreign key constraint
    case 'P2003':
      return new ValidationError(
        'Referenced record does not exist',
        { constraint: (e.meta as Record<string, unknown>)?.field_name },
        error instanceof Error ? error : undefined,
      );

    // Connection / pool errors
    case 'P1000':
    case 'P1001':
    case 'P1008':
    case 'P1009':
    case 'P1017':
      return new ServiceUnavailableError(
        'Database connection failed',
        'database',
        error instanceof Error ? error : undefined,
      );

    // Timeout
    case 'P2024':
      return new ServiceUnavailableError(
        'Database request timed out',
        'database',
        error instanceof Error ? error : undefined,
      );

    // Query engine errors
    case 'P2010':
    case 'P2011':
    case 'P2012':
    case 'P2013':
    case 'P2014':
    case 'P2015':
      return new ValidationError(
        'Invalid database operation',
        { prismaCode: code },
        error instanceof Error ? error : undefined,
      );

    // Transaction errors
    case 'P2028':
      return new ServiceUnavailableError(
        'Transaction failed due to concurrent conflict',
        'database',
        error instanceof Error ? error : undefined,
      );

    default:
      return new InternalError(
        `Database error (${code})`,
        error instanceof Error ? error : undefined,
      );
  }
}

// =============================================================================
// Helper — Zod Error Detection & Formatting
// =============================================================================

/** Check if an error is a ZodError (duck-typing). */
function isZodError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    return (
      e.issues !== undefined &&
      Array.isArray(e.issues) &&
      e.issues.length > 0 &&
      typeof (e.issues[0] as Record<string, unknown>).message === 'string'
    );
  }
  return false;
}

/** Format Zod validation errors into a structured object. */
function formatZodError(error: unknown): { field: string; message: string }[] {
  const e = error as Record<string, unknown>;
  const issues = e.issues as Array<Record<string, unknown>>;
  return issues.slice(0, 10).map((issue) => ({
    field: String(issue.path?.join('.') || 'root'),
    message: String(issue.message),
  }));
}
