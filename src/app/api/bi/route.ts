import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateBIReport } from '@/lib/business-intelligence';
import { rateLimit } from '@/lib/rate-limit';
import { withRequestContext, logger, getCurrentContext } from '@/lib/request-context';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, NotFoundError, RateLimitError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      logger.info('[BI_GET] Generating BI report');

      const { searchParams } = new URL(request.url);
      const storefrontId = searchParams.get('storefrontId');
      const mode = searchParams.get('mode');

      if (!storefrontId) {
        return error(new ValidationError('storefrontId query parameter is required'), timings.meta());
      }

      const ctx = getCurrentContext();
      const clientIp = ctx?.clientIp || 'unknown';
      const rl = rateLimit(`bi:${clientIp}`, 30, 60_000);
      if (!rl.allowed) {
        return error(new RateLimitError('Too many requests', rl.retryAfterMs), timings.meta());
      }

      const storefront = await db.storefront.findUnique({
        where: { id: storefrontId },
        select: { id: true },
      });

      if (!storefront) {
        return error(new NotFoundError('Storefront not found', storefrontId), timings.meta());
      }

      const report = await generateBIReport(storefrontId);

      if (mode === 'health') {
        logger.info('[BI_GET] Health score returned', { storefrontId });
        return success({
          healthScore: report.healthScore,
          generatedAt: report.generatedAt,
        }, timings.meta());
      }

      if (mode === 'insights') {
        logger.info('[BI_GET] Insights returned', { storefrontId });
        return success({
          insights: report.insights,
          recommendations: report.recommendations,
          summary: report.summary,
          generatedAt: report.generatedAt,
        }, timings.meta());
      }

      logger.info('[BI_GET] Full BI report returned', { storefrontId });
      return success(report, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
