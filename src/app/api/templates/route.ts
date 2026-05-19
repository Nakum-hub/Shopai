import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Template section type definition matching frontend Template type
interface TemplateSection {
  id: string;
  type: string;
  title: string;
  content: string;
  order: number;
  visible: boolean;
  config: Record<string, unknown>;
}

// Professional templates with real preview images and proper section objects
const MOCK_TEMPLATES = [
  {
    id: 'tmpl-1',
    name: 'Bakery Delight',
    description:
      'A warm, inviting template perfect for artisan bakeries, pastry shops, and cafes. Features golden gradients and cozy aesthetics that make your baked goods shine online.',
    category: 'bakery',
    preview: '/templates/bakery-delight.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Welcome', content: 'Hero banner with bakery image', order: 0, visible: true, config: {} },
      { id: 's2', type: 'about', title: 'Our Story', content: 'About the bakery', order: 1, visible: true, config: {} },
      { id: 's3', type: 'products', title: 'Our Menu', content: 'Product showcase', order: 2, visible: true, config: {} },
      { id: 's4', type: 'gallery', title: 'Gallery', content: 'Photo gallery', order: 3, visible: true, config: {} },
      { id: 's5', type: 'contact', title: 'Visit Us', content: 'Contact information', order: 4, visible: true, config: {} },
    ],
    style: { primaryColor: '#d97706', secondaryColor: '#f59e0b', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'warm' },
    popular: true,
    featured: true,
    downloadCount: 2847,
  },
  {
    id: 'tmpl-2',
    name: 'Restaurant Elegance',
    description:
      'A dark, luxurious template designed for fine dining restaurants, bistros, and upscale eateries. Rich typography and moody visuals create an unforgettable dining experience.',
    category: 'restaurant',
    preview: '/templates/restaurant-elegance.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Welcome', content: 'Restaurant hero', order: 0, visible: true, config: {} },
      { id: 's2', type: 'about', title: 'Our Philosophy', content: 'About us', order: 1, visible: true, config: {} },
      { id: 's3', type: 'products', title: 'Menu', content: 'Full menu', order: 2, visible: true, config: {} },
      { id: 's4', type: 'testimonials', title: 'Reviews', content: 'Customer reviews', order: 3, visible: true, config: {} },
      { id: 's5', type: 'hours', title: 'Hours', content: 'Operating hours', order: 4, visible: true, config: {} },
      { id: 's6', type: 'contact', title: 'Reservations', content: 'Contact', order: 5, visible: true, config: {} },
    ],
    style: { primaryColor: '#78350f', secondaryColor: '#d97706', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'luxurious' },
    popular: true,
    featured: false,
    downloadCount: 3521,
  },
  {
    id: 'tmpl-3',
    name: 'Fashion Forward',
    description:
      'A modern, minimal template for clothing brands, boutiques, and fashion retailers. Clean lines and sophisticated layouts let your collection speak for itself.',
    category: 'clothing',
    preview: '/templates/fashion-forward.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Collection', content: 'Hero banner', order: 0, visible: true, config: {} },
      { id: 's2', type: 'products', title: 'Shop', content: 'Product grid', order: 1, visible: true, config: {} },
      { id: 's3', type: 'about', title: 'Brand Story', content: 'About us', order: 2, visible: true, config: {} },
      { id: 's4', type: 'gallery', title: 'Lookbook', content: 'Fashion gallery', order: 3, visible: true, config: {} },
      { id: 's5', type: 'contact', title: 'Contact', content: 'Get in touch', order: 4, visible: true, config: {} },
    ],
    style: { primaryColor: '#171717', secondaryColor: '#a3a3a3', fontFamily: 'Inter', theme: 'minimal', mood: 'sophisticated' },
    popular: true,
    featured: false,
    downloadCount: 4102,
  },
  {
    id: 'tmpl-4',
    name: 'Tech Store Pro',
    description:
      'A sleek, dark template for electronics stores, gadget shops, and tech retailers. High-contrast design with modern grid layouts perfect for showcasing products.',
    category: 'electronics',
    preview: '/templates/tech-store-pro.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Latest Tech', content: 'Hero banner', order: 0, visible: true, config: {} },
      { id: 's2', type: 'products', title: 'Products', content: 'Tech products', order: 1, visible: true, config: {} },
      { id: 's3', type: 'services', title: 'Services', content: 'Repair & support', order: 2, visible: true, config: {} },
      { id: 's4', type: 'testimonials', title: 'Reviews', content: 'Customer feedback', order: 3, visible: true, config: {} },
      { id: 's5', type: 'contact', title: 'Contact', content: 'Store info', order: 4, visible: true, config: {} },
    ],
    style: { primaryColor: '#0f172a', secondaryColor: '#22d3ee', fontFamily: 'Space Grotesk', theme: 'modern', mood: 'futuristic' },
    popular: false,
    featured: false,
    downloadCount: 1893,
  },
  {
    id: 'tmpl-5',
    name: 'Beauty Salon',
    description:
      'A soft, feminine template for beauty salons, spas, and wellness centers. Delicate pink accents and graceful typography create a serene online presence.',
    category: 'salon',
    preview: '/templates/beauty-salon.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Welcome', content: 'Salon hero', order: 0, visible: true, config: {} },
      { id: 's2', type: 'services', title: 'Services', content: 'Treatment menu', order: 1, visible: true, config: {} },
      { id: 's3', type: 'team', title: 'Our Team', content: 'Stylists', order: 2, visible: true, config: {} },
      { id: 's4', type: 'gallery', title: 'Gallery', content: 'Portfolio', order: 3, visible: true, config: {} },
      { id: 's5', type: 'testimonials', title: 'Reviews', content: 'Client reviews', order: 4, visible: true, config: {} },
      { id: 's6', type: 'contact', title: 'Book Now', content: 'Contact info', order: 5, visible: true, config: {} },
    ],
    style: { primaryColor: '#ec4899', secondaryColor: '#f9a8d4', fontFamily: 'DM Sans', theme: 'modern', mood: 'feminine' },
    popular: true,
    featured: false,
    downloadCount: 2341,
  },
  {
    id: 'tmpl-6',
    name: 'Medical Care',
    description:
      'A clean, professional template for medical clinics, dental offices, and healthcare providers. Trust-inspiring design with intuitive navigation for patients.',
    category: 'medical',
    preview: '/templates/medical-care.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Welcome', content: 'Medical hero', order: 0, visible: true, config: {} },
      { id: 's2', type: 'about', title: 'About Us', content: 'Practice info', order: 1, visible: true, config: {} },
      { id: 's3', type: 'services', title: 'Services', content: 'Medical services', order: 2, visible: true, config: {} },
      { id: 's4', type: 'team', title: 'Our Doctors', content: 'Medical team', order: 3, visible: true, config: {} },
      { id: 's5', type: 'faq', title: 'FAQ', content: 'Common questions', order: 4, visible: true, config: {} },
      { id: 's6', type: 'contact', title: 'Contact', content: 'Appointment info', order: 5, visible: true, config: {} },
    ],
    style: { primaryColor: '#0d9488', secondaryColor: '#22d3ee', fontFamily: 'Nunito', theme: 'modern', mood: 'clean' },
    popular: false,
    featured: false,
    downloadCount: 1567,
  },
  {
    id: 'tmpl-7',
    name: 'Hardware Hub',
    description:
      'An industrial-strength template for hardware stores, tool shops, and DIY suppliers. Bold, practical design that reflects reliability and craftsmanship.',
    category: 'hardware',
    preview: '/templates/hardware-hub.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Tools & More', content: 'Hardware hero', order: 0, visible: true, config: {} },
      { id: 's2', type: 'products', title: 'Products', content: 'Product catalog', order: 1, visible: true, config: {} },
      { id: 's3', type: 'services', title: 'Services', content: 'Hardware services', order: 2, visible: true, config: {} },
      { id: 's4', type: 'about', title: 'About Us', content: 'Store story', order: 3, visible: true, config: {} },
      { id: 's5', type: 'contact', title: 'Visit Us', content: 'Store location', order: 4, visible: true, config: {} },
    ],
    style: { primaryColor: '#ea580c', secondaryColor: '#f59e0b', fontFamily: 'Roboto Condensed', theme: 'bold', mood: 'industrial' },
    popular: false,
    featured: false,
    downloadCount: 982,
  },
  {
    id: 'tmpl-8',
    name: 'Service Pro',
    description:
      'A professional template for service businesses, consultants, and agencies. Polished design with clear calls-to-action that convert visitors into clients.',
    category: 'service',
    preview: '/templates/service-pro.png',
    sections: [
      { id: 's1', type: 'hero', title: 'Expert Services', content: 'Service hero', order: 0, visible: true, config: {} },
      { id: 's2', type: 'about', title: 'About', content: 'Company info', order: 1, visible: true, config: {} },
      { id: 's3', type: 'services', title: 'Our Services', content: 'Service list', order: 2, visible: true, config: {} },
      { id: 's4', type: 'testimonials', title: 'Testimonials', content: 'Client feedback', order: 3, visible: true, config: {} },
      { id: 's5', type: 'faq', title: 'FAQ', content: 'Questions', order: 4, visible: true, config: {} },
      { id: 's6', type: 'cta', title: 'Get Started', content: 'Call to action', order: 5, visible: true, config: {} },
      { id: 's7', type: 'contact', title: 'Contact', content: 'Contact form', order: 6, visible: true, config: {} },
    ],
    style: { primaryColor: '#475569', secondaryColor: '#64748b', fontFamily: 'Inter', theme: 'classic', mood: 'professional' },
    popular: false,
    featured: false,
    downloadCount: 1456,
  },
];

