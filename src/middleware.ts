// =============================================================================
// StoreCraft AI — Security Middleware (Next.js Middleware)
// =============================================================================
// Global middleware applied to all routes providing:
// 1. Content Security Policy (CSP) with Report-Only strict mode
// 2. CORS configuration with Vary: Origin support
// 3. CSRF protection (Double-Submit Cookie pattern — logging only until auth)
// 4. Request ID tracking (X-Request-ID)
// 5. Payload size pre-check (reject oversized requests early)
// 6. Bot / malicious request detection (XSS, SQLi, SSRF, Log4j, path traversal)
// 7. Structured security logging for blocked requests
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Configuration
// =============================================================================

/** Allowed origins for CORS. Defaults to wildcard in development. */
const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

/** How long browsers should cache CORS preflight results (24 hours). */
const CORS_MAX_AGE = 86400;

/** Maximum payload size in bytes for general requests (50 MB). */
const MAX_PAYLOAD_OVERALL = 50 * 1024 * 1024;

/** Maximum payload size in bytes for /api/ routes (5 MB). */
const MAX_PAYLOAD_API = 5 * 1024 * 1024;

/** Maximum payload size in bytes for /api/voice/ routes (10 MB). */
const MAX_PAYLOAD_VOICE = 10 * 1024 * 1024;

/** Paths that require CSRF protection on mutating methods. */
const CSRF_PROTECTED_PATHS = ['/api/'];

/** Mutating HTTP methods that trigger CSRF validation. */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/** User-agent substrings that are known malicious scanners/tools. */
const BLOCKED_USER_AGENTS = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'dirbuster',
  'gobuster',
  'ffuf',
  'wfuzz',
  'hydra',
  'burpsuite',
  'zap',
  'arachni',
  'w3af',
  'acunetix',
  'nessus',
  'openvas',
  'qualys',
];

// =============================================================================
// CSP Directives
// =============================================================================

/**
 * Build the Content-Security-Policy header value.
 * Uses 'unsafe-inline' and 'unsafe-eval' as fallback since Next.js server
 * components may inject scripts that we can't nonce from middleware.
 */
function getContentSecurityPolicy(): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https: http:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ws: wss: https: http:`,
    `frame-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

/**
 * Build a strict Content-Security-Policy-Report-Only header.
 * This enforces a policy WITHOUT 'unsafe-inline' / 'unsafe-eval' in
 * report-only mode, so developers can see violations in the console
 * without breaking the application.
 */
