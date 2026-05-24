import { NextRequest } from 'next/server';
import { allTemplates } from '@/data/templates';
import { withRequestContext, logger } from '@/lib/request-context';
import { success, error, withCache, createResponseTimings } from '@/lib/api-response';
import { errorHandler, InternalError } from '@/lib/errors';

function resolvePreviewUrl(preview: string, category: string): string {
  if (preview.startsWith('/templates/') || preview.startsWith('/')) return preview;
  return '/templates/service-pro.jpg';
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  bakery: '/templates/bakery-delight.jpg',
  restaurant: '/templates/restaurant-elegance.jpg',
  clothing: '/templates/fashion-forward.jpg',
  electronics: '/templates/tech-store-pro.jpg',
  salon: '/templates/beauty-salon.jpg',
  grocery: '/templates/bakery-delight.jpg',
  hardware: '/templates/hardware-hub.jpg',
  medical: '/templates/medical-care.jpg',
  boutique: '/templates/fashion-forward.jpg',
  service: '/templates/service-pro.jpg',
  other: '/templates/service-pro.jpg',
};

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      logger.info('[TEMPLATES_GET] Fetching templates');

      const templates = allTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        preview: resolvePreviewUrl(t.preview, t.category) || CATEGORY_IMAGE_MAP[t.category] || '/templates/service-pro.jpg',
        sections: t.sections,
        style: t.style,
        popular: t.popular,
        featured: t.featured,
        downloadCount: t.downloadCount,
      }));

      const response = success({ templates }, timings.meta());
      return withCache(response, 3600); // Cache for 1 hour
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
