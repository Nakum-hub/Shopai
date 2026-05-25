// =============================================================================
// NextAuth API Route Handler
// =============================================================================
// This is the catch-all route handler for NextAuth.js.
// It handles all authentication-related requests:
// - POST /api/auth/signin (credentials login)
// - POST /api/auth/signup (registration)
// - GET /api/auth/signout
// - GET /api/auth/session
// - GET /api/auth/providers
// - GET /api/auth/csrf
// - GET/POST /api/auth/callback/:provider (Google, Email)
// =============================================================================

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
