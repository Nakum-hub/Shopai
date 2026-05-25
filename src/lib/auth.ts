// =============================================================================
// NextAuth Configuration
// =============================================================================
// Production authentication system with:
// 1. Credentials provider (email + password) — always available
// 2. Google OAuth provider — env-gated (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)
// 3. Email magic link provider — env-gated (EMAIL_SERVER)
// 4. Prisma adapter for session/user persistence
// 5. JWT callbacks for tenant isolation (userId in token)
// 6. Custom sign-in/up pages
// =============================================================================

import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { nanoid } from 'nanoid';

// -----------------------------------------------------------------------------
// Type Augmentation
// -----------------------------------------------------------------------------

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: string;
    };
  }
  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  // -------------------------------------------------------------------------
  // Adapter — Prisma persists users, accounts, sessions, verification tokens
  // -------------------------------------------------------------------------
  adapter: PrismaAdapter(db),

  // -------------------------------------------------------------------------
  // Pages — custom sign-in/sign-up/error pages
  // -------------------------------------------------------------------------
  // pages: Using default NextAuth pages (integrated into main app)
  // Custom auth UI is rendered inline via AuthGate component

  // -------------------------------------------------------------------------
  // Session Strategy — JWT for API compatibility, DB for server components
  // -------------------------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // update session every 24 hours
  },

  // -------------------------------------------------------------------------
  // JWT Callbacks — inject userId and role into every token
  // -------------------------------------------------------------------------
  callbacks: {
    async jwt({ token, user, trigger, session }: { token: JWT; user?: NextAuthUser & { role?: string }; trigger?: string; session?: Partial<Session> }) {
      // Initial sign-in: add user data to token
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }

      // Session update (e.g., from client-side update())
      if (trigger === 'update' && session) {
        token.role = (session.user?.role as string) || token.role;
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email || '';
        session.user.name = token.name || '';
        session.user.image = token.picture || null;
      }
      return session;
    },
  },

  // -------------------------------------------------------------------------
  // Events — logging for security audit trail
  // -------------------------------------------------------------------------
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`[AUTH] User signed in: ${user.email} (new: ${isNewUser})`);
    },
    async signOut({ session, token }) {
      console.log(`[AUTH] User signed out: ${token?.email || session?.user?.email}`);
    },
    async createUser({ user }) {
      console.log(`[AUTH] New user created: ${user.email}`);
    },
  },

  // -------------------------------------------------------------------------
  // Providers
  // -------------------------------------------------------------------------
  providers: [
    // -------------------------------------------------------------------------
    // 1. Credentials (email + password) — always available
    // -------------------------------------------------------------------------
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('No account found with this email');
        }

        if (!user.password) {
          throw new Error('This account uses a different sign-in method');
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password');
        }

        return {
          id: user.id,
          email: user.email || '',
          name: user.name || '',
          image: user.image,
          role: user.role,
        };
      },
    }),

    // -------------------------------------------------------------------------
    // 2. Google OAuth — only registered when GOOGLE_CLIENT_ID is configured
    // -------------------------------------------------------------------------
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    // -------------------------------------------------------------------------
    // 3. Email Magic Link — only registered when EMAIL_SERVER is configured
    // -------------------------------------------------------------------------
    ...(process.env.EMAIL_SERVER
      ? [
          EmailProvider({
            server: process.env.EMAIL_SERVER,
            from: process.env.EMAIL_FROM || 'noreply@storecraft.ai',
          }),
        ]
      : []),
  ],

  // -------------------------------------------------------------------------
  // Secret — required in production, fallback allowed in development only
  // -------------------------------------------------------------------------
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[AUTH] NEXTAUTH_SECRET environment variable is required in production. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    console.warn('[AUTH] WARNING: Using fallback NEXTAUTH_SECRET — set a real secret for production');
    return 'storecraft-dev-secret-change-in-production';
  })(),
};

// -----------------------------------------------------------------------------
// Password Utilities (for registration)
// -----------------------------------------------------------------------------

/**
 * Hash a password using bcryptjs.
 * Uses 12 salt rounds for good security/performance balance.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

/**
 * Generate a secure random token.
 */
export function generateToken(): string {
  return nanoid(32);
}

// -----------------------------------------------------------------------------
// User Management Utilities
// -----------------------------------------------------------------------------

/**
 * Create a new user with email + password.
 * Returns the user object or throws on validation failure.
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ id: string; email: string; name: string }> {
  // Check if email is already taken
  const existing = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error('An account with this email already exists');
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const hashedPw = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPw,
      name: data.name || data.email.split('@')[0],
      emailVerified: null, // require email verification later
    },
    select: { id: true, email: true, name: true },
  });

  return {
    id: user.id,
    email: user.email || data.email,
    name: user.name || data.email.split('@')[0],
  };
}

/**
 * Find user by ID.
 */
export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, image: true, role: true, createdAt: true },
  });
}

/**
 * Find user by email.
 */
export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, image: true, role: true, createdAt: true },
  });
}
