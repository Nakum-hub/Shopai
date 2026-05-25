// =============================================================================
// StoreCraft AI — Modular Design Block System
// =============================================================================
// Individual section blocks that are mixed and matched to create millions of
// unique storefront compositions. The AI generates HTML at generation time;
// this file is purely metadata for selection, filtering, and preview.
// =============================================================================

import type { BusinessCategory, BrandStyle, StorefrontSection } from '@/lib/types';

// =============================================================================
// DesignBlock Interface
// =============================================================================

export interface DesignBlock {
  id: string;
  type: StorefrontSection['type'];
  name: string;
  description: string;
  variant: string;
  preview: string;
  recommendedFor: BusinessCategory[];
  style: BrandStyle['theme'];
  keywords: string[];
  popular: boolean;
}

// =============================================================================
// Helper — Shorthand for category arrays
// =============================================================================

const bakery   = 'bakery'   as const;
const restaurant = 'restaurant' as const;
const clothing = 'clothing' as const;
const elec     = 'electronics' as const;
const salon    = 'salon'    as const;
const grocery  = 'grocery'  as const;
const hardware = 'hardware' as const;
const medical  = 'medical'  as const;
const boutique = 'boutique' as const;
const service  = 'service'  as const;
const other    = 'other'    as const;

// =============================================================================
// BLOCK DEFINITIONS — 92 blocks across 13 section types
// =============================================================================

// ─── HERO (15 variants) ─────────────────────────────────────────────────────

const heroBlocks: DesignBlock[] = [
  {
    id: 'block-hero-01',
    type: 'hero',
    name: 'Gradient Hero',
    description: 'Bold gradient background with centered headline, subtitle, and CTA button. Vibrant and eye-catching.',
    variant: 'gradient',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    recommendedFor: [boutique, salon, service, other],
    style: 'modern',
    keywords: ['gradient', 'centered', 'bold', 'colorful', 'vibrant', 'headline'],
    popular: true,
  },
  {
    id: 'block-hero-02',
    type: 'hero',
    name: 'Split Hero',
    description: 'Split layout with text and CTA on the left and an image placeholder on the right.',
    variant: 'split',
    preview: 'linear-gradient(90deg, #f8fafc 50%, #e2e8f0 50%)',
    recommendedFor: [restaurant, medical, hardware, service],
    style: 'modern',
    keywords: ['split', 'two-column', 'image', 'text', 'responsive'],
    popular: true,
  },
  {
    id: 'block-hero-03',
    type: 'hero',
    name: 'Fullscreen Hero',
    description: 'Full viewport height hero with a dark overlay, centered content, and scroll indicator.',
    variant: 'fullscreen',
    preview: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    recommendedFor: [boutique, restaurant, salon, clothing],
    style: 'bold',
    keywords: ['fullscreen', 'overlay', 'immersive', 'viewport', 'scroll'],
    popular: true,
  },
  {
    id: 'block-hero-04',
    type: 'hero',
    name: 'Minimal Hero',
    description: 'Clean, lots of whitespace with left-aligned text and a subtle CTA. Understated elegance.',
    variant: 'minimal',
    preview: 'linear-gradient(135deg, #fefefe 0%, #f1f5f9 100%)',
    recommendedFor: [medical, boutique, salon, service],
    style: 'minimal',
    keywords: ['minimal', 'whitespace', 'clean', 'left-aligned', 'subtle'],
    popular: true,
  },
  {
    id: 'block-hero-05',
    type: 'hero',
    name: 'Video Hero',
    description: 'Video background hero with a semi-transparent overlay, centered text, and a play button.',
    variant: 'video',
    preview: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    recommendedFor: [restaurant, boutique, clothing, other],
    style: 'bold',
    keywords: ['video', 'background', 'play', 'multimedia', 'cinematic'],
    popular: false,
  },
  {
    id: 'block-hero-06',
    type: 'hero',
    name: 'Parallax Hero',
    description: 'Hero section with parallax scrolling effect creating depth as the user scrolls down.',
    variant: 'parallax',
    preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    recommendedFor: [restaurant, boutique, salon, other],
    style: 'elegant',
    keywords: ['parallax', 'scroll', 'depth', 'layered', 'motion'],
    popular: false,
  },
  {
    id: 'block-hero-07',
    type: 'hero',
    name: 'Geometric Hero',
    description: 'Abstract geometric shapes and patterns in the background for a modern, artistic feel.',
    variant: 'geometric',
    preview: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    recommendedFor: [elec, boutique, service, other],
    style: 'modern',
    keywords: ['geometric', 'shapes', 'abstract', 'patterns', 'artistic'],
    popular: false,
  },
  {
    id: 'block-hero-08',
    type: 'hero',
    name: 'Animated Hero',
    description: 'Animated particles or wave effects in the background with a smooth, dynamic feel.',
    variant: 'animated',
    preview: 'linear-gradient(135deg, #0f172a 0%, #312e81 50%, #581c87 100%)',
    recommendedFor: [elec, boutique, clothing, service],
    style: 'modern',
    keywords: ['animated', 'particles', 'waves', 'dynamic', 'motion'],
    popular: false,
  },
  {
    id: 'block-hero-09',
    type: 'hero',
    name: 'Centered Hero',
    description: 'Perfectly centered content with a small badge or tagline above the headline.',
    variant: 'centered',
    preview: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)',
    recommendedFor: [bakery, medical, salon, service],
    style: 'minimal',
    keywords: ['centered', 'badge', 'tagline', 'clean', 'focused'],
    popular: true,
  },
  {
    id: 'block-hero-10',
    type: 'hero',
    name: 'Dark Hero',
    description: 'Dark-themed hero with an accent-colored headline and glowing CTA button.',
    variant: 'dark',
    preview: 'linear-gradient(160deg, #0c0a09 0%, #1c1917 100%)',
    recommendedFor: [elec, clothing, boutique, salon],
    style: 'bold',
    keywords: ['dark', 'accent', 'glow', 'neon', 'night'],
    popular: true,
  },
  {
    id: 'block-hero-11',
    type: 'hero',
    name: 'Zigzag Hero',
    description: 'Zigzag or chevron pattern background creating a sense of energy and movement.',
    variant: 'zigzag',
    preview: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    recommendedFor: [bakery, clothing, grocery, other],
    style: 'bold',
    keywords: ['zigzag', 'chevron', 'energy', 'movement', 'pattern'],
    popular: false,
  },
  {
    id: 'block-hero-12',
    type: 'hero',
    name: 'Spotlight Hero',
    description: 'Spotlight or radial glow effect highlighting the business name with dramatic contrast.',
    variant: 'spotlight',
    preview: 'radial-gradient(ellipse at center, #3b82f6 0%, #111827 70%)',
    recommendedFor: [boutique, salon, restaurant, clothing],
    style: 'elegant',
    keywords: ['spotlight', 'glow', 'radial', 'dramatic', 'highlight'],
    popular: false,
  },
  {
    id: 'block-hero-13',
    type: 'hero',
    name: 'Timeline Hero',
    description: 'Timeline or story-style hero showing the business journey with milestone markers.',
    variant: 'timeline',
    preview: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
    recommendedFor: [bakery, restaurant, service, medical],
    style: 'classic',
    keywords: ['timeline', 'story', 'journey', 'milestones', 'history'],
    popular: false,
  },
  {
    id: 'block-hero-14',
    type: 'hero',
    name: 'Mosaic Hero',
    description: 'Mosaic image grid background with text overlay, showcasing multiple business images.',
    variant: 'mosaic',
    preview: 'linear-gradient(135deg, #a8a29e 0%, #78716c 50%, #57534e 100%)',
    recommendedFor: [restaurant, bakery, salon, clothing],
    style: 'modern',
    keywords: ['mosaic', 'grid', 'images', 'collage', 'gallery'],
    popular: false,
  },
  {
    id: 'block-hero-15',
    type: 'hero',
    name: 'Typographic Hero',
    description: 'Large, bold typography as the focal point with minimal visual distractions.',
    variant: 'typographic',
    preview: 'linear-gradient(180deg, #09090b 0%, #27272a 100%)',
    recommendedFor: [boutique, clothing, elec, other],
    style: 'bold',
    keywords: ['typographic', 'bold', 'text', 'font', 'statement'],
    popular: true,
  },
];

