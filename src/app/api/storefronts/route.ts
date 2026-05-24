import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validateInput, createStorefrontSchema, updateStorefrontSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { withRequestContext, logger, getCurrentContext } from '@/lib/request-context';
import { success, error, created, noContent, paginated, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, NotFoundError, RateLimitError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
      const offset = (page - 1) * pageSize;

      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (category) where.category = category;

      const [storefronts, total] = await Promise.all([
        db.storefront.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: pageSize,
          skip: offset,
        }),
        db.storefront.count({ where }),
      ]);

      logger.info('[STOREFRONTS_GET] Fetched storefronts', { total, page, pageSize });

      return paginated(storefronts, total, page, pageSize, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const ctx = getCurrentContext();
      const clientIp = ctx?.clientIp || 'unknown';
      const rl = rateLimit(`storefront:${clientIp}`, 60, 60_000);
      if (!rl.allowed) {
        return error(new RateLimitError('Too many requests'), rl.retryAfterMs);
      }

      const body = await request.json();
      const validation = validateInput(createStorefrontSchema, body);
      if (!validation.success) {
        return error(new ValidationError(validation.error), timings.meta());
      }

      const { name, businessName, category, description, html, businessProfile } = validation.data;

      const storefront = await db.storefront.create({
        data: {
          name,
          businessName,
          category: category || 'other',
          description: description || null,
          html: html || '',
          businessProfile: businessProfile ? JSON.stringify(businessProfile) : null,
          status: html ? 'ready' : 'draft',
        },
      });

      logger.info('[STOREFRONTS_POST] Storefront created', { id: storefront.id, name });

      return created(storefront, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const body = await request.json();
      const validation = validateInput(updateStorefrontSchema, body);
      if (!validation.success) {
        return error(new ValidationError(validation.error), timings.meta());
      }

      const { id, ...updates } = validation.data;

      const data: Record<string, unknown> = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.businessName !== undefined) data.businessName = updates.businessName;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.description !== undefined) data.description = updates.description;
      if (updates.html !== undefined) data.html = updates.html;
      if (updates.businessProfile !== undefined) data.businessProfile = JSON.stringify(updates.businessProfile);
      if (updates.deploymentStatus !== undefined) data.deploymentStatus = updates.deploymentStatus;
      if (updates.deploymentUrl !== undefined) data.deploymentUrl = updates.deploymentUrl;
      if (updates.publishedAt !== undefined) data.publishedAt = updates.publishedAt ? new Date(updates.publishedAt) : null;

      if (Object.keys(data).length === 0) {
        return error(new ValidationError('No valid fields to update'), timings.meta());
      }

      try {
        const storefront = await db.storefront.update({
          where: { id },
          data,
        });

        logger.info('[STOREFRONTS_PATCH] Storefront updated', { id });

        return success(storefront, timings.meta());
      } catch {
        return error(new NotFoundError('Storefront not found', id), timings.meta());
      }
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');

      if (!id) {
        return error(new ValidationError('Storefront ID is required'), timings.meta());
      }

      try {
        await db.storefront.delete({ where: { id } });
        logger.info('[STOREFRONTS_DELETE] Storefront deleted', { id });
        return success({ deleted: true, id }, timings.meta());
      } catch {
        return error(new NotFoundError('Storefront not found', id), timings.meta());
      }
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
