import { NextResponse } from 'next/server';
import { allTemplates } from '@/data/templates';

function resolvePreviewUrl(preview: string, category: string): string {
  if (preview.startsWith('/templates/') || preview.startsWith('/')) return preview;
  return '/templates/service-pro.jpg';
}

// Map category to a real preview image
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

export async function GET() {
  try {
    // Serve all 55+ templates from the data file
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

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[TEMPLATES_GET]', error);
    return NextResponse.json({ templates: [] });
  }
}
