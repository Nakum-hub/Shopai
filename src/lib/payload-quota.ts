'use server';

// =============================================================================
// Payload Quota — Request/Response Size Limits
// =============================================================================
// Per-endpoint request body and response size quotas for StoreCraft AI.
// Prevents oversized payloads from overwhelming the server and limits
// response sizes to prevent abuse. Includes prototype pollution protection.
// =============================================================================

// =============================================================================
// Constants
// =============================================================================

/** Maximum upload size for audio/voice processing (5 MB) */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Maximum size for generated HTML output (500 KB) */
export const MAX_HTML_OUTPUT_SIZE = 500 * 1024;

/** Maximum length for a single chat message (10 KB) */
export const MAX_CHAT_MESSAGE_LENGTH = 10 * 1024;

/** Default body size limit for unlisted endpoints (100 KB) */
export const DEFAULT_BODY_LIMIT = 100 * 1024;

/** Maximum body size limit across all endpoints (10 MB safety cap) */
export const HARD_MAX_BODY_SIZE = 10 * 1024 * 1024;

// =============================================================================
// Payload Size Checking
// =============================================================================

/**
 * Result of a payload size check.
 */
export interface PayloadCheckResult {
  /** Whether the payload is within the allowed limit */
  allowed: boolean;
  /** The actual size of the payload in bytes */
  size: number;
  /** The maximum allowed size in bytes for this endpoint */
  limit: number;
  /** Human-readable error message if the payload exceeds the limit */
  error?: string;
}

/**
 * Get the size of a payload in bytes.
 * Handles string, Buffer, and undefined inputs.
 *
 * @param body - The request body to measure
 * @returns Size in bytes (0 for undefined/null)
 */
function getPayloadSize(body: string | Buffer | undefined): number {
  if (!body) return 0;
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8');
  return body.length;
}

/**
 * Get the byte size limit for a given endpoint and HTTP method.
 *
 * @param endpoint - The API endpoint path (e.g., '/api/generate/website')
 * @param method - The HTTP method (e.g., 'POST', 'GET')
 * @returns Maximum allowed body size in bytes
 */
export function getEndpointLimit(endpoint: string, method: string): number {
  const methodUpper = method.toUpperCase();
  const normalizedEndpoint = endpoint.toLowerCase();

  // GET, HEAD, OPTIONS, DELETE — no body expected
  if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(methodUpper)) {
    return 0; // 0 means no body allowed (but we don't reject, just note)
  }

  // Per-endpoint quotas
  const endpointQuotas: Array<{ pattern: RegExp; limit: number }> = [
    // Voice processing — audio files up to 5 MB
    { pattern: /\/api\/voice\/process/i, limit: MAX_UPLOAD_SIZE },
    // Website generation — up to 50 KB for business profile + config
    { pattern: /\/api\/generate\/website/i, limit: 50 * 1024 },
    // Chat messages — up to 10 KB
    { pattern: /\/api\/chat/i, limit: MAX_CHAT_MESSAGE_LENGTH },
    // File/image uploads — up to 2 MB
    { pattern: /\/api\/upload/i, limit: 2 * 1024 * 1024 },
    // Template operations — up to 50 KB
    { pattern: /\/api\/templates/i, limit: 50 * 1024 },
    // Analytics data — up to 50 KB
    { pattern: /\/api\/analytics/i, limit: 50 * 1024 },
    // Settings/profile — up to 20 KB
    { pattern: /\/api\/(?:settings|profile|account)/i, limit: 20 * 1024 },
    // Webhook configurations — up to 10 KB
    { pattern: /\/api\/webhooks/i, limit: 10 * 1024 },
  ];

  for (const { pattern, limit } of endpointQuotas) {
    if (pattern.test(normalizedEndpoint)) {
      return limit;
    }
  }

  // Default limit for all other POST/PUT/PATCH endpoints
  return DEFAULT_BODY_LIMIT;
}

/**
 * Check if a request body is within the allowed size limit for an endpoint.
 *
 * @param body - The request body (string, Buffer, or undefined)
 * @param endpoint - The API endpoint path
 * @param method - The HTTP method
 * @returns Check result with allowed flag, sizes, and optional error
 */
