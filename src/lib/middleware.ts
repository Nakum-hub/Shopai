// =============================================================================
// Security Middleware (Next.js middleware.ts)
// =============================================================================
// Global security middleware applied to all routes:
// - Content Security Policy (CSP)
// - CORS configuration
// - Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
// - Request logging and anomaly detection
// - Path-based access control
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

const CORS_MAX_AGE = 86400; // 24 hours

const SENSITIVE_PATHS = ['/api/', '/admin/'];
const BLOCKED_USER_AGENTS = ['sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster'];

// -----------------------------------------------------------------------------
// CSP Directives
// -----------------------------------------------------------------------------

function getContentSecurityPolicy(nonce?: string): string {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}'`
    : `'self' 'unsafe-inline' 'unsafe-eval'`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc} https://cdn.socket.io`,
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

// -----------------------------------------------------------------------------
// Security Headers
// -----------------------------------------------------------------------------

function getSecurityHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': getContentSecurityPolicy(),
    'X-Request-ID': crypto.randomUUID(),
    'X-Response-Time': `${Date.now() - parseInt(request.headers.get('x-start-time') || '0')}ms`,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  return headers;
}

// -----------------------------------------------------------------------------
// CORS Handling
// -----------------------------------------------------------------------------

function handleCors(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin') || '';

  // Check if origin is allowed
  if (ALLOWED_ORIGINS[0] !== '*' && !ALLOWED_ORIGINS.includes(origin)) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }

  // Handle preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    response.headers.set('Access-Control-Max-Age', CORS_MAX_AGE.toString());
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
  }

  return null; // Not a CORS preflight — continue processing
}

// -----------------------------------------------------------------------------
// Bot Detection
// -----------------------------------------------------------------------------

function isMaliciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const lowerUA = userAgent.toLowerCase();

  // Known malicious user agents
  for (const bot of BLOCKED_USER_AGENTS) {
    if (lowerUA.includes(bot)) return true;
  }

  // Suspicious path patterns
  const path = request.nextUrl.pathname;
  const suspiciousPatterns = [
    /(\.\.\/|\.\.\\)/,         // Path traversal
    /(<script|javascript:)/i,   // XSS in URL
    /(union\s+select)/i,       // SQL injection
    /(\/etc\/passwd|\/proc\/)/, // System file access
    /(admin|wp-|phpmy)/i,      // Common attack paths
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path) || pattern.test(request.nextUrl.search)) {
      return true;
    }
  }

  return false;
}

// -----------------------------------------------------------------------------
// Middleware Entry Point
// -----------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  // Add start time for response time tracking
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-start-time', Date.now().toString());

  // 1. Bot/malicious request detection
  if (isMaliciousRequest(request)) {
    return new NextResponse('Blocked: Suspicious request detected', { status: 403 });
  }

  // 2. CORS handling
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  // 3. Apply security headers to the response
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const securityHeaders = getSecurityHeaders(request);
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // 4. Add CORS headers to all API responses
  const origin = request.headers.get('origin') || '*';
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

// -----------------------------------------------------------------------------
// Middleware Config
// -----------------------------------------------------------------------------

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icon-|apple-icon-|opengraph-|robots.txt|sitemap.xml).*)',
  ],
};