// ─── ABOUT (6 variants) ──────────────────────────────────────────────────────

const aboutBlocks: DesignBlock[] = [
  {
    id: 'block-about-01',
    type: 'about',
    name: 'Story About',
    description: 'Narrative storytelling layout with flowing text blocks and pull quotes.',
    variant: 'story',
    preview: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
    recommendedFor: [bakery, restaurant, boutique, service],
    style: 'elegant',
    keywords: ['story', 'narrative', 'flowing', 'quotes', 'personal'],
    popular: true,
  },
  {
    id: 'block-about-02',
    type: 'about',
    name: 'Values About',
    description: '3-column grid highlighting core values or mission pillars with icons and descriptions.',
    variant: 'values',
    preview: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
    recommendedFor: [medical, service, hardware, grocery],
    style: 'modern',
    keywords: ['values', 'pillars', 'icons', 'grid', 'mission'],
    popular: true,
  },
  {
    id: 'block-about-03',
    type: 'about',
    name: 'Timeline About',
    description: 'Vertical timeline of company milestones and achievements with dates.',
    variant: 'timeline',
    preview: 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
    recommendedFor: [bakery, restaurant, hardware, service],
    style: 'classic',
    keywords: ['timeline', 'milestones', 'dates', 'history', 'vertical'],
    popular: false,
  },
  {
    id: 'block-about-04',
    type: 'about',
    name: 'Stats About',
    description: 'Key statistics and numbers prominently displayed — years in business, customers served, etc.',
    variant: 'stats',
    preview: 'linear-gradient(135deg, #f5f3ff 0%, #ddd6fe 100%)',
    recommendedFor: [medical, hardware, elec, grocery],
    style: 'bold',
    keywords: ['stats', 'numbers', 'counters', 'metrics', 'impact'],
    popular: true,
  },
  {
    id: 'block-about-05',
    type: 'about',
    name: 'Image About',
    description: 'Image-heavy layout with floating text cards and ambient photo composition.',
    variant: 'image',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)',
    recommendedFor: [salon, boutique, bakery, clothing],
    style: 'elegant',
    keywords: ['image-heavy', 'floating', 'photos', 'visual', 'ambient'],
    popular: false,
  },
  {
    id: 'block-about-06',
    type: 'about',
    name: 'Split About',
    description: 'Split text and image layout with alternating sides for visual balance.',
    variant: 'split',
    preview: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    recommendedFor: [restaurant, medical, hardware, salon],
    style: 'classic',
    keywords: ['split', 'alternating', 'balanced', 'text', 'image'],
    popular: false,
  },
];

// ─── SERVICES (8 variants) ───────────────────────────────────────────────────