export function checkPayloadSize(
  body: string | Buffer | undefined,
  endpoint: string,
  method: string
): PayloadCheckResult {
  const size = getPayloadSize(body);
  const limit = getEndpointLimit(endpoint, method);

  // GET/HEAD/DELETE with no body is always fine
  const methodUpper = method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(methodUpper)) {
    return { allowed: true, size, limit: 0 };
  }

  // Enforce hard max
  if (size > HARD_MAX_BODY_SIZE) {
    return {
      allowed: false,
      size,
      limit: HARD_MAX_BODY_SIZE,
      error: `Request body exceeds hard maximum of ${formatBytes(HARD_MAX_BODY_SIZE)} (got ${formatBytes(size)})`,
    };
  }

  // Check endpoint-specific limit
  if (size > limit) {
    return {
      allowed: false,
      size,
      limit,
      error: `Request body exceeds ${formatBytes(limit)} limit for ${method} ${endpoint} (got ${formatBytes(size)})`,
    };
  }

  return { allowed: true, size, limit };
}

// =============================================================================
// Response Size Checking
// =============================================================================

/**
 * Response size quotas per endpoint.
 * Prevents the server from generating excessively large responses.
 */
const responseQuotas: Array<{ pattern: RegExp; limit: number }> = [
  // Generated HTML output — max 500 KB
  { pattern: /\/api\/generate\/website/i, limit: MAX_HTML_OUTPUT_SIZE },
  // Chat responses — max 50 KB
  { pattern: /\/api\/chat/i, limit: 50 * 1024 },
  // Template listings — max 100 KB
  { pattern: /\/api\/templates/i, limit: 100 * 1024 },
  // Analytics — max 200 KB
  { pattern: /\/api\/analytics/i, limit: 200 * 1024 },
  // Settings/profile — max 20 KB
  { pattern: /\/api\/(?:settings|profile|account)/i, limit: 20 * 1024 },
];

/**
 * Get the byte size of a response data object.
 * Serializes to JSON and measures the UTF-8 byte length.
 *
 * @param data - The response data to measure
 * @returns Size in bytes
 */
function getResponseSize(data: unknown): number {
  if (data === null || data === undefined) return 0;
  if (typeof data === 'string') return Buffer.byteLength(data, 'utf8');
  if (Buffer.isBuffer(data)) return data.length;
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

/**
 * Check if response data is within the allowed size limit for an endpoint.
 *
 * @param data - The response data to measure
 * @param endpoint - The API endpoint path
 * @returns Check result with allowed flag, sizes, and optional error
 */
export function checkResponseSize(
  data: unknown,
  endpoint: string
): PayloadCheckResult {
  const size = getResponseSize(data);
  const normalizedEndpoint = endpoint.toLowerCase();

  for (const { pattern, limit } of responseQuotas) {
    if (pattern.test(normalizedEndpoint)) {
      if (size > limit) {
        return {
          allowed: false,
          size,
          limit,
          error: `Response exceeds ${formatBytes(limit)} limit for ${endpoint} (got ${formatBytes(size)})`,
        };
      }
      return { allowed: true, size, limit };
    }
  }

  // Default response limit: 1 MB
  const defaultLimit = 1024 * 1024;
  if (size > defaultLimit) {
    return {
      allowed: false,
      size,
      limit: defaultLimit,
      error: `Response exceeds default ${formatBytes(defaultLimit)} limit (got ${formatBytes(size)})`,
    };
  }

  return { allowed: true, size, limit: defaultLimit };
}

// =============================================================================
// Payload Structure Validation (Prototype Pollution Prevention)
// =============================================================================

/**
 * Result of payload structure validation.
 */
export interface StructureValidationResult {
  /** Whether the payload structure is valid */
  valid: boolean;
  /** List of unexpected keys that were found */
  extraKeys: string[];
}

/** Keys that must never appear in user-supplied payloads (prototype pollution). */
const DANGEROUS_KEYS = [
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__noSuchMethod__',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
  'unwatch',
  'watch',
] as const;

/**
 * Validate that a payload object only contains the expected keys.
 * Detects prototype pollution attempts by checking for dangerous keys
 * like `__proto__`, `constructor`, and `prototype`.
 *
 * This is a shallow check — it only inspects the top-level keys of the object.
 * Nested objects should be validated separately if needed.
 *
 * @param data - The payload data to validate
 * @param expectedKeys - Array of expected top-level keys
 * @returns Validation result with valid flag and list of extra/dangerous keys
 */
export function validatePayloadStructure(
  data: unknown,
  expectedKeys: string[]
): StructureValidationResult {
  // Non-objects are always valid (primitives can't be polluted)
  if (data === null || data === undefined || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: true, extraKeys: [] };
  }

  const payloadKeys = Object.keys(data as Record<string, unknown>);
  const expectedSet = new Set(expectedKeys);
  const extraKeys: string[] = [];
  const dangerousKeysFound: string[] = [];

  for (const key of payloadKeys) {
    // Check for dangerous prototype pollution keys
    if ((DANGEROUS_KEYS as readonly string[]).includes(key)) {
      dangerousKeysFound.push(key);
      extraKeys.push(key);
      continue;
    }

    // Check for unexpected keys
    if (!expectedSet.has(key)) {
      extraKeys.push(key);
    }
  }

  // If any dangerous keys are found, always invalid
  if (dangerousKeysFound.length > 0) {
    return {
      valid: false,
      extraKeys,
    };
  }

  // Extra keys that aren't dangerous — still invalid if caller is strict
  return {
    valid: extraKeys.length === 0,
    extraKeys,
  };
}

