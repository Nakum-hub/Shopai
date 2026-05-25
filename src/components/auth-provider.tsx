'use client';

// =============================================================================
// Auth Provider — wraps the app with NextAuth SessionProvider
// =============================================================================
// Must be placed inside the <body> tag in layout.tsx.
// Provides session state to all client components via useSession() hook.
// =============================================================================

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <NextAuthSessionProvider
      // Refetch session every 5 minutes to stay fresh
      refetchInterval={5 * 60 * 1000}
      // Refetch on window focus
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