function getStrictCspReportOnly(): string {
  return [
    `default-src 'self'`,
    `script-src 'self' https://cdn.socket.io`,
    `style-src 'self' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https: http:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ws: wss: https: http:`,
    `frame-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
    `report-uri /api/csp-report`,
  ].join('; ');
}

// =============================================================================
// Security Headers
// =============================================================================

/**
 * Build standard security headers applied to every response.
 */
function getSecurityHeaders(request: NextRequest): Record<string, string> {
  const requestId = crypto.randomUUID();
  const startTime = parseInt(request.headers.get('x-start-time') || '0', 10);

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': getContentSecurityPolicy(),
    'Content-Security-Policy-Report-Only': getStrictCspReportOnly(),
    'X-Request-ID': requestId,
    'X-Response-Time': `${Date.now() - startTime}ms`,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// =============================================================================
// Security Logging
// =============================================================================

/**
 * Log a security event as structured JSON.
 * Safe to call from any context — never throws.
 *
 * @param level - Severity level ('info', 'warn', 'error')
 * @param reason - Why the event occurred
 * @param request - The incoming request for context
 * @param extra - Additional key-value pairs to include in the log
 */
export function securityLog(
  level: 'info' | 'warn' | 'error',
  reason: string,
  request: NextRequest,
  extra?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    reason,
    method: request.method,
    path: request.nextUrl.pathname,
    search: request.nextUrl.search || undefined,
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    requestId: request.headers.get('x-request-id') || undefined,
    ...extra,
  };

  const json = JSON.stringify(entry);
  if (level === 'error') {
    console.error(`[SECURITY] ${json}`);
  } else if (level === 'warn') {
    console.warn(`[SECURITY] ${json}`);
  } else {
    console.log(`[SECURITY] ${json}`);
  }
}

// =============================================================================
// CORS Handling
// =============================================================================

/**
 * Handle CORS preflight and origin validation.
 * Returns a NextResponse if the request should be handled (preflight response
 * or origin rejection), or null to continue processing.
 */
function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin') || '';

  // If allowlist is not wildcard, validate the origin
  if (ALLOWED_ORIGINS[0] !== '*' && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID, X-CSRF-Token'
    );
    response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Remaining, X-RateLimit-Reset');
    response.headers.set('Access-Control-Max-Age', CORS_MAX_AGE.toString());
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
    return response;
  }

  return null; // Not a preflight — continue
}

// =============================================================================
// CSRF Protection (Double-Submit Cookie)
// =============================================================================

/**
 * Generate a CSRF token using crypto.
 */
function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate CSRF protection using the Double-Submit Cookie pattern.
 *
 * Since there is no authentication system yet, this implementation:
 * - Sets a `csrf_token` cookie on GET requests
 * - Logs warnings on POST/PUT/PATCH/DELETE to /api/ if token is missing/mismatched
 * - Does NOT block requests (that will be enabled once auth is in place)
 *
 * Once auth is configured, change `enforce: true` to block mismatched requests.
 */
function handleCsrf(request: NextRequest, response: NextResponse): NextResponse | null {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Check if this path needs CSRF protection (exclude auth routes)
  const needsProtection =
    CSRF_PROTECTED_PATHS.some((p) => path.startsWith(p)) &&
    !path.startsWith('/api/auth') &&
    !path.startsWith('/api/csp-report') &&
    !path.startsWith('/api/health') &&
    !path.startsWith('/api/analytics/track') &&
    CSRF_PROTECTED_METHODS.includes(method);

  if (needsProtection) {
    const cookieToken = request.cookies.get('csrf_token')?.value;
    const headerToken = request.headers.get('X-CSRF-Token');

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      securityLog(
        'warn',
        'CSRF token missing or mismatched — request blocked',
        request,
        {
          hasCookieToken: !!cookieToken,
          hasHeaderToken: !!headerToken,
          tokensMatch: cookieToken === headerToken,
        }
      );
      return new NextResponse(
        JSON.stringify({ success: false, error: { code: 'CSRF_INVALID', message: 'CSRF token invalid or missing' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } else if (method === 'GET' && path.startsWith('/')) {
    // Set CSRF cookie on GET requests so the client can read it
    const existingToken = request.cookies.get('csrf_token')?.value;
    const token = existingToken || generateCsrfToken();
    response.cookies.set('csrf_token', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400, // 24 hours
    });
  }

  return null;
}

// =============================================================================
// Payload Size Pre-Check
// =============================================================================

/**
 * Reject requests with Content-Length exceeding configured limits.
 * This prevents the body parser from consuming oversized payloads.
 */
function checkPayloadSize(request: NextRequest): NextResponse | null {
  const contentLength = request.headers.get('content-length');

  // No content-length header — skip check (e.g., GET, chunked encoding)
  if (!contentLength) return null;

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return null;

  const path = request.nextUrl.pathname;

  // Determine the limit based on path
  let limit = MAX_PAYLOAD_OVERALL;
  if (path.startsWith('/api/voice/')) {
    limit = MAX_PAYLOAD_VOICE;
  } else if (path.startsWith('/api/')) {
    limit = MAX_PAYLOAD_API;
  }

  if (size > limit) {
    securityLog('warn', `Payload too large: ${size} bytes (limit: ${limit})`, request, {
      contentLength: size,
      limit,
    });
    return new NextResponse(
      JSON.stringify({
        error: `Payload too large. Maximum allowed size is ${Math.round(limit / 1024 / 1024)}MB for this endpoint.`,
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return null;
}

// =============================================================================
// Bot Detection & Malicious Request Filtering
// =============================================================================

/** Patterns that indicate malicious or bot-like requests. */
const MALICIOUS_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  // Path traversal
  { name: 'path_traversal', pattern: /(\.\.[\\/])/ },
  // XSS in URL
  { name: 'xss_in_url', pattern: /(<script|javascript\s*:|on\w+\s*=|<img\s+src\s*=\s*["']?javascript)/i },
  // SQL injection
  { name: 'sql_injection', pattern: /(\b(union\s+(all\s+)?select|select\s+.+\s+from|insert\s+into|drop\s+table|delete\s+from|update\s+.+\s+set)\b)/i },
  // System file access
  { name: 'system_file_access', pattern: /(\/etc\/(passwd|shadow|hosts)|\/proc\/(self|version|cpuinfo)|\/dev\/null|\/var\/log)/ },
  // Common CMS attack paths
  { name: 'cms_probing', pattern: /\/(admin|wp-|wp-admin|wp-login|phpmyadmin|phpmy|xmlrpc|\.env|\.git|\.svn|\.htaccess|config\.php|web\.config)/i },
  // Log4j exploit attempt
  { name: 'log4j_exploit', pattern: /\$\{jndi:(ldap|rmi|dns|nio|iiop|corba)/i },
  // SSRF attempt in query params
  { name: 'ssrf_attempt', pattern: /[?&](url|uri|redirect|next|return|target|continue|goto)=https?:\/\/(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|localhost|\[::1\])/i },
  // Shell injection
  { name: 'shell_injection', pattern: /[;&|`$](\s*(cat|ls|id|whoami|uname|pwd|wget|curl|nc|bash|sh|python|perl|ruby|php)\b)/i },
  // LDAP injection
  { name: 'ldap_injection', pattern: /\*\)|[()=].*(cn|uid|dn|ou|dc|sn|mail)=/i },
  // Prototype pollution attempt
  { name: 'prototype_pollution', pattern: /(__proto__|constructor\.prototype|Object\.assign.*__proto__)/i },
];