const serviceBlocks: DesignBlock[] = [
  {
    id: 'block-services-01',
    type: 'services',
    name: 'Grid Services',
    description: 'Clean grid of service cards with icons, titles, descriptions, and pricing.',
    variant: 'grid',
    preview: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 100%)',
    recommendedFor: [salon, medical, service, hardware],
    style: 'modern',
    keywords: ['grid', 'cards', 'icons', 'pricing', 'clean'],
    popular: true,
  },
  {
    id: 'block-services-02',
    type: 'services',
    name: 'Icon Services',
    description: 'Icon-focused service items in a list layout with large, colorful icons and brief descriptions.',
    variant: 'icon',
    preview: 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)',
    recommendedFor: [medical, hardware, elec, service],
    style: 'minimal',
    keywords: ['icon', 'list', 'focused', 'simple', 'descriptions'],
    popular: true,
  },
  {
    id: 'block-services-03',
    type: 'services',
    name: 'Tabs Services',
    description: 'Tabbed categories for services — click to switch between service groups.',
    variant: 'tabs',
    preview: 'linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%)',
    recommendedFor: [salon, medical, elec, service],
    style: 'modern',
    keywords: ['tabs', 'categories', 'interactive', 'switch', 'groups'],
    popular: false,
  },
  {
    id: 'block-services-04',
    type: 'services',
    name: 'Accordion Services',
    description: 'Expandable accordion list where each service can be clicked to reveal details.',
    variant: 'accordion',
    preview: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    recommendedFor: [medical, hardware, service, grocery, elec],
    style: 'classic',
    keywords: ['accordion', 'expandable', 'details', 'collapse', 'interactive'],
    popular: false,
  },
  {
    id: 'block-services-05',
    type: 'services',
    name: 'Horizontal Services',
    description: 'Horizontally scrollable service cards for a swipeable, mobile-friendly experience.',
    variant: 'horizontal',
    preview: 'linear-gradient(135deg, #fdf2f8 0%, #fbcfe8 100%)',
    recommendedFor: [salon, boutique, clothing, bakery],
    style: 'modern',
    keywords: ['horizontal', 'scroll', 'swipeable', 'cards', 'mobile'],
    popular: false,
  },
  {
    id: 'block-services-06',
    type: 'services',
    name: 'Featured Services',
    description: 'One featured service highlighted at the top with a supporting grid below.',
    variant: 'featured',
    preview: 'linear-gradient(135deg, #fefce8 0%, #fde047 100%)',
    recommendedFor: [salon, medical, service, hardware],
    style: 'bold',
    keywords: ['featured', 'highlighted', 'primary', 'grid', 'spotlight'],
    popular: true,
  },
  {
    id: 'block-services-07',
    type: 'services',
    name: 'Process Services',
    description: 'Step-by-step process layout showing how services are delivered, from start to finish.',
    variant: 'process',
    preview: 'linear-gradient(135deg, #d1fae5 0%, #86efac 100%)',
    recommendedFor: [medical, salon, service, hardware],
    style: 'classic',
    keywords: ['process', 'steps', 'workflow', 'numbered', 'sequential'],
    popular: false,
  },
  {
    id: 'block-services-08',
    type: 'services',
    name: 'Comparison Services',
    description: 'Feature comparison table or matrix showing what each service tier includes.',
    variant: 'comparison',
    preview: 'linear-gradient(160deg, #f8fafc 0%, #cbd5e1 100%)',
    recommendedFor: [elec, medical, service, hardware],
    style: 'minimal',
    keywords: ['comparison', 'table', 'matrix', 'tiers', 'features'],
    popular: false,
  },
];

// ─── TESTIMONIALS (12 variants) ──────────────────────────────────────────────

const testimonialBlocks: DesignBlock[] = [
  {
    id: 'block-testimonials-01',
    type: 'testimonials',
    name: 'Carousel Testimonials',
    description: 'Rotating carousel of testimonial cards with auto-play and navigation dots.',
    variant: 'carousel',
    preview: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
    recommendedFor: [salon, boutique, restaurant, medical],
    style: 'modern',
    keywords: ['carousel', 'rotating', 'auto-play', 'dots', 'slider'],
    popular: true,
  },
  {
    id: 'block-testimonials-02',
    type: 'testimonials',
    name: 'Grid Testimonials',
    description: '3-column card grid with customer photos, names, star ratings, and quotes.',
    variant: 'grid',
    preview: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)',
    recommendedFor: [restaurant, bakery, salon, medical],
    style: 'classic',
    keywords: ['grid', '3-column', 'stars', 'photos', 'quotes'],
    popular: true,
  },
  {
    id: 'block-testimonials-03',
    type: 'testimonials',
    name: 'Masonry Testimonials',
    description: 'Pinterest-style masonry layout with varying card heights for visual interest.',
    variant: 'masonry',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #f472b6 100%)',
    recommendedFor: [boutique, salon, bakery, clothing],
    style: 'modern',
    keywords: ['masonry', 'pinterest', 'varying', 'visual', 'dynamic'],
    popular: false,
  },
  {
    id: 'block-testimonials-04',
    type: 'testimonials',
    name: 'Quote Testimonials',
    description: 'Elegant large quote marks with the review text, customer name, and subtle styling.',
    variant: 'quote',
    preview: 'linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)',
    recommendedFor: [boutique, restaurant, medical, service],
    style: 'elegant',
    keywords: ['quote', 'elegant', 'large', 'typography', 'subtle'],
    popular: true,
  },
  {
    id: 'block-testimonials-05',
    type: 'testimonials',
    name: 'Video Testimonials',
    description: 'Video testimonial cards with thumbnail, play button overlay, and customer details.',
    variant: 'video',
    preview: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
    recommendedFor: [medical, salon, restaurant, service],
    style: 'bold',
    keywords: ['video', 'thumbnail', 'play', 'multimedia', 'engaging'],
    popular: false,
  },
  {
    id: 'block-testimonials-06',
    type: 'testimonials',
    name: 'Stats Testimonials',
    description: 'Review stats (average rating, total reviews, NPS) alongside featured quotes.',
    variant: 'stats',
    preview: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
    recommendedFor: [restaurant, medical, hardware, elec],
    style: 'bold',
    keywords: ['stats', 'rating', 'NPS', 'numbers', 'social-proof'],
    popular: false,
  },
  {
    id: 'block-testimonials-07',
    type: 'testimonials',
    name: 'Minimal Testimonials',
    description: 'Ultra-minimal text-only reviews with just the quote and a thin line separator.',
    variant: 'minimal',
    preview: 'linear-gradient(135deg, #fafafa 0%, #e7e5e4 100%)',
    recommendedFor: [boutique, medical, service, clothing],
    style: 'minimal',
    keywords: ['minimal', 'text-only', 'simple', 'clean', 'understated'],
    popular: false,
  },
  {
    id: 'block-testimonials-08',
    type: 'testimonials',
    name: 'Social Testimonials',
    description: 'Social media style cards with avatar, handle, and platform icon (Google, Yelp, etc).',
    variant: 'social',
    preview: 'linear-gradient(135deg, #eff6ff 0%, #93c5fd 100%)',
    recommendedFor: [restaurant, bakery, salon, medical],
    style: 'modern',
    keywords: ['social', 'avatar', 'platform', 'google', 'yelp'],
    popular: true,
  },
  {
    id: 'block-testimonials-09',
    type: 'testimonials',
    name: 'Story Testimonials',
    description: 'Long-form customer stories with before/after narrative and large imagery.',
    variant: 'story',
    preview: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    recommendedFor: [medical, salon, service, boutique],
    style: 'elegant',
    keywords: ['story', 'long-form', 'narrative', 'before-after', 'case-study'],
    popular: false,
  },
  {
    id: 'block-testimonials-10',
    type: 'testimonials',
    name: 'Marquee Testimonials',
    description: 'Continuously scrolling marquee of 1-line reviews creating a lively social-proof strip.',
    variant: 'marquee',
    preview: 'linear-gradient(90deg, #18181b 0%, #3f3f46 100%)',
    recommendedFor: [bakery, restaurant, clothing, grocery],
    style: 'bold',
    keywords: ['marquee', 'scrolling', 'infinite', 'strip', 'lively'],
    popular: false,
  },
  {
    id: 'block-testimonials-11',
    type: 'testimonials',
    name: 'Badge Testimonials',
    description: 'Rating badge and trust seals alongside short, punchy customer quotes.',
    variant: 'badge',
    preview: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',
    recommendedFor: [bakery, restaurant, medical, grocery],
    style: 'classic',
    keywords: ['badge', 'seal', 'trust', 'rating', 'punchy'],
    popular: false,
  },
  {
    id: 'block-testimonials-12',
    type: 'testimonials',
    name: 'Columns Testimonials',
    description: 'Magazine-style 2-column layout with alternating image and text alignment.',
    variant: 'columns',
    preview: 'linear-gradient(135deg, #fdf2f8 0%, #f5d0fe 100%)',
    recommendedFor: [boutique, salon, clothing, restaurant],
    style: 'elegant',
    keywords: ['columns', 'magazine', '2-column', 'alternating', 'editorial'],
    popular: false,
  },
];

