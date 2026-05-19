import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Templates are seeded via mock data - no DB templates table yet
const MOCK_TEMPLATES = [
  {
    id: 'tmpl-1',
    name: 'Bakery Delight',
    description: 'A warm, inviting template perfect for bakeries, cafes, and pastry shops. Features product showcases, order sections, and beautiful food photography layouts.',
    category: 'bakery',
    preview: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    sections: ['hero', 'about', 'products', 'testimonials', 'hours', 'contact', 'footer'],
    style: { primaryColor: '#f59e0b', secondaryColor: '#ef4444', fontFamily: 'Playfair Display', theme: 'classic', mood: 'warm' },
    popular: true,
    featured: true,
    downloadCount: 1247,
  },
  {
    id: 'tmpl-2',
    name: 'Restaurant Elegance',
    description: 'A sophisticated dark-themed template for fine dining restaurants and bistros. Includes menu layouts, reservation CTAs, and gallery sections.',
    category: 'restaurant',
    preview: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    sections: ['hero', 'about', 'menu', 'gallery', 'testimonials', 'reservations', 'footer'],
    style: { primaryColor: '#c9a96e', secondaryColor: '#1a1a2e', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'luxurious' },
    popular: true,
    featured: false,
    downloadCount: 983,
  },
  {
    id: 'tmpl-3',
    name: 'Fashion Forward',
    description: 'A modern, minimal template for clothing boutiques and fashion brands. Clean lines, product grids, and lookbook sections.',
    category: 'clothing',
    preview: 'linear-gradient(135deg, #f5f5f5, #e5e5e5)',
    sections: ['hero', 'collections', 'products', 'lookbook', 'about', 'newsletter', 'footer'],
    style: { primaryColor: '#111111', secondaryColor: '#f5f5f5', fontFamily: 'Inter', theme: 'minimal', mood: 'sophisticated' },
    popular: true,
    featured: false,
    downloadCount: 756,
  },
  {
    id: 'tmpl-4',
    name: 'Tech Store Pro',
    description: 'A sleek, dark template for electronics and tech stores. Features product specs, comparison tables, and review sections.',
    category: 'electronics',
    preview: 'linear-gradient(135deg, #0f172a, #1e293b)',
    sections: ['hero', 'featured', 'categories', 'products', 'reviews', 'support', 'footer'],
    style: { primaryColor: '#38bdf8', secondaryColor: '#0f172a', fontFamily: 'Space Grotesk', theme: 'modern', mood: 'techy' },
    popular: false,
    featured: true,
    downloadCount: 534,
  },
  {
    id: 'tmpl-5',
    name: 'Beauty & Glow',
    description: 'A soft, feminine template for beauty salons, spas, and wellness centers. Gentle gradients and elegant typography.',
    category: 'salon',
    preview: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
    sections: ['hero', 'services', 'gallery', 'team', 'testimonials', 'booking', 'footer'],
    style: { primaryColor: '#ec4899', secondaryColor: '#f9a8d4', fontFamily: 'Quicksand', theme: 'elegant', mood: 'relaxing' },
    popular: false,
    featured: false,
    downloadCount: 412,
  },
  {
    id: 'tmpl-6',
    name: 'Medical Care',
    description: 'A clean, professional template for clinics, pharmacies, and medical practices. Trust-building design with appointment scheduling.',
    category: 'medical',
    preview: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
    sections: ['hero', 'services', 'doctors', 'testimonials', 'insurance', 'appointment', 'footer'],
    style: { primaryColor: '#10b981', secondaryColor: '#059669', fontFamily: 'Nunito', theme: 'modern', mood: 'trustworthy' },
    popular: false,
    featured: false,
    downloadCount: 389,
  },
  {
    id: 'tmpl-7',
    name: 'Hardware Hub',
    description: 'An industrial-strength template for hardware stores and tool shops. Bold design with product categories and service areas.',
    category: 'hardware',
    preview: 'linear-gradient(135deg, #78716c, #44403c)',
    sections: ['hero', 'categories', 'products', 'brands', 'services', 'location', 'footer'],
    style: { primaryColor: '#f97316', secondaryColor: '#78716c', fontFamily: 'Roboto', theme: 'bold', mood: 'industrial' },
    popular: false,
    featured: false,
    downloadCount: 267,
  },
  {
    id: 'tmpl-8',
    name: 'Service Pro',
    description: 'A versatile template for professional services - consultants, agencies, freelancers. Portfolio, team, and contact sections.',
    category: 'service',
    preview: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    sections: ['hero', 'services', 'portfolio', 'about', 'team', 'testimonials', 'contact', 'footer'],
    style: { primaryColor: '#6366f1', secondaryColor: '#8b5cf6', fontFamily: 'Inter', theme: 'modern', mood: 'professional' },
    popular: false,
    featured: false,
    downloadCount: 198,
  },
];

export async function GET() {
  try {
    // In production, fetch from DB. For now, return mock templates
    const dbTemplates = await db.template.findMany({
      orderBy: { downloadCount: 'desc' },
    });

    const templates = dbTemplates.length > 0 ? dbTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      category: t.category,
      preview: t.preview || 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      sections: t.sections ? JSON.parse(t.sections) : [],
      style: t.style ? JSON.parse(t.style) : {},
      popular: t.popular,
      featured: t.featured,
      downloadCount: t.downloadCount,
    })) : MOCK_TEMPLATES;

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('[TEMPLATES_GET]', error);
    return NextResponse.json({ templates: MOCK_TEMPLATES });
  }
}
