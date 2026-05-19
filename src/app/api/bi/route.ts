import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateBIReport } from '@/lib/business-intelligence';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/bi — Business Intelligence API
 *
 * Routes (via query param):
 *   GET /api/bi?storefrontId=xxx           — Full BI report
 *   GET /api/bi?storefrontId=xxx&mode=health   — Health score only
 *   GET /api/bi?storefrontId=xxx&mode=insights — Insights & recommendations only
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storefrontId = searchParams.get('storefrontId');
    const mode = searchParams.get('mode'); // 'health' | 'insights' | undefined (full report)

    if (!storefrontId) {
      return NextResponse.json(
        { error: 'storefrontId query parameter is required' },
        { status: 400 },
      );
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`bi:${clientIp}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Verify storefront exists
    const storefront = await db.storefront.findUnique({
      where: { id: storefrontId },
      select: { id: true },
    });

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront not found' }, { status: 404 });
    }

    // Full report is always generated (needed for all modes)
    const report = await generateBIReport(storefrontId);

    // Mode-based response
    if (mode === 'health') {
      return NextResponse.json({
        healthScore: report.healthScore,
        generatedAt: report.generatedAt,
      });
    }

    if (mode === 'insights') {
      return NextResponse.json({
        insights: report.insights,
        recommendations: report.recommendations,
        summary: report.summary,
        generatedAt: report.generatedAt,
      });
    }

    // Default: full report
    return NextResponse.json(report);
  } catch (error) {
    console.error('[BI_GET]', error);
    const message = error instanceof Error ? error.message : 'Failed to generate BI report';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