// ─── PRICING (4 variants) ────────────────────────────────────────────────────

const pricingBlocks: DesignBlock[] = [
  {
    id: 'block-pricing-01',
    type: 'pricing',
    name: 'Comparison Pricing',
    description: 'Side-by-side comparison of pricing tiers in a clean table or card layout.',
    variant: 'comparison',
    preview: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    recommendedFor: [service, medical, salon, elec],
    style: 'minimal',
    keywords: ['comparison', 'side-by-side', 'table', 'tiers', 'features'],
    popular: true,
  },
  {
    id: 'block-pricing-02',
    type: 'pricing',
    name: 'Featured Pricing',
    description: '3-tier pricing layout with the middle/popular plan highlighted and enlarged.',
    variant: 'featured',
    preview: 'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 100%)',
    recommendedFor: [service, medical, salon, elec],
    style: 'modern',
    keywords: ['3-tier', 'highlighted', 'popular', 'featured', 'recommended'],
    popular: true,
  },
  {
    id: 'block-pricing-03',
    type: 'pricing',
    name: 'Toggle Pricing',
    description: 'Monthly/annual billing toggle that dynamically updates prices and savings.',
    variant: 'toggle',
    preview: 'linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%)',
    recommendedFor: [service, elec, medical, hardware],
    style: 'modern',
    keywords: ['toggle', 'monthly', 'annual', 'savings', 'interactive'],
    popular: false,
  },
  {
    id: 'block-pricing-04',
    type: 'pricing',
    name: 'Custom Pricing',
    description: 'No fixed prices — a CTA card encouraging visitors to request a custom quote.',
    variant: 'custom',
    preview: 'linear-gradient(135deg, #09090b 0%, #3f3f46 100%)',
    recommendedFor: [hardware, service, medical, elec],
    style: 'bold',
    keywords: ['custom', 'quote', 'contact', 'CTA', 'flexible'],
    popular: false,
  },
];

// ─── PRODUCTS (8 variants) ───────────────────────────────────────────────────

const productBlocks: DesignBlock[] = [
  {
    id: 'block-products-01',
    type: 'products',
    name: 'Grid Products',
    description: 'Standard product grid with image cards, names, prices, and quick-view buttons.',
    variant: 'grid',
    preview: 'linear-gradient(135deg, #fdf2f8 0%, #f9a8d4 100%)',
    recommendedFor: [clothing, bakery, grocery, boutique],
    style: 'modern',
    keywords: ['grid', 'cards', 'images', 'prices', 'quick-view'],
    popular: true,
  },
  {
    id: 'block-products-02',
    type: 'products',
    name: 'Featured Products',
    description: 'One hero product prominently displayed at top with a supporting product grid below.',
    variant: 'featured',
    preview: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
    recommendedFor: [clothing, boutique, bakery, elec],
    style: 'bold',
    keywords: ['featured', 'hero', 'product', 'spotlight', 'prominent'],
    popular: true,
  },
  {
    id: 'block-products-03',
    type: 'products',
    name: 'Catalog Products',
    description: 'Catalog or magazine-style layout with large images and editorial descriptions.',
    variant: 'catalog',
    preview: 'linear-gradient(135deg, #e7e5e4 0%, #d6d3d1 100%)',
    recommendedFor: [boutique, clothing, bakery, grocery],
    style: 'elegant',
    keywords: ['catalog', 'magazine', 'editorial', 'large-images', 'descriptions'],
    popular: false,
  },
  {
    id: 'block-products-04',
    type: 'products',
    name: 'Filter Products',
    description: 'Filterable product gallery with category tags, price ranges, and sorting options.',
    variant: 'filter',
    preview: 'linear-gradient(160deg, #f8fafc 0%, #94a3b8 100%)',
    recommendedFor: [clothing, elec, grocery, hardware],
    style: 'modern',
    keywords: ['filterable', 'tags', 'sort', 'price-range', 'categories'],
    popular: true,
  },
  {
    id: 'block-products-05',
    type: 'products',
    name: 'Carousel Products',
    description: 'Horizontal product carousel/slider with navigation arrows and dots.',
    variant: 'carousel',
    preview: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
    recommendedFor: [bakery, boutique, salon, clothing],
    style: 'modern',
    keywords: ['carousel', 'slider', 'arrows', 'horizontal', 'browse'],
    popular: false,
  },
  {
    id: 'block-products-06',
    type: 'products',
    name: 'Masonry Products',
    description: 'Pinterest-style masonry product grid with varying card sizes for visual variety.',
    variant: 'masonry',
    preview: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 100%)',
    recommendedFor: [boutique, clothing, bakery, grocery],
    style: 'modern',
    keywords: ['masonry', 'pinterest', 'varying', 'visual-variety', 'dynamic'],
    popular: false,
  },
  {
    id: 'block-products-07',
    type: 'products',
    name: 'List Products',
    description: 'Clean list view with product image thumbnail, name, description, price, and add-to-cart.',
    variant: 'list',
    preview: 'linear-gradient(135deg, #fefce8 0%, #fde68a 100%)',
    recommendedFor: [grocery, hardware, elec, bakery],
    style: 'minimal',
    keywords: ['list', 'thumbnail', 'description', 'clean', 'organized'],
    popular: false,
  },
  {
    id: 'block-products-08',
    type: 'products',
    name: 'Bundle Products',
    description: 'Product bundles or kits displayed as grouped packages with savings highlighted.',
    variant: 'bundle',
    preview: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    recommendedFor: [bakery, grocery, boutique, elec],
    style: 'bold',
    keywords: ['bundle', 'kit', 'package', 'savings', 'grouped'],
    popular: false,
  },
];

