import { NextRequest } from 'next/server';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, createResponseTimings } from '@/lib/api-response';

export interface SecurityHeadersConfig {
  'content-security-policy': string;
  'x-content-type-options': string;
  'x-frame-options': string;
  'referrer-policy': string;
  'x-xss-protection': string;
  'permissions-policy': string;
}

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    logger.info('[SECURITY_HEADERS_GET] Returning security headers config');

    const headers: SecurityHeadersConfig = {
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
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-xss-protection': '1; mode=block',
      'permissions-policy': [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
      ].join(', '),
    };

    return success({
      headers,
      description: 'Security headers configuration for StoreCraft AI application',
    }, timings.meta());
  });
}