// Map old CSS gradient previews to real image URLs by category
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  bakery: '/templates/bakery-delight.png',
  restaurant: '/templates/restaurant-elegance.png',
  clothing: '/templates/fashion-forward.png',
  fashion: '/templates/fashion-forward.png',
  electronics: '/templates/tech-store-pro.png',
  tech: '/templates/tech-store-pro.png',
  salon: '/templates/beauty-salon.png',
  spa: '/templates/beauty-salon.png',
  beauty: '/templates/beauty-salon.png',
  medical: '/templates/medical-care.png',
  health: '/templates/medical-care.png',
  hardware: '/templates/hardware-hub.png',
  service: '/templates/service-pro.png',
  consulting: '/templates/service-pro.png',
};

const DEFAULT_PREVIEW = '/templates/service-pro.png';

function resolvePreviewUrl(preview: string | null, category: string): string {
  if (!preview) return CATEGORY_IMAGE_MAP[category] || DEFAULT_PREVIEW;
  // If preview is already a proper image path, return it
  if (preview.startsWith('/templates/') || preview.startsWith('/')) return preview;
  // If preview is a CSS gradient string, map it to a real image
  if (preview.includes('gradient')) return CATEGORY_IMAGE_MAP[category] || DEFAULT_PREVIEW;
  return preview;
}

export async function GET() {
  try {
    // Try to fetch from database first
    const dbTemplates = await db.template.findMany({
      orderBy: { downloadCount: 'desc' },
    });

    if (dbTemplates.length > 0) {
      const templates = dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        category: t.category,
        preview: resolvePreviewUrl(t.preview, t.category),
        sections: t.sections ? JSON.parse(t.sections) : [],
        style: t.style ? JSON.parse(t.style) : {},
        popular: t.popular,
        featured: t.featured,
        downloadCount: t.downloadCount,
      }));

      // Validate sections are proper objects (not strings)
      const validTemplates = templates.every(
        (t) =>
          Array.isArray(t.sections) &&
          t.sections.length > 0 &&
          typeof t.sections[0] === 'object' &&
          'type' in t.sections[0]
      );

      if (validTemplates) {
        return NextResponse.json({ templates });
      }
    }

    // Fall back to mock templates with real images
    return NextResponse.json({ templates: MOCK_TEMPLATES });
  } catch (error) {
    console.error('[TEMPLATES_GET]', error);
    return NextResponse.json({ templates: MOCK_TEMPLATES });
  }
}