// ─── FOOTER (9 variants) ─────────────────────────────────────────────────────

const footerBlocks: DesignBlock[] = [
  {
    id: 'block-footer-01',
    type: 'footer',
    name: 'Minimal Footer',
    description: 'Simple 1–2 column footer with logo, copyright, and essential links.',
    variant: 'minimal',
    preview: 'linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)',
    recommendedFor: [boutique, bakery, salon, service],
    style: 'minimal',
    keywords: ['minimal', 'simple', 'copyright', 'clean', 'essential'],
    popular: true,
  },
  {
    id: 'block-footer-02',
    type: 'footer',
    name: 'Mega Footer',
    description: 'Multi-column mega footer with sitemap links, resources, and contact info.',
    variant: 'mega',
    preview: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    recommendedFor: [elec, hardware, grocery, service],
    style: 'classic',
    keywords: ['mega', 'multi-column', 'sitemap', 'resources', 'comprehensive'],
    popular: true,
  },
  {
    id: 'block-footer-03',
    type: 'footer',
    name: 'Centered Footer',
    description: 'Centered logo, tagline, social media links, and copyright in one block.',
    variant: 'centered',
    preview: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
    recommendedFor: [bakery, boutique, salon, restaurant],
    style: 'minimal',
    keywords: ['centered', 'social', 'tagline', 'logo', 'simple'],
    popular: true,
  },
  {
    id: 'block-footer-04',
    type: 'footer',
    name: 'Dark Footer',
    description: 'Dark background footer with a newsletter signup form and social links.',
    variant: 'dark',
    preview: 'linear-gradient(135deg, #111827 0%, #1e3a5f 100%)',
    recommendedFor: [elec, clothing, boutique, restaurant],
    style: 'modern',
    keywords: ['dark', 'newsletter', 'signup', 'social', 'contrast'],
    popular: false,
  },
  {
    id: 'block-footer-05',
    type: 'footer',
    name: 'Map Footer',
    description: 'Footer with an embedded map, address, hours, and directions link.',
    variant: 'map',
    preview: 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
    recommendedFor: [restaurant, bakery, medical, hardware],
    style: 'classic',
    keywords: ['map', 'location', 'directions', 'address', 'hours'],
    popular: false,
  },
  {
    id: 'block-footer-06',
    type: 'footer',
    name: 'Social Footer',
    description: 'Social media focused footer with large platform icons and follow CTAs.',
    variant: 'social',
    preview: 'linear-gradient(135deg, #bfdbfe 0%, #7dd3fc 100%)',
    recommendedFor: [salon, boutique, bakery, clothing],
    style: 'modern',
    keywords: ['social', 'media', 'icons', 'follow', 'platforms'],
    popular: false,
  },
  {
    id: 'block-footer-07',
    type: 'footer',
    name: 'Sitemap Footer',
    description: 'Organized sitemap-style footer with categorized link groups and legal pages.',
    variant: 'sitemap',
    preview: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    recommendedFor: [elec, grocery, hardware, service],
    style: 'classic',
    keywords: ['sitemap', 'links', 'categorized', 'legal', 'organized'],
    popular: false,
  },
  {
    id: 'block-footer-08',
    type: 'footer',
    name: 'Contact Footer',
    description: 'Contact info prominent — phone, email, address, and hours in the footer.',
    variant: 'contact',
    preview: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)',
    recommendedFor: [medical, restaurant, bakery, hardware],
    style: 'classic',
    keywords: ['contact', 'phone', 'email', 'address', 'hours'],
    popular: true,
  },
  {
    id: 'block-footer-09',
    type: 'footer',
    name: 'Newsletter Footer',
    description: 'Newsletter signup focused footer with email input, tagline, and social icons.',
    variant: 'newsletter',
    preview: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    recommendedFor: [boutique, restaurant, clothing, bakery],
    style: 'modern',
    keywords: ['newsletter', 'email', 'signup', 'tagline', 'subscribe'],
    popular: false,
  },
];

// ─── CTA (5 variants) ────────────────────────────────────────────────────────

const ctaBlocks: DesignBlock[] = [
  {
    id: 'block-cta-01',
    type: 'cta',
    name: 'Banner CTA',
    description: 'Full-width banner CTA with a bold headline, supporting text, and action button.',
    variant: 'banner',
    preview: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
    recommendedFor: [boutique, restaurant, service, clothing],
    style: 'bold',
    keywords: ['banner', 'full-width', 'headline', 'action', 'bold'],
    popular: true,
  },
  {
    id: 'block-cta-02',
    type: 'cta',
    name: 'Split CTA',
    description: 'Split layout with an image on one side and CTA text and button on the other.',
    variant: 'split',
    preview: 'linear-gradient(90deg, #f97316 50%, #fefce8 50%)',
    recommendedFor: [restaurant, medical, clothing, hardware],
    style: 'modern',
    keywords: ['split', 'image', 'text', 'two-column', 'balanced'],
    popular: true,
  },
  {
    id: 'block-cta-03',
    type: 'cta',
    name: 'Floating CTA',
    description: 'Floating card-style CTA with a shadow, centered on a subtle background.',
    variant: 'floating',
    preview: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    recommendedFor: [bakery, salon, boutique, service],
    style: 'modern',
    keywords: ['floating', 'card', 'shadow', 'centered', 'subtle'],
    popular: false,
  },
  {
    id: 'block-cta-04',
    type: 'cta',
    name: 'Gradient CTA',
    description: 'Bold gradient background CTA with white text and a contrasting button.',
    variant: 'gradient',
    preview: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
    recommendedFor: [elec, boutique, clothing, restaurant],
    style: 'bold',
    keywords: ['gradient', 'white-text', 'contrasting', 'vibrant', 'eye-catching'],
    popular: false,
  },
  {
    id: 'block-cta-05',
    type: 'cta',
    name: 'Minimal CTA',
    description: 'Clean, text-focused CTA with just a headline, one line of text, and a simple button.',
    variant: 'minimal',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
    recommendedFor: [medical, service, hardware, boutique],
    style: 'minimal',
    keywords: ['minimal', 'text-focused', 'simple', 'clean', 'understated'],
    popular: false,
  },
];

