import { NextRequest } from 'next/server';

/**
 * POST /api/csp-report — Receives Content-Security-Policy violation reports.
 *
 * Browsers send CSP violation reports here when the CSP-Report-Only header
 * is configured with `report-uri /api/csp-report`.
 *
 * Currently logs to console. Can be extended to store in DB for monitoring.
 */
export async function POST(request: NextRequest) {
  try {
    const report = await request.json();
    console.warn('[CSP_VIOLATION]', JSON.stringify(report));
  } catch {
    // Malformed report — ignore silently
  }

  return new Response(null, { status: 204 });
}
