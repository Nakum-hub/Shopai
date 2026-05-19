import { NextResponse } from 'next/server';
import { allTemplates } from '@/data/templates';

function resolvePreviewUrl(preview: string, category: string): string {
  if (preview.startsWith('/templates/') || preview.startsWith('/')) return preview;
  return '/templates/service-pro.png';
}

// Map category to a real preview image
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  bakery: '/templates/bakery-delight.png',
  restaurant: '/templates/restaurant-elegance.png',
  clothing: '/templates/fashion-forward.png',
  electronics: '/templates/tech-store-pro.png',
  salon: '/templates/beauty-salon.png',
  grocery: '/templates/bakery-delight.png',
  hardware: '/templates/hardware-hub.png',
  medical: '/templates/medical-care.png',
  boutique: '/templates/fashion-forward.png',
  service: '/templates/service-pro.png',
  other: '/templates/service-pro.png',
};

export async function GET() {
  try {
    // Serve all 55+ templates from the data file
    const templates = allTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      preview: resolvePreviewUrl(t.preview, t.category) || CATEGORY_IMAGE_MAP[t.category] || '/templates/service-pro.png',
      sections: t.sections,
      style: t.style,
      popular: t.popular,
      featured: t.featured,
      downloadCount: t.downloadCount,
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[TEMPLATES_GET]', error);
    return NextResponse.json({ templates: [] });
  }
}