// ─── FEATURES (5 variants) ───────────────────────────────────────────────────

const featureBlocks: DesignBlock[] = [
  {
    id: 'block-features-01',
    type: 'features',
    name: 'Icon Grid Features',
    description: 'Grid of feature items with large icons, titles, and short descriptions.',
    variant: 'icon-grid',
    preview: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)',
    recommendedFor: [elec, hardware, service, medical],
    style: 'modern',
    keywords: ['icon', 'grid', 'features', 'descriptions', 'clean'],
    popular: true,
  },
  {
    id: 'block-features-02',
    type: 'features',
    name: 'Alternating Features',
    description: 'Alternating image-left/text-right and text-left/image-right rows.',
    variant: 'alternating',
    preview: 'linear-gradient(135deg, #dbeafe 0%, #60a5fa 100%)',
    recommendedFor: [restaurant, medical, hardware, service],
    style: 'classic',
    keywords: ['alternating', 'zigzag', 'image-text', 'rows', 'storytelling'],
    popular: true,
  },
  {
    id: 'block-features-03',
    type: 'features',
    name: 'Tabs Features',
    description: 'Tabbed feature categories — click tabs to reveal different feature groups.',
    variant: 'tabs',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #f472b6 100%)',
    recommendedFor: [elec, service, medical, hardware],
    style: 'modern',
    keywords: ['tabs', 'categories', 'interactive', 'groups', 'switch'],
    popular: false,
  },
  {
    id: 'block-features-04',
    type: 'features',
    name: 'Comparison Features',
    description: 'Before/after or with/without comparison to highlight feature value.',
    variant: 'comparison',
    preview: 'linear-gradient(135deg, #e7e5e4 0%, #a8a29e 100%)',
    recommendedFor: [medical, service, hardware, salon],
    style: 'bold',
    keywords: ['comparison', 'before-after', 'highlight', 'value', 'contrast'],
    popular: false,
  },
  {
    id: 'block-features-05',
    type: 'features',
    name: 'Number Features',
    description: 'Numbered step features showing a process or ranked list of capabilities.',
    variant: 'number',
    preview: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%)',
    recommendedFor: [service, medical, hardware, elec],
    style: 'classic',
    keywords: ['numbered', 'steps', 'process', 'ranked', 'list'],
    popular: false,
  },
];

// ─── CONTACT (5 variants) ───────────────────────────────────────────────────

const contactBlocks: DesignBlock[] = [
  {
    id: 'block-contact-01',
    type: 'contact',
    name: 'Form Contact',
    description: 'Contact form focused layout with name, email, phone, and message fields.',
    variant: 'form',
    preview: 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)',
    recommendedFor: [service, medical, salon, hardware],
    style: 'modern',
    keywords: ['form', 'fields', 'name', 'email', 'message'],
    popular: true,
  },
  {
    id: 'block-contact-02',
    type: 'contact',
    name: 'Map Contact',
    description: 'Embedded map alongside contact info — address, phone, and hours.',
    variant: 'map',
    preview: 'linear-gradient(135deg, #bbf7d0 0%, #4ade80 100%)',
    recommendedFor: [restaurant, bakery, medical, hardware],
    style: 'classic',
    keywords: ['map', 'address', 'directions', 'location', 'hours'],
    popular: true,
  },
  {
    id: 'block-contact-03',
    type: 'contact',
    name: 'Cards Contact',
    description: 'Multiple contact method cards — phone, email, location, social — in a grid.',
    variant: 'cards',
    preview: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    recommendedFor: [bakery, salon, medical, grocery],
    style: 'modern',
    keywords: ['cards', 'methods', 'phone', 'email', 'social'],
    popular: false,
  },
  {
    id: 'block-contact-04',
    type: 'contact',
    name: 'Split Contact',
    description: 'Split layout with contact information on one side and a form on the other.',
    variant: 'split',
    preview: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
    recommendedFor: [restaurant, medical, service, hardware],
    style: 'modern',
    keywords: ['split', 'info', 'form', 'two-column', 'balanced'],
    popular: false,
  },
  {
    id: 'block-contact-05',
    type: 'contact',
    name: 'Minimal Contact',
    description: 'Phone number, email, and business hours only — no form. Quick and scannable.',
    variant: 'minimal',
    preview: 'linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)',
    recommendedFor: [bakery, grocery, salon, boutique],
    style: 'minimal',
    keywords: ['minimal', 'phone', 'email', 'hours', 'scannable'],
    popular: false,
  },
];

// ─── FAQ (5 variants) ────────────────────────────────────────────────────────

