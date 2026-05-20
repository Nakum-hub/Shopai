// =============================================================================
// Tenant / Ownership Isolation Guard
// =============================================================================
//
// TEMPORARY MEASURE — This module provides data ownership enforcement
// until a proper authentication system (NextAuth.js) is implemented.
//
// Currently, isolation is based on `sessionId` (from cookies or headers).
// Once auth is in place, isolation will be based on `userId` from JWT tokens.
//
// DESIGN PRINCIPLES:
// - Every function is defensive — never throws, returns safe defaults
// - Works with either `userId` (future auth) or `sessionId` (current fallback)
// - All data access must pass through ownership checks before returning results
//
// MIGRATION PATH:
// 1. Configure NextAuth.js with proper session handling
// 2. Update `extractAccessorId` to prioritize `userId` from JWT
// 3. Add `userId` column to all data models that currently use `sessionId`
// 4. Update Prisma queries in API routes to use `injectOwnershipFilter`
// 5. Remove `sessionId` fallback once all clients are migrated
// =============================================================================

// =============================================================================
// Types
// =============================================================================

/** A resource that may have ownership fields. */
export interface OwnableResource {
  id?: string;
  userId?: string;
  sessionId?: string;
}

/** Result of a resource access validation. */
export interface AccessValidationResult {
  /** Whether access is allowed */
  allowed: boolean;
  /** Human-readable reason if access is denied */
  reason?: string;
}

// =============================================================================
// TenantGuard Class
// =============================================================================

/**
 * A guard class for enforcing data ownership isolation.
 *
 * Supports two modes of operation:
 * - **Auth mode** (future): Uses `userId` from authenticated JWT tokens
 * - **Session mode** (current): Uses `sessionId` from request cookies/headers
 *
 * The guard automatically detects which mode to use based on the accessor ID
 * prefix (user: or session:) or falls back to checking both fields.
 *
 * @example
 * ```ts
 * const guard = new TenantGuard();
 * const accessorId = guard.extractFromRequest(request);
 * if (!accessorId) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 *
 * const storefront = await db.storefront.findUnique({ where: { id } });
 * if (!guard.checkOwnership(storefront, accessorId)) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 * ```
 */
export class TenantGuard {
  /**
   * Check if a resource belongs to the given accessor.
   * Supports both `userId` and `sessionId` ownership fields.
   *
   * @param resource - The resource to check ownership on
   * @param accessorId - The ID of the accessor (userId or sessionId)
   * @returns True if the accessor owns the resource
   */
  checkOwnership(resource: OwnableResource, accessorId: string): boolean {
    if (!resource || !accessorId) return false;

    // Direct match on userId
    if (resource.userId && resource.userId === accessorId) {
      return true;
    }

    // Direct match on sessionId
    if (resource.sessionId && resource.sessionId === accessorId) {
      return true;
    }

    return false;
  }

  /**
   * Extract an accessor ID from a Request object.
   * Checks (in order):
   * 1. `x-user-id` header (future auth proxy / JWT injection)
   * 2. `x-session-id` header
   * 3. `session_id` cookie
   * 4. `sessionId` cookie
   * 5. `Authorization` header (Bearer token — placeholder for future)
   *
   * @param request - The incoming HTTP request
   * @returns The accessor ID, or null if none found
   */
  extractFromRequest(request: Request): string | null {
    // 1. User ID from header (injected by auth middleware in the future)
    const userId = request.headers.get('x-user-id');
    if (userId && userId.trim().length > 0) {
      return userId.trim();
    }

    // 2. Session ID from header
    const headerSessionId = request.headers.get('x-session-id');
    if (headerSessionId && headerSessionId.trim().length > 0) {
      return headerSessionId.trim();
    }

    // 3. Session ID from cookie
    // Note: In Next.js API routes, use `request.cookies.get()`
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);

    const sessionCookie = cookies['session_id'] || cookies['sessionId'];
    if (sessionCookie) {
      return sessionCookie;
    }

    // 4. Authorization Bearer token placeholder
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // In the future, this will verify the JWT and extract userId
      // For now, return null — the token system is not yet in place
      return null;
    }

    return null;
  }
}

// =============================================================================
// Standalone Functions
// =============================================================================

/**
 * Check if a resource belongs to the given accessor ID.
 * Defensive — never throws. Returns false for null/undefined inputs.
 *
 * @param resource - The resource with optional userId/sessionId fields
 * @param accessorId - The ID of the accessor attempting access
 * @returns True if the accessor owns or created the resource
 */