/**
 * Check if a request appears to be from a malicious bot or contains attack patterns.
 * Returns the reason string if blocked, or null if the request looks legitimate.
 */
function detectMaliciousRequest(request: NextRequest): string | null {
  const userAgent = request.headers.get('user-agent') || '';
  const lowerUA = userAgent.toLowerCase();

  // Check known malicious user agents
  for (const bot of BLOCKED_USER_AGENTS) {
    if (lowerUA.includes(bot)) {
      return `Blocked user agent: ${bot}`;
    }
  }

  // Check path and query string against malicious patterns
  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  for (const { name, pattern } of MALICIOUS_PATTERNS) {
    if (pattern.test(path) || pattern.test(search)) {
      return `Malicious pattern detected: ${name}`;
    }
  }

  return null; // Request appears legitimate
}

// =============================================================================
// Middleware Entry Point
// =============================================================================

/**
 * Main Next.js middleware function.
 * Applies security checks, headers, CORS, CSRF, and payload validation
 * to every matching request.
 */
export function middleware(request: NextRequest) {
  // --- Inject start time for response time tracking ---
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-start-time', Date.now().toString());

  // =========================================================================
  // 1. Bot / Malicious Request Detection
  // =========================================================================
  const maliciousReason = detectMaliciousRequest(request);
  if (maliciousReason) {
    securityLog('error', maliciousReason, request, { action: 'blocked' });
    return new NextResponse('Blocked: Suspicious request detected', { status: 403 });
  }

  // =========================================================================
  // 2. Payload Size Pre-Check
  // =========================================================================
  const payloadResponse = checkPayloadSize(request);
  if (payloadResponse) return payloadResponse;

  // =========================================================================
  // 3. CORS Handling
  // =========================================================================
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // =========================================================================
  // 3.5. API Route Authentication (session cookie check)
  // =========================================================================
  const PROTECTED_API_PATHS = [
    '/api/storefronts',
    '/api/analytics',
    '/api/bi',
    '/api/pipeline',
    '/api/deploy',
    '/api/chat',
    '/api/generate',
    '/api/voice',
    '/api/templates',
    '/api/extract-profile',
  ];
  // Public API paths that do NOT require authentication
  // /api/auth, /api/health, /api/csp-report, /api/demo, /api/ws-token, /api/analytics/track
  const path = request.nextUrl.pathname;
  const isProtectedApi = PROTECTED_API_PATHS.some((p) => path.startsWith(p));
  // Exclude the public analytics tracking endpoint
  const isPublicTrack = path.startsWith('/api/analytics/track');

  if (isProtectedApi && !isPublicTrack) {
    // Check for NextAuth session cookie (works in both dev and prod)
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      securityLog('warn', 'Unauthenticated API access blocked', request, {
        action: 'auth_blocked',
      });
      return new NextResponse(
        JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // =========================================================================
  // 4. Build Response with Security Headers
  // =========================================================================
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const securityHeaders = getSecurityHeaders(request);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // =========================================================================
  // 5. Add CORS Headers to API Responses
  // =========================================================================
  const origin = request.headers.get('origin');
  if (request.nextUrl.pathname.startsWith('/api/') && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Request-ID, X-CSRF-Token'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', 'X-Request-ID, X-RateLimit-Remaining, X-RateLimit-Reset');
    response.headers.set('Vary', 'Origin');
  }

  // =========================================================================
  // 6. CSRF Protection (Double-Submit Cookie)
  // =========================================================================
  const csrfResponse = handleCsrf(request, response);
  if (csrfResponse) return csrfResponse;

  return response;
}

// =============================================================================
// Middleware Config
// =============================================================================

/**
 * Matcher configuration — applies middleware to all paths except:
 * - Next.js static assets (_next/static, _next/image)
 * - Favicon and icon files
 * - OpenGraph images
 * - robots.txt and sitemap.xml
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon-|apple-icon-|opengraph-|robots.txt|sitemap.xml).*)',
  ],
};