const faqBlocks: DesignBlock[] = [
  {
    id: 'block-faq-01',
    type: 'faq',
    name: 'Accordion FAQ',
    description: 'Expandable accordion list — click a question to reveal the answer below.',
    variant: 'accordion',
    preview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    recommendedFor: [service, medical, salon, hardware],
    style: 'modern',
    keywords: ['accordion', 'expandable', 'click', 'questions', 'answers'],
    popular: true,
  },
  {
    id: 'block-faq-02',
    type: 'faq',
    name: 'Categories FAQ',
    description: 'FAQ organized by categories — each group has its own header and question list.',
    variant: 'categories',
    preview: 'linear-gradient(135deg, #ddd6fe 0%, #a78bfa 50%, #8b5cf6 100%)',
    recommendedFor: [medical, service, elec, hardware],
    style: 'classic',
    keywords: ['categories', 'groups', 'headers', 'organized', 'sections'],
    popular: false,
  },
  {
    id: 'block-faq-03',
    type: 'faq',
    name: 'Search FAQ',
    description: 'Searchable FAQ with a search bar that filters questions in real-time.',
    variant: 'search',
    preview: 'linear-gradient(135deg, #d1fae5 0%, #34d399 100%)',
    recommendedFor: [elec, service, medical, hardware],
    style: 'modern',
    keywords: ['search', 'filter', 'real-time', 'searchable', 'dynamic'],
    popular: false,
  },
  {
    id: 'block-faq-04',
    type: 'faq',
    name: 'Tabs FAQ',
    description: 'Tabbed FAQ categories — switch between topic tabs to see related questions.',
    variant: 'tabs',
    preview: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)',
    recommendedFor: [medical, service, elec, salon],
    style: 'modern',
    keywords: ['tabs', 'topics', 'switch', 'interactive', 'organized'],
    popular: false,
  },
  {
    id: 'block-faq-05',
    type: 'faq',
    name: 'Simple FAQ',
    description: 'Simple Q&A list — questions in bold, answers below in regular text, no interaction.',
    variant: 'simple',
    preview: 'linear-gradient(135deg, #f9fafb 0%, #d1d5db 100%)',
    recommendedFor: [bakery, grocery, salon, boutique],
    style: 'minimal',
    keywords: ['simple', 'list', 'no-interaction', 'static', 'straightforward'],
    popular: false,
  },
];

// ─── GALLERY (5 variants) ────────────────────────────────────────────────────

const galleryBlocks: DesignBlock[] = [
  {
    id: 'block-gallery-01',
    type: 'gallery',
    name: 'Grid Gallery',
    description: 'Responsive image grid with equal-sized thumbnails and lightbox on click.',
    variant: 'grid',
    preview: 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)',
    recommendedFor: [salon, boutique, restaurant, bakery],
    style: 'modern',
    keywords: ['grid', 'responsive', 'thumbnails', 'lightbox', 'equal'],
    popular: true,
  },
  {
    id: 'block-gallery-02',
    type: 'gallery',
    name: 'Masonry Gallery',
    description: 'Pinterest-style masonry gallery with varying image heights for visual variety.',
    variant: 'masonry',
    preview: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)',
    recommendedFor: [boutique, salon, bakery, clothing],
    style: 'modern',
    keywords: ['masonry', 'pinterest', 'varying', 'dynamic', 'visual'],
    popular: true,
  },
  {
    id: 'block-gallery-03',
    type: 'gallery',
    name: 'Carousel Gallery',
    description: 'Image carousel with prev/next arrows, dots navigation, and smooth transitions.',
    variant: 'carousel',
    preview: 'linear-gradient(135deg, #6ee7b7 0%, #34d399 100%)',
    recommendedFor: [restaurant, boutique, salon, clothing],
    style: 'modern',
    keywords: ['carousel', 'arrows', 'dots', 'smooth', 'transitions'],
    popular: false,
  },
  {
    id: 'block-gallery-04',
    type: 'gallery',
    name: 'Lightbox Gallery',
    description: 'Grid gallery that opens a full-screen lightbox overlay when an image is clicked.',
    variant: 'lightbox',
    preview: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
    recommendedFor: [restaurant, salon, boutique, bakery],
    style: 'bold',
    keywords: ['lightbox', 'overlay', 'fullscreen', 'zoom', 'navigate'],
    popular: false,
  },
  {
    id: 'block-gallery-05',
    type: 'gallery',
    name: 'Polaroid Gallery',
    description: 'Polaroid-style photo frames with white borders, slight rotation, and captions.',
    variant: 'polaroid',
    preview: 'linear-gradient(135deg, #fef9c3 0%, #fde047 50%, #f59e0b 100%)',
    recommendedFor: [bakery, boutique, salon, restaurant],
    style: 'classic',
    keywords: ['polaroid', 'frames', 'rotation', 'captions', 'nostalgic'],
    popular: false,
  },
];

// ─── TEAM (5 variants) ──────────────────────────────────────────────────────

const teamBlocks: DesignBlock[] = [
  {
    id: 'block-team-01',
    type: 'team',
    name: 'Grid Team',
    description: 'Team member grid with photos, names, titles, and social links.',
    variant: 'grid',
    preview: 'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%)',
    recommendedFor: [medical, service, salon, restaurant],
    style: 'modern',
    keywords: ['grid', 'photos', 'names', 'titles', 'social'],
    popular: true,
  },
  {
    id: 'block-team-02',
    type: 'team',
    name: 'Cards Team',
    description: 'Detailed team member cards with bio, skills, and contact information.',
    variant: 'cards',
    preview: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%)',
    recommendedFor: [medical, service, elec, salon],
    style: 'modern',
    keywords: ['cards', 'bio', 'skills', 'detailed', 'contact'],
    popular: false,
  },
  {
    id: 'block-team-03',
    type: 'team',
    name: 'Overlay Team',
    description: 'Photo with hover overlay revealing name, title, and social links.',
    variant: 'overlay',
    preview: 'linear-gradient(160deg, #09090b 0%, #27272a 100%)',
    recommendedFor: [salon, boutique, restaurant, clothing],
    style: 'bold',
    keywords: ['overlay', 'hover', 'reveal', 'social', 'interactive'],
    popular: false,
  },
  {
    id: 'block-team-04',
    type: 'team',
    name: 'Timeline Team',
    description: 'Organizational hierarchy displayed as a visual timeline or tree structure.',
    variant: 'timeline',
    preview: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
    recommendedFor: [medical, service, hardware, elec],
    style: 'classic',
    keywords: ['hierarchy', 'timeline', 'tree', 'org-chart', 'structure'],
    popular: false,
  },
  {
    id: 'block-team-05',
    type: 'team',
    name: 'Circular Team',
    description: 'Circular avatar grid with names and titles below each photo.',
    variant: 'circular',
    preview: 'linear-gradient(135deg, #fce7f3 0%, #ec4899 100%)',
    recommendedFor: [salon, bakery, boutique, medical],
    style: 'elegant',
    keywords: ['circular', 'avatars', 'names', 'clean', 'friendly'],
    popular: false,
  },
];

