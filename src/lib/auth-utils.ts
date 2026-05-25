// =============================================================================
// Server-Side Auth Utilities
// =============================================================================
// Use these in API routes and Server Components to access the authenticated user.
//
// - getAuthSession() — get session (null if not authenticated)
// - requireAuth() — get session (throws 401 if not authenticated)
// - getCurrentUser() — get the full user record from DB
// - withAuth(handler) — HOC for API routes that require auth
// - optionalAuth(handler) — HOC for API routes where auth is optional
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { errorHandler, AuthenticationError } from '@/lib/errors';

// -----------------------------------------------------------------------------
// Session Access
// -----------------------------------------------------------------------------

/**
 * Get the current auth session (server-side).
 * Returns null if the user is not authenticated.
 *
 * @example
 * ```ts
 * const session = await getAuthSession();
 * if (!session) return redirect('/auth/signin');
 * const userId = session.user.id;
 * ```
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current auth session, throwing if not authenticated.
 * Use in API routes that require login.
 *
 * @example
 * ```ts
 * try {
 *   const session = await requireAuth();
 *   const userId = session.user.id;
 * } catch (err) {
 *   return errorHandler(err, request);
 * }
 * ```
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required. Please sign in to continue.');
  }

  return session;
}

// -----------------------------------------------------------------------------
// User Access
// -----------------------------------------------------------------------------

/**
 * Get the current authenticated user from the database.
 * Returns null if not authenticated or user not found.
 */
export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) return null;

  try {
    return db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// API Route HOCs (Higher-Order Components)
// -----------------------------------------------------------------------------

type AuthenticatedHandler = (
  request: NextRequest,
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with authentication requirement.
 * The session is passed as the second argument to the handler.
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (request, session) => {
 *   const userId = session.user.id;
 *   // ... your logic
 *   return success({ data });
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await requireAuth();
      return handler(request, session);
    } catch (err) {
      return errorHandler(err, request);
    }
  };
}

type OptionalAuthHandler = (
  request: NextRequest,
  session: Awaited<ReturnType<typeof getServerSession>> | null
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with optional authentication.
 * The session (or null) is passed as the second argument.
 *
 * @example
 * ```ts
 * export const GET = withOptionalAuth(async (request, session) => {
 *   if (session) {
 *     // Authenticated — show user-specific data
 *   } else {
 *     // Anonymous — show public data
 *   }
 *   return success({ data });
 * });
 * ```
 */
export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getAuthSession();
      return handler(request, session);
    } catch (err) {
      return errorHandler(err, request);
    }
  };
}
