'use server';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { ValidationError, NotFoundError } from '@/lib/errors';
import { errorHandler } from '@/lib/errors';

/**
 * Generate a URL-safe slug from a business name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'my-site';
}

/**
 * POST /api/deploy — Deploy a storefront by saving HTML and generating a slug URL.
 *
 * Body: { storefrontId: string, html: string, businessName?: string }
 * Returns: { success: true, data: { url, slug, storefrontId } }
 */
export async function POST(request: NextRequest) {
  const timings = createResponseTimings();

  try {
    const body = await request.json();
    const { storefrontId, html, businessName } = body;

    if (!storefrontId) {
      return error(new ValidationError('storefrontId is required'), timings.meta());
    }
    if (!html || typeof html !== 'string' || html.length < 10) {
      return error(new ValidationError('html content is required'), timings.meta());
    }

    // Find the storefront
    const storefront = await db.storefront.findUnique({
      where: { id: storefrontId },
    });

    if (!storefront) {
      return error(new NotFoundError('Storefront not found'), timings.meta());
    }

    // Generate slug from business name
    const baseName = businessName || storefront.businessName || 'my-site';
    let slug = generateSlug(baseName);

    // Determine the base URL for the deployed site
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    let deploymentUrl = `${baseUrl}/site/${slug}`;

    // Ensure URL uniqueness by checking existing deployed storefronts
    const existing = await db.storefront.findFirst({
      where: {
        deploymentUrl,
        id: { not: storefrontId },
      },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      deploymentUrl = `${baseUrl}/site/${slug}`;
    }

    // Update the storefront with deployment data
    await db.storefront.update({
      where: { id: storefrontId },
      data: {
        html,
        url: slug, // Store slug in the url field for lookup
        deploymentUrl,
        deploymentStatus: 'deployed',
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return success(
      {
        url: deploymentUrl,
        slug,
        storefrontId,
      },
      timings.meta()
    );
  } catch (err) {
    return errorHandler(err, request);
  }
}
