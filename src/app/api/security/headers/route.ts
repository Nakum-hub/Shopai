import { NextResponse } from 'next/server';

/**
 * Security Headers API
 * Returns security header configuration for the application.
 * These headers are applied to all responses via middleware or layout.
 */

export interface SecurityHeadersConfig {
  'content-security-policy': string;
  'x-content-type-options': string;
  'x-frame-options': string;
  'referrer-policy': string;
  'x-xss-protection': string;
  'permissions-policy': string;
}

/**
 * GET /api/security/headers
 * Returns security header configuration
 */
export async function GET() {
  const headers: SecurityHeadersConfig = {
    // Content Security Policy for the main application
    'content-security-policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://placehold.co https://z-cdn.chatglm.cn blob:",
      "connect-src 'self' ws: wss:",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    // Prevent MIME type sniffing
    'x-content-type-options': 'nosniff',
    // Prevent clickjacking — deny embedding in frames
    'x-frame-options': 'DENY',
    // Control referrer information
    'referrer-policy': 'strict-origin-when-cross-origin',
    // Legacy XSS protection header (still useful for older browsers)
    'x-xss-protection': '1; mode=block',
    // Restrict browser features
    'permissions-policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
    ].join(', '),
  };

  return NextResponse.json({
    success: true,
    headers,
    description: 'Security headers configuration for StoreCraft AI application',
  });
}