// =============================================================================
// PayloadQuota Class
// =============================================================================

/**
 * Per-endpoint payload quota manager.
 * Provides a class-based API for checking request and response sizes
 * with configurable quotas and enforcement.
 *
 * @example
 * ```typescript
 * const quota = new PayloadQuota();
 *
 * // Check a request body
 * const result = quota.checkRequest(body, '/api/generate/website', 'POST');
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.error }, { status: 413 });
 * }
 *
 * // Check a response
 * const responseCheck = quota.checkResponse(data, '/api/chat');
 * ```
 */
export class PayloadQuota {
  private customEndpointLimits: Map<string, number>;
  private customResponseLimits: Map<string, number>;

  constructor() {
    this.customEndpointLimits = new Map();
    this.customResponseLimits = new Map();
  }

  /**
   * Set a custom body size limit for a specific endpoint.
   *
   * @param endpoint - The API endpoint path (regex pattern supported)
   * @param limitBytes - Maximum allowed body size in bytes
   */
  setEndpointLimit(endpoint: string, limitBytes: number): void {
    this.customEndpointLimits.set(endpoint.toLowerCase(), limitBytes);
  }

  /**
   * Set a custom response size limit for a specific endpoint.
   *
   * @param endpoint - The API endpoint path (regex pattern supported)
   * @param limitBytes - Maximum allowed response size in bytes
   */
  setResponseLimit(endpoint: string, limitBytes: number): void {
    this.customResponseLimits.set(endpoint.toLowerCase(), limitBytes);
  }

  /**
   * Check if a request body is within the allowed size limit.
   * Checks custom limits first, then falls back to default quotas.
   *
   * @param body - The request body
   * @param endpoint - The API endpoint path
   * @param method - The HTTP method
   * @returns PayloadCheckResult with allowed flag and error details
   */
  checkRequest(
    body: string | Buffer | undefined,
    endpoint: string,
    method: string
  ): PayloadCheckResult {
    const size = getPayloadSize(body);
    const normalizedEndpoint = endpoint.toLowerCase();

    // Check custom limits first
    for (const [pattern, limit] of this.customEndpointLimits) {
      try {
        if (new RegExp(pattern, 'i').test(normalizedEndpoint)) {
          if (size > limit) {
            return {
              allowed: false,
              size,
              limit,
              error: `Request body exceeds custom ${formatBytes(limit)} limit for ${method} ${endpoint}`,
            };
          }
          return { allowed: true, size, limit };
        }
      } catch {
        // Invalid regex — skip
      }
    }

    // Fall back to default quota
    return checkPayloadSize(body, endpoint, method);
  }

  /**
   * Check if response data is within the allowed size limit.
   * Checks custom limits first, then falls back to default quotas.
   *
   * @param data - The response data
   * @param endpoint - The API endpoint path
   * @returns PayloadCheckResult with allowed flag and error details
   */
  checkResponse(data: unknown, endpoint: string): PayloadCheckResult {
    const size = getResponseSize(data);
    const normalizedEndpoint = endpoint.toLowerCase();

    // Check custom limits first
    for (const [pattern, limit] of this.customResponseLimits) {
      try {
        if (new RegExp(pattern, 'i').test(normalizedEndpoint)) {
          if (size > limit) {
            return {
              allowed: false,
              size,
              limit,
              error: `Response exceeds custom ${formatBytes(limit)} limit for ${endpoint}`,
            };
          }
          return { allowed: true, size, limit };
        }
      } catch {
        // Invalid regex — skip
      }
    }

    // Fall back to default quota
    return checkResponseSize(data, endpoint);
  }
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Format a byte count into a human-readable string.
 *
 * @param bytes - The byte count to format
 * @returns Human-readable string (e.g., "5 MB", "100 KB", "512 B")
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** Default singleton instance for quick use without instantiation. */
export const defaultQuota = new PayloadQuota();
