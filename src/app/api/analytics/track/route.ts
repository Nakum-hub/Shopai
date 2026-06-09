import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';

/**
 * POST /api/analytics/track — Public endpoint to track storefront views.
 * No auth required (called from deployed sites via tracking pixel or JS).
 *
 * Body: { storefrontId: string, event?: string }
 * Also accepts GET with ?id=<storefrontId>&e=view for tracking pixel support.
 */
export async function POST(request: NextRequest) {
  const timings = createResponseTimings();

  try {
    const body = await request.json();
    const { storefrontId, event } = body;

    if (!storefrontId || typeof storefrontId !== 'string') {
      return error(new ValidationError('storefrontId is required'), timings.meta());
    }

    await trackEvent(storefrontId, event || 'view');

    return success({ tracked: true }, timings.meta());
  } catch {
    // Silent fail for tracking — never break the user experience
    return success({ tracked: false }, timings.meta());
  }
}

/**
 * GET /api/analytics/track?id=<storefrontId>&e=view
 * Tracking pixel support — returns a 1x1 transparent GIF.
 */
export async function GET(request: NextRequest) {
  const storefrontId = request.nextUrl.searchParams.get('id');
  const event = request.nextUrl.searchParams.get('e') || 'view';

  if (storefrontId) {
    // Fire-and-forget — don't await
    trackEvent(storefrontId, event).catch(() => { /* silent */ });
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new Response(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Expires': '0',
    },
  });
}

/**
 * Upsert a StorefrontAnalytics row for today, incrementing the view counter.
 * Schema uses `date` as String (YYYY-MM-DD) and `totalViews` for the counter.
 */
async function trackEvent(storefrontId: string, event: string) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Verify the storefront exists
  const storefront = await db.storefront.findUnique({
    where: { id: storefrontId },
    select: { id: true },
  });

  if (!storefront) return;

  if (event === 'view') {
    // Upsert daily analytics record (matches schema: date is String, totalViews is Int)
    await db.storefrontAnalytics.upsert({
      where: {
        storefrontId_date: {
          storefrontId,
          date: dateStr,
        },
      },
      create: {
        storefrontId,
        date: dateStr,
        totalViews: 1,
        uniqueVisitors: 1,
        avgDuration: 0,
        bounceRate: 0,
        seoScore: 0,
        performanceScore: 0,
        accessibilityScore: 0,
      },
      update: {
        totalViews: { increment: 1 },
      },
    });

    // Also increment the storefront's total view count
    await db.storefront.update({
      where: { id: storefrontId },
      data: { viewCount: { increment: 1 } },
    });
  }
}
