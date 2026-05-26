/**
 * @module api-response
 * @description Standardized API response wrapper for StoreCraft AI.
 *
 * Every API response follows a consistent envelope format:
 *
 * **Success:**
 * ```json
 * {
 *   "success": true,
 *   "data": <payload>,
 *   "meta": { "requestId": "...", "timestamp": "...", "durationMs": 123 },
 *   "pagination": { "total": 50, "page": 1, "pageSize": 20 } // optional
 * }
 * ```
 *
 * **Error:**
 * ```json
 * {
 *   "success": false,
 *   "error": { "code": "...", "message": "...", "details": {} },
 *   "meta": { "requestId": "...", "timestamp": "...", "durationMs": 123 }
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { AppError, toResponse } from '@/lib/errors';
import type { ErrorResponse } from '@/lib/errors';

// =============================================================================
// Response Envelope Types
// =============================================================================

/** Metadata attached to every API response. */
export interface ResponseMeta {
  /** Unique request identifier (UUID v4). */
  requestId: string;
  /** ISO-8601 timestamp when the response was created. */
  timestamp: string;
  /** Wall-clock duration of request processing in milliseconds. */
  durationMs: number;
}

/** Pagination metadata for list endpoints. */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Standard success response envelope. */
export interface SuccessEnvelope<T = unknown> {
  success: true;
  data: T;
  meta: ResponseMeta;
  pagination?: PaginationMeta;
}

/** Standard error response envelope. */
export interface ErrorEnvelope {
  success: false;
  error: ErrorResponse['error'];
  meta: ResponseMeta;
}

// =============================================================================
// Response Timings — Middleware helper
// =============================================================================

/**
 * Returns a closure that records the request start time and, when called,
 * produces a ResponseMeta with the elapsed duration.
 *
 * Usage:
 * ```ts
 * const timings = createResponseTimings(requestId);
 * // ... do work ...
 * return success(data, timings());
 * ```
 */
export function createResponseTimings(requestId?: string): {
  meta: () => ResponseMeta;
  elapsedMs: () => number;
} {
  const startTime = performance.now();
  const id = requestId || crypto.randomUUID();

  return {
    meta: (): ResponseMeta => ({
      requestId: id,
      timestamp: new Date().toISOString(),
      durationMs: Math.round(performance.now() - startTime),
    }),
    elapsedMs: (): number => Math.round(performance.now() - startTime),
  };
}

// =============================================================================
// Success Responses
// =============================================================================

/**
 * Returns a `200 OK` response with the standard success envelope.
 *
 * @param data   - The response payload.
 * @param meta   - Optional pre-built meta (auto-generated if omitted).
 * @param pagination - Optional pagination metadata.
 */
export function success<T>(
  data: T,
  meta?: ResponseMeta,
  pagination?: PaginationMeta,
): NextResponse<SuccessEnvelope<T>> {
  const responseMeta = meta ?? {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    durationMs: 0,
  };

  const body: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: responseMeta,
    ...(pagination && { pagination }),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'X-Request-ID': responseMeta.requestId,
    },
  });
}

/**
 * Returns a `201 Created` response.
 * Identical envelope to `success()` but with HTTP 201 status.
 *
 * @param data - The created resource payload.
 * @param meta - Optional pre-built meta.
 */
export function created<T>(data: T, meta?: ResponseMeta): NextResponse<SuccessEnvelope<T>> {
  const responseMeta = meta ?? {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    durationMs: 0,
  };

  const body: SuccessEnvelope<T> = {
    success: true,
    data,
    meta: responseMeta,
  };

  return NextResponse.json(body, {
    status: 201,
    headers: {
      'X-Request-ID': responseMeta.requestId,
    },
  });
}

/**
 * Returns a `204 No Content` response.
 * Use when a DELETE or update operation succeeds with no body.
 */
export function noContent(): NextResponse<null> {
  return new NextResponse(null, { status: 204 });
}

// =============================================================================
// Error Response
// =============================================================================

/**
 * Returns an error response using the standard error envelope.
 * Wraps the provided AppError into a `NextResponse` with appropriate status.
 *
 * @param appError  - A classified AppError instance.
 * @param meta      - Optional pre-built meta (auto-generated if omitted).
 */
export function error(
  appError: AppError,
  meta?: ResponseMeta,
): NextResponse<ErrorEnvelope> {
  const responseMeta = meta ?? {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    durationMs: 0,
  };

  const errorBody = toResponse(appError, responseMeta.requestId);

  const body: ErrorEnvelope = {
    success: false,
    error: errorBody.error,
    meta: responseMeta,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-ID': responseMeta.requestId,
  };

  // Rate limit retry-after header
  if (appError instanceof (async () => {}).constructor.prototype.constructor) {
    // This is a safety net — handled more precisely below
  }
  if ('retryAfterMs' in appError && typeof appError.retryAfterMs === 'number') {
    headers['Retry-After'] = String(Math.ceil((appError as unknown as { retryAfterMs: number }).retryAfterMs / 1000));
  }

  return NextResponse.json(body, {
    status: appError.statusCode,
    headers,
  });
}

// =============================================================================
// Paginated Response Helper
// =============================================================================

/**
 * Convenience wrapper that builds pagination metadata and returns a paginated response.
 *
 * @param data     - Array of items for the current page.
 * @param total    - Total number of items across all pages.
 * @param page     - Current page number (1-based).
 * @param pageSize - Number of items per page.
 * @param meta     - Optional pre-built meta.
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  meta?: ResponseMeta,
): NextResponse<SuccessEnvelope<T[]>> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagination: PaginationMeta = {
    total,
    page,
    pageSize,
    totalPages,
  };
  return success(data, meta, pagination);
}

// =============================================================================
// Cache-Control Helper
// =============================================================================

/**
 * Adds a `Cache-Control` header to an existing NextResponse.
 *
 * @param response - The response to augment.
 * @param maxAge   - Cache duration in seconds.
 * @param options  - Optional stale-while-revalidate and stale-if-error durations.
 */
export function withCache(
  response: NextResponse,
  maxAge: number,
  options?: {
    staleWhileRevalidate?: number;
    staleIfError?: number;
    mustRevalidate?: boolean;
  },
): NextResponse {
  let value = `public, max-age=${maxAge}`;

  if (options?.staleWhileRevalidate) {
    value += `, stale-while-revalidate=${options.staleWhileRevalidate}`;
  }
  if (options?.staleIfError) {
    value += `, stale-if-error=${options.staleIfError}`;
  }
  if (options?.mustRevalidate) {
    value += `, must-revalidate`;
  }

  const newHeaders = new Headers(response.headers);
  newHeaders.set('Cache-Control', value);
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

// =============================================================================
// Streaming Response Helper
// =============================================================================

/**
 * Creates a streaming response for SSE (Server-Sent Events) or chunked data.
 *
 * @param stream  - A ReadableStream of data chunks.
 * @param headers - Optional additional headers (e.g. Content-Type for SSE).
 */
export function streamResponse(
  stream: ReadableStream<Uint8Array>,
  headers?: Record<string, string>,
): NextResponse {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    ...headers,
  };

  return new NextResponse(stream, { headers: defaultHeaders });
}