export function requireOwnership<T extends OwnableResource>(
  resource: T,
  accessorId: string
): boolean {
  try {
    if (!resource || !accessorId) return false;

    if (resource.userId && resource.userId === accessorId) return true;
    if (resource.sessionId && resource.sessionId === accessorId) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Filter an array of resources to only include those owned by the accessor.
 * Defensive — never throws. Returns empty array on invalid inputs.
 *
 * @param resources - Array of resources with ownership fields
 * @param accessorId - The ID of the accessor
 * @returns Filtered array containing only owned resources
 */
export function filterByOwnership<T extends OwnableResource>(
  resources: T[],
  accessorId: string
): T[] {
  try {
    if (!Array.isArray(resources) || !accessorId) return [];

    return resources.filter((resource) => {
      if (!resource) return false;
      return (
        resource.userId === accessorId ||
        resource.sessionId === accessorId
      );
    });
  } catch {
    return [];
  }
}

/**
 * Inject ownership filtering into a Prisma query object.
 * Adds a WHERE clause that restricts results to the accessor's resources.
 *
 * Supports queries that target models with either `userId` or `sessionId` fields.
 * If both fields exist on the model, creates an OR condition.
 *
 * @param query - A Prisma query object (e.g., `{ where: { ... } }`)
 * @param accessorId - The ID of the accessor
 * @returns The modified query with ownership WHERE clause
 *
 * @example
 * ```ts
 * const query = { where: { status: 'published' } };
 * const filteredQuery = injectOwnershipFilter(query, sessionId);
 * const storefronts = await db.storefront.findMany(filteredQuery);
 * ```
 */
export function injectOwnershipFilter(
  query: Record<string, unknown> & { where?: Record<string, unknown> },
  accessorId: string
): Record<string, unknown> & { where?: Record<string, unknown> } {
  try {
    if (!query || !accessorId) return query;

    const ownershipClause = {
      OR: [
        { userId: accessorId },
        { sessionId: accessorId },
      ],
    };

    // Clone the query to avoid mutating the original
    const modified: Record<string, unknown> = { ...query };

    if (query.where && typeof query.where === 'object') {
      const existingWhere = query.where as Record<string, unknown>;
      modified.where = {
        ...existingWhere,
        AND: [
          ...(Array.isArray(existingWhere.AND)
            ? (existingWhere.AND as unknown[])
            : []),
          ownershipClause,
        ],
      };
    } else {
      modified.where = ownershipClause;
    }

    return modified as Record<string, unknown> & { where?: Record<string, unknown> };
  } catch {
    return query;
  }
}

/**
 * Extract an accessor ID (userId or sessionId) from a Request object.
 * This is a standalone version of `TenantGuard.extractFromRequest()`.
 *
 * Checks headers and cookies in priority order:
 * 1. `x-user-id` header
 * 2. `x-session-id` header
 * 3. `session_id` / `sessionId` cookies
 * 4. `Authorization` Bearer token (placeholder)
 *
 * @param request - The incoming HTTP request
 * @returns The accessor ID string, or null if none found
 */
export function extractAccessorId(request: Request): string | null {
  try {
    const guard = new TenantGuard();
    return guard.extractFromRequest(request);
  } catch {
    return null;
  }
}

/**
 * Validate whether an accessor has access to a given resource.
 * Provides detailed reason when access is denied.
 *
 * @param resource - The resource to validate access to
 * @param accessorId - The ID of the accessor
 * @param requireOwner - If true, the accessor must be the owner; if false, any authenticated user can access
 * @returns Access validation result with allowed flag and optional reason
 *
 * @example
 * ```ts
 * const result = validateResourceAccess(storefront, sessionId, true);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: result.reason }, { status: 403 });
 * }
 * ```
 */
export function validateResourceAccess(
  resource: { userId?: string; sessionId?: string },
  accessorId: string,
  requireOwner: boolean
): AccessValidationResult {
  try {
    if (!accessorId) {
      return {
        allowed: false,
        reason: 'No accessor ID provided — user is not authenticated',
      };
    }

    if (!resource) {
      return {
        allowed: false,
        reason: 'Resource does not exist',
      };
    }

    // If ownership is not required, any authenticated user can access
    if (!requireOwner) {
      return { allowed: true };
    }

    // Check ownership
    const isOwner =
      (resource.userId && resource.userId === accessorId) ||
      (resource.sessionId && resource.sessionId === accessorId);

    if (!isOwner) {
      return {
        allowed: false,
        reason: 'You do not have permission to access this resource',
      };
    }

    return { allowed: true };
  } catch {
    return {
      allowed: false,
      reason: 'Unexpected error during access validation',
    };
  }
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Parse a cookie header string into a key-value object.
 * Simple implementation — does not handle all edge cases (escaped values, etc.)
 * but is sufficient for extracting session identifiers.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    cookies[key] = value;
  }

  return cookies;
}