// =============================================================================
// MASTER BLOCK COLLECTION
// =============================================================================

export const allDesignBlocks: DesignBlock[] = [
  ...heroBlocks,
  ...aboutBlocks,
  ...serviceBlocks,
  ...testimonialBlocks,
  ...pricingBlocks,
  ...productBlocks,
  ...footerBlocks,
  ...ctaBlocks,
  ...featureBlocks,
  ...contactBlocks,
  ...faqBlocks,
  ...galleryBlocks,
  ...teamBlocks,
].sort((a, b) => {
  // Sort by popularity (true first), then alphabetically by name
  if (a.popular !== b.popular) return a.popular ? -1 : 1;
  return a.name.localeCompare(b.name);
});

// =============================================================================
// EXPORTED CONSTANTS & HELPERS
// =============================================================================

/** Total number of design blocks in the system */
export const TOTAL_BLOCK_COUNT: number = allDesignBlocks.length;

/**
 * Get all blocks for a given section type.
 * @param type - A StorefrontSection type (e.g. 'hero', 'about')
 */
export function getBlocksByType(type: StorefrontSection['type']): DesignBlock[] {
  return allDesignBlocks.filter((block) => block.type === type);
}

/**
 * Get recommended blocks for a business category.
 * Returns blocks whose `recommendedFor` array includes the given category,
 * with popular blocks sorted first.
 */
export function getRecommendedBlocks(category: BusinessCategory): DesignBlock[] {
  return allDesignBlocks.filter((block) =>
    block.recommendedFor.includes(category),
  );
}

/**
 * Get a default page composition (ordered array of block IDs) for a given
 * business category. The AI can use this as a starting point and remix.
 */
export function getDefaultComposition(category: BusinessCategory): string[] {
  const compositionMap: Record<BusinessCategory, string[]> = {
    bakery: [
      'block-hero-09',  // Centered Hero
      'block-about-01',  // Story About
      'block-products-01', // Grid Products
      'block-testimonials-02', // Grid Testimonials
      'block-contact-05', // Minimal Contact
      'block-footer-03',  // Centered Footer
    ],
    restaurant: [
      'block-hero-03',  // Fullscreen Hero
      'block-about-06',  // Split About
      'block-products-02', // Featured Products
      'block-testimonials-08', // Social Testimonials
      'block-contact-02', // Map Contact
      'block-footer-05',  // Map Footer
    ],
    clothing: [
      'block-hero-10',  // Dark Hero
      'block-products-04', // Filter Products
      'block-gallery-02', // Masonry Gallery
      'block-testimonials-03', // Masonry Testimonials
      'block-cta-02',    // Split CTA
      'block-footer-04',  // Dark Footer
    ],
    electronics: [
      'block-hero-07',  // Geometric Hero
      'block-features-01', // Icon Grid Features
      'block-products-04', // Filter Products
      'block-pricing-01', // Comparison Pricing
      'block-faq-03',    // Search FAQ
      'block-footer-02',  // Mega Footer
    ],
    salon: [
      'block-hero-04',  // Minimal Hero
      'block-services-01', // Grid Services
      'block-gallery-01', // Grid Gallery
      'block-testimonials-01', // Carousel Testimonials
      'block-team-05',   // Circular Team
      'block-footer-06',  // Social Footer
    ],
    grocery: [
      'block-hero-11',  // Zigzag Hero
      'block-products-07', // List Products
      'block-features-02', // Alternating Features
      'block-contact-03', // Cards Contact
      'block-faq-05',    // Simple FAQ
      'block-footer-08',  // Contact Footer
    ],
    hardware: [
      'block-hero-02',  // Split Hero
      'block-features-02', // Alternating Features
      'block-services-02', // Icon Services
      'block-products-07', // List Products
      'block-contact-01', // Form Contact
      'block-footer-02',  // Mega Footer
    ],
    medical: [
      'block-hero-04',  // Minimal Hero
      'block-about-04',  // Stats About
      'block-services-01', // Grid Services
      'block-testimonials-04', // Quote Testimonials
      'block-faq-01',    // Accordion FAQ
      'block-footer-08',  // Contact Footer
    ],
    boutique: [
      'block-hero-12',  // Spotlight Hero
      'block-about-05',  // Image About
      'block-products-03', // Catalog Products
      'block-gallery-02', // Masonry Gallery
      'block-testimonials-12', // Columns Testimonials
      'block-cta-01',    // Banner CTA
      'block-footer-04',  // Dark Footer
    ],
    service: [
      'block-hero-01',  // Gradient Hero
      'block-services-06', // Featured Services
      'block-features-01', // Icon Grid Features
      'block-testimonials-06', // Stats Testimonials
      'block-pricing-02', // Featured Pricing
      'block-contact-04', // Split Contact
      'block-faq-01',    // Accordion FAQ
      'block-footer-07',  // Sitemap Footer
    ],
    other: [
      'block-hero-09',  // Centered Hero
      'block-about-02',  // Values About
      'block-features-05', // Number Features
      'block-testimonials-07', // Minimal Testimonials
      'block-contact-01', // Form Contact
      'block-footer-01',  // Minimal Footer
    ],
  };

  return compositionMap[category] ?? compositionMap.other;
}

/**
 * Get a count of blocks per section type.
 * Useful for UI badges and analytics.
 */
export function getBlockTypeCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const block of allDesignBlocks) {
    counts[block.type] = (counts[block.type] ?? 0) + 1;
  }
  return counts;
}

/**
 * Search blocks by keyword.
 * Matches against block name, description, variant, and keywords array.
 * Case-insensitive partial matching.
 */
export function searchBlocks(query: string): DesignBlock[] {
  const q = query.toLowerCase().trim();
  if (!q) return allDesignBlocks;

  return allDesignBlocks.filter((block) => {
    const haystack = [
      block.name,
      block.description,
      block.variant,
      ...block.keywords,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
