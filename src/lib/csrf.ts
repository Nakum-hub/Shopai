/**
 * Read the CSRF token from the csrf_token cookie.
 * The middleware sets this cookie on GET requests with httpOnly: false
 * so JavaScript can read it.
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Wrapper around fetch that automatically includes the CSRF token header
 * for mutating requests (POST, PUT, PATCH, DELETE).
 *
 * Usage: import { csrfFetch } from '@/lib/csrf';
 *        csrfFetch('/api/storefronts', { method: 'POST', body: ... })
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutating) {
    const csrfToken = getCsrfToken();
    const headers = new Headers(init?.headers);

    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    return fetch(input, { ...init, headers });
  }

  return fetch(input, init);
}
