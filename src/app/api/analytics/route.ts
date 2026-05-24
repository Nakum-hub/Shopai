import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, analyticsRequestSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { analyticsCache, analyticsKey } from '@/lib/cache';
import { runSandboxValidation } from '@/lib/sandbox';
import { withRequestContext, logger, getCurrentContext } from '@/lib/request-context';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, NotFoundError, RateLimitError } from '@/lib/errors';

// ---------------------------------------------------------------------------
// Helpers: derive topPages from HTML sections
// ---------------------------------------------------------------------------

interface ParsedSection {
  name: string;
  text: string;
}

function extractSectionsFromHtml(html: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    sections.push({ name: 'Home', text: titleMatch[1] });
  }

  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let h2Match: RegExpExecArray | null;
  while ((h2Match = h2Regex.exec(html)) !== null) {
    const raw = h2Match[1].replace(/<[^>]+>/g, '').trim();
    if (raw.length > 0 && raw.length < 80) {
      sections.push({ name: raw, text: raw });
    }
  }

  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let h3Match: RegExpExecArray | null;
  while ((h3Match = h3Regex.exec(html)) !== null) {
    const raw = h3Match[1].replace(/<[^>]+>/g, '').trim();
    if (raw.length > 0 && raw.length < 80) {
      sections.push({ name: raw, text: raw });
    }
  }

  const navRegex = /<nav[\s>][\s\S]*?<\/nav>/gi;
  let navMatch: RegExpExecArray | null;
  while ((navMatch = navRegex.exec(html)) !== null) {
    const linkRegex = /<a[^>]+href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(navMatch[0])) !== null) {
      const raw = linkMatch[1].replace(/<[^>]+>/g, '').trim();
      if (raw.length > 0 && raw.length < 60 && !sections.some(s => s.name === raw)) {
        sections.push({ name: raw, text: raw });
      }
    }
  }

  const seen = new Set<string>();
  return sections.filter(s => {
    const key = s.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTopPages(sections: ParsedSection[], totalViews: number): Array<{ page: string; views: number; percentage: number }> {
  if (sections.length === 0) return [];

  const weights = sections.map((_, i) => {
    if (i === 0) return 1.0;
    return Math.pow(0.55, i);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const rawPercentages = weights.map(w => (w / totalWeight) * 100);
  const rounded = rawPercentages.map(p => Math.round(p));
  const diff = 100 - rounded.reduce((a, b) => a + b, 0);
  rounded[0] += diff;

  return sections.map((section, i) => ({
    page: section.name,
    views: Math.floor(totalViews * rounded[i] / 100),
    percentage: rounded[i],
  }));
}

// ---------------------------------------------------------------------------
// Helpers: derive deviceBreakdown from business category
// ---------------------------------------------------------------------------

const DEVICE_DISTRIBUTION_BY_CATEGORY: Record<string, { mobile: number; desktop: number; tablet: number }> = {
  restaurant:      { mobile: 78, desktop: 15, tablet: 7 },
  'food-beverage':  { mobile: 78, desktop: 15, tablet: 7 },
  retail:          { mobile: 70, desktop: 22, tablet: 8 },
  'e-commerce':    { mobile: 70, desktop: 22, tablet: 8 },
  healthcare:      { mobile: 60, desktop: 30, tablet: 10 },
  education:       { mobile: 55, desktop: 35, tablet: 10 },
  'real-estate':   { mobile: 72, desktop: 20, tablet: 8 },
  'home-services': { mobile: 74, desktop: 18, tablet: 8 },
  fitness:         { mobile: 68, desktop: 24, tablet: 8 },
  technology:      { mobile: 58, desktop: 34, tablet: 8 },
  'professional-services': { mobile: 50, desktop: 40, tablet: 10 },
  'beauty-salon':  { mobile: 76, desktop: 16, tablet: 8 },
  photography:     { mobile: 65, desktop: 27, tablet: 8 },
  automotive:      { mobile: 66, desktop: 26, tablet: 8 },
  legal:           { mobile: 48, desktop: 42, tablet: 10 },
  finance:         { mobile: 52, desktop: 38, tablet: 10 },
  nonprofit:       { mobile: 56, desktop: 34, tablet: 10 },
  portfolio:       { mobile: 64, desktop: 28, tablet: 8 },
  blog:            { mobile: 62, desktop: 30, tablet: 8 },
};

const DEFAULT_DEVICE_DISTRIBUTION = { mobile: 62, desktop: 28, tablet: 10 };

function buildDeviceBreakdown(
  category: string,
  uniqueVisitors: number,
): Array<{ device: string; percentage: number; sessions: number }> {
  const dist = DEVICE_DISTRIBUTION_BY_CATEGORY[category] ?? DEFAULT_DEVICE_DISTRIBUTION;

  return [
    { device: 'Mobile',  percentage: dist.mobile,  sessions: Math.floor(uniqueVisitors * dist.mobile / 100) },
    { device: 'Desktop', percentage: dist.desktop, sessions: Math.floor(uniqueVisitors * dist.desktop / 100) },
    { device: 'Tablet',  percentage: dist.tablet,  sessions: Math.floor(uniqueVisitors * dist.tablet / 100) },
  ];
}

// ---------------------------------------------------------------------------
// Main route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const { searchParams } = new URL(request.url);
      const rawStorefrontId = searchParams.get('storefrontId');
      const rawDays = searchParams.get('days');

      const validation = validateInput(analyticsRequestSchema, {
        storefrontId: rawStorefrontId || '',
        days: rawDays ? parseInt(rawDays, 10) : 30,
      });
      if (!validation.success) {
        return error(new ValidationError(validation.error), timings.meta());
      }

      const { storefrontId, days } = validation.data;

      const ctx = getCurrentContext();
      const clientIp = ctx?.clientIp || 'unknown';
      const rl = rateLimit(`analytics:${clientIp}`, 60, 60_000);
      if (!rl.allowed) {
        return error(new RateLimitError('Too many requests'), rl.retryAfterMs);
      }

      // Use cache for the expensive computation
      const cacheKey = analyticsKey(storefrontId, days);
      const result = await analyticsCache.getOrSet(cacheKey, () => buildAnalyticsResponse(storefrontId, days), 120_000);

      logger.info('[ANALYTICS_GET] Analytics fetched', { storefrontId, days });

      return success(result, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}

// ---------------------------------------------------------------------------
// Analytics response builder (cached)
// ---------------------------------------------------------------------------

async function buildAnalyticsResponse(storefrontId: string, days: number) {
  const storefront = await db.storefront.findUnique({
    where: { id: storefrontId },
    select: {
      status: true,
      createdAt: true,
      publishedAt: true,
      category: true,
      html: true,
      businessProfile: true,
      _count: { select: { pipelineExecutions: true, analytics: true } },
    },
  });

  if (!storefront) {
    throw new NotFoundError('Storefront not found', storefrontId);
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const analyticsRecords = await db.storefrontAnalytics.findMany({
    where: {
      storefrontId,
      date: { gte: startDateStr },
    },
    orderBy: { date: 'asc' },
  });

  const pipelineExecutions = await db.pipelineExecution.findMany({
    where: { storefrontId },
    select: {
      status: true,
      validationScore: true,
      durationMs: true,
      startedAt: true,
    },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  const totalViews = analyticsRecords.reduce((s, r) => s + r.totalViews, 0);
  const uniqueVisitors = analyticsRecords.reduce((s, r) => s + r.uniqueVisitors, 0);
  const avgDuration = analyticsRecords.length > 0
    ? Math.round(analyticsRecords.reduce((s, r) => s + r.avgDuration, 0) / analyticsRecords.length)
    : 0;
  const avgBounceRate = analyticsRecords.length > 0
    ? parseFloat((analyticsRecords.reduce((s, r) => s + r.bounceRate, 0) / analyticsRecords.length).toFixed(1))
    : 0;

  const latestScores = analyticsRecords.length > 0 ? analyticsRecords[analyticsRecords.length - 1] : null;
  const seoScore = latestScores?.seoScore || 0;
  const performanceScore = latestScores?.performanceScore || 0;
  const accessibilityScore = latestScores?.accessibilityScore || 0;

  const dailyViews: Array<{ date: string; views: number; visitors: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const record = analyticsRecords.find(r => r.date === dateStr);
    dailyViews.push({
      date: dateStr,
      views: record?.totalViews || 0,
      visitors: record?.uniqueVisitors || 0,
    });
  }

  const prevStart = new Date(startDate);
  prevStart.setDate(prevStart.getDate() - days);
  const prevStartStr = prevStart.toISOString().split('T')[0];

  const prevRecords = await db.storefrontAnalytics.findMany({
    where: {
      storefrontId,
      date: { gte: prevStartStr, lt: startDateStr },
    },
  });

  const prevViews = prevRecords.reduce((s, r) => s + r.totalViews, 0);
  const prevVisitors = prevRecords.reduce((s, r) => s + r.uniqueVisitors, 0);

  const viewsChange = prevViews > 0 ? ((totalViews - prevViews) / prevViews * 100).toFixed(1) : '0';
  const visitorsChange = prevVisitors > 0 ? ((uniqueVisitors - prevVisitors) / prevVisitors * 100).toFixed(1) : '0';

  const htmlContent = storefront.html || '';
  const sections = extractSectionsFromHtml(htmlContent);
  const topPages = buildTopPages(sections, totalViews);
  const deviceBreakdown = buildDeviceBreakdown(storefront.category, uniqueVisitors);

  const avgValidationScore = pipelineExecutions.length > 0
    ? Math.round(pipelineExecutions.filter(e => e.validationScore !== null).reduce((s, e) => s + (e.validationScore || 0), 0) / Math.max(1, pipelineExecutions.filter(e => e.validationScore !== null).length))
    : 0;
  const avgGenTimeMs = pipelineExecutions.length > 0
    ? Math.round(pipelineExecutions.reduce((s, e) => s + (e.durationMs || 0), 0) / pipelineExecutions.length)
    : 0;

  const sandbox = htmlContent.length > 0 ? runSandboxValidation(htmlContent) : null;

  return {
    analytics: {
      totalViews,
      uniqueVisitors,
      viewsChange,
      visitorsChange,
      avgSessionDuration: avgDuration > 0 ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : '0s',
      bounceRate: avgBounceRate,
      topPages,
      dailyViews,
      deviceBreakdown,
      seoScore,
      performanceScore,
      accessibilityScore,
      generationMetrics: {
        totalExecutions: pipelineExecutions.length,
        successRate: pipelineExecutions.length > 0
          ? ((pipelineExecutions.filter(e => e.status === 'completed').length / pipelineExecutions.length) * 100).toFixed(0)
          : '0',
        avgValidationScore,
        avgGenTimeSeconds: (avgGenTimeMs / 1000).toFixed(1),
      },
      storefrontAge: Math.floor((Date.now() - storefront.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
    },
    sandbox,
  };
}
