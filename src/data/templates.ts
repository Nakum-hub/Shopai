// =============================================================================
// StoreCraft AI — Comprehensive Template Library (55+ templates)
// =============================================================================

import type { Template, BusinessCategory } from '@/lib/types';

// =============================================================================
// Helper to generate sections for each template
// =============================================================================

function makeSections(items: { type: Template['sections'][0]['type']; title: string; content: string }[]) {
  return items.map((s, i) => ({
    id: `s${i + 1}`,
    type: s.type,
    title: s.title,
    content: s.content,
    order: i,
    visible: true,
    config: {} as Record<string, unknown>,
  }));
}

// =============================================================================
// 55+ Templates across 11 business categories
// =============================================================================

export const allTemplates: Template[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BAKERY (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-bakery-1', name: 'Golden Crust Bakery', description: 'A warm, inviting template with golden gradients and cozy aesthetics for artisan bakeries and pastry shops.',
    category: 'bakery', preview: '/templates/golden-crust-bakery.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Welcome', content: 'Artisan breads & pastries baked fresh daily' },
      { type: 'about', title: 'Our Story', content: 'Three generations of baking tradition since 1985' },
      { type: 'products', title: 'Our Menu', content: 'Handcrafted sourdough, croissants, custom cakes, and seasonal specials' },
      { type: 'gallery', title: 'Gallery', content: 'Photos of our fresh baked goods and cozy café interior' },
      { type: 'testimonials', title: 'Reviews', content: 'What our loyal customers say about us' },
      { type: 'contact', title: 'Visit Us', content: 'Location, hours, and contact information' },
    ]),
    style: { primaryColor: '#d97706', secondaryColor: '#f59e0b', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'warm' },
    popular: true, featured: true, createdAt: '2024-01-15',
  },
  {
    id: 'tpl-bakery-2', name: 'French Patisserie', description: 'An elegant Parisian-inspired design with soft pastels and refined typography for high-end pastry shops.',
    category: 'bakery', preview: '/templates/french-patisserie.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Bienvenue', content: 'Authentic French pastries in the heart of the city' },
      { type: 'about', title: 'Our Artisans', content: 'Trained in Paris, crafting perfection since 2010' },
      { type: 'products', title: 'Pâtisserie', content: 'Macarons, éclairs, tarts, and wedding cakes' },
      { type: 'gallery', title: 'Showcase', content: 'Our finest pastry creations' },
      { type: 'cta', title: 'Order Online', content: 'Pre-order for special occasions' },
      { type: 'contact', title: 'Find Us', content: 'Visit our boutique locations' },
    ]),
    style: { primaryColor: '#be185d', secondaryColor: '#f9a8d4', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'refined' },
    popular: true, featured: false, createdAt: '2024-01-21',
  },
  {
    id: 'tpl-bakery-3', name: 'Rustic Oven', description: 'A farmhouse-chic template with earthy tones and textured backgrounds for rustic bread bakeries.',
    category: 'bakery', preview: '/templates/rustic-oven.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Fresh From The Oven', content: 'Wood-fired breads made with locally sourced ingredients' },
      { type: 'about', title: 'Our Farm', content: 'We grow our own wheat and mill it fresh' },
      { type: 'products', title: 'Breads', content: 'Sourdough, rye, multigrain, focaccia, and ciabatta' },
      { type: 'hours', title: 'Bakery Hours', content: 'Open 6AM - 4PM, Tuesday through Sunday' },
      { type: 'contact', title: 'Location', content: 'Find us at the farmers market every Saturday' },
    ]),
    style: { primaryColor: '#92400e', secondaryColor: '#a16207', fontFamily: 'Lora', theme: 'classic', mood: 'rustic' },
    popular: false, featured: false, createdAt: '2024-01-27',
  },
  {
    id: 'tpl-bakery-4', name: 'Cake Studio', description: 'A modern, colorful template for custom cake shops and dessert studios with bold visual galleries.',
    category: 'bakery', preview: '/templates/cake-studio.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Custom Cakes', content: 'Instagram-worthy cakes for every celebration' },
      { type: 'about', title: 'Our Designer', content: 'Award-winning cake artist with 10+ years experience' },
      { type: 'products', title: 'Collections', content: 'Wedding, birthday, corporate, and novelty cakes' },
      { type: 'gallery', title: 'Portfolio', content: 'Browse our stunning cake gallery' },
      { type: 'testimonials', title: 'Happy Clients', content: 'Reviews from brides and party hosts' },
      { type: 'contact', title: 'Book a Consultation', content: 'Schedule your cake design session' },
    ]),
    style: { primaryColor: '#e11d48', secondaryColor: '#f43f5e', fontFamily: 'DM Sans', theme: 'bold', mood: 'playful' },
    popular: true, featured: false, createdAt: '2024-02-02',
  },
  {
    id: 'tpl-bakery-5', name: 'Daily Bread Co-op', description: 'A community-focused template with clean layout for cooperative bakeries and community-driven shops.',
    category: 'bakery', preview: '/templates/daily-bread-coop.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Baked Together', content: 'Community-owned bakery serving our neighborhood since 1998' },
      { type: 'about', title: 'Our Mission', content: 'Affordable, healthy bread for everyone' },
      { type: 'products', title: 'Today\'s Selection', content: 'Fresh breads, muffins, cookies, and coffee' },
      { type: 'team', title: 'Our Members', content: 'Meet the baker-owners of our co-op' },
      { type: 'contact', title: 'Join Us', content: 'Membership info and volunteer opportunities' },
    ]),
    style: { primaryColor: '#15803d', secondaryColor: '#4ade80', fontFamily: 'Nunito', theme: 'minimal', mood: 'friendly' },
    popular: false, featured: false, createdAt: '2024-02-08',
  },
  {
    id: 'tpl-bakery-6', name: 'Donut Paradise', description: 'A fun, vibrant template for donut shops and sweet treat stores with playful animations and bright colors.',
    category: 'bakery', preview: '/templates/donut-paradise.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Life Is Short', content: 'Eat the donut. 50+ flavors made fresh every morning.' },
      { type: 'products', title: 'Flavors', content: 'Classic glazed, chocolate sprinkle, matcha, maple bacon, and more' },
      { type: 'gallery', title: 'Donut Gallery', content: 'Colorful photos of our signature donuts' },
      { type: 'testimonials', title: 'Fan Reviews', content: 'What donut lovers say about us' },
      { type: 'cta', title: 'Catering', content: 'Donut walls and boxes for your events' },
      { type: 'contact', title: 'Visit', content: 'Locations, hours, and delivery info' },
    ]),
    style: { primaryColor: '#f97316', secondaryColor: '#fbbf24', fontFamily: 'Fredoka', theme: 'bold', mood: 'fun' },
    popular: true, featured: false, createdAt: '2024-02-14',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESTAURANT (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-restaurant-1', name: 'Restaurant Elegance', description: 'A dark, luxurious template for fine dining restaurants with rich typography and moody visuals.',
    category: 'restaurant', preview: '/templates/restaurant-elegance.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Welcome', content: 'An unforgettable dining experience awaits' },
      { type: 'about', title: 'Our Philosophy', content: 'Farm-to-table cuisine with seasonal menus' },
      { type: 'products', title: 'Menu', content: 'Starters, mains, desserts, and wine pairings' },
      { type: 'testimonials', title: 'Reviews', content: 'Critic reviews and diner testimonials' },
      { type: 'hours', title: 'Reservations', content: 'Dinner service Tuesday-Sunday, 6PM-11PM' },
      { type: 'contact', title: 'Contact', content: 'Reservations and private dining inquiries' },
    ]),
    style: { primaryColor: '#78350f', secondaryColor: '#d97706', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'luxurious' },
    popular: true, featured: false, createdAt: '2024-02-21',
  },
  {
    id: 'tpl-restaurant-2', name: 'Sakura Sushi Bar', description: 'A sleek Japanese-inspired template with clean lines and subtle animations for sushi restaurants.',
    category: 'restaurant', preview: '/templates/sakura-sushi-bar.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Omakase', content: 'Chef\'s choice sushi experience' },
      { type: 'about', title: 'Our Chef', content: 'Trained in Tokyo with 20 years of experience' },
      { type: 'products', title: 'Sushi Menu', content: 'Nigiri, sashimi, rolls, and omakase courses' },
      { type: 'gallery', title: 'Gallery', content: 'Beautiful sushi plating and restaurant ambiance' },
      { type: 'hours', title: 'Hours', content: 'Lunch & dinner service daily' },
      { type: 'contact', title: 'Reserve', content: 'Book your sushi experience' },
    ]),
    style: { primaryColor: '#dc2626', secondaryColor: '#1c1917', fontFamily: 'Noto Serif JP', theme: 'minimal', mood: 'serene' },
    popular: true, featured: true, createdAt: '2024-02-27',
  },
  {
    id: 'tpl-restaurant-3', name: 'Trattoria Bella', description: 'A warm Italian-themed template with terracotta colors and rustic charm for trattorias and pizzerias.',
    category: 'restaurant', preview: '/templates/trattoria-bella.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Benvenuti', content: 'Authentic Italian cuisine made with love' },
      { type: 'about', title: 'Nonna\'s Kitchen', content: 'Recipes passed down through generations' },
      { type: 'products', title: 'Menu', content: 'Handmade pasta, wood-fired pizza, and regional specials' },
      { type: 'testimonials', title: 'Reviews', content: 'Our guests love the authentic flavors' },
      { type: 'gallery', title: 'Ambiance', content: 'Cozy interior and delicious food photos' },
      { type: 'contact', title: 'Visit Us', content: 'Reservations and directions' },
    ]),
    style: { primaryColor: '#c2410c', secondaryColor: '#fbbf24', fontFamily: 'Playfair Display', theme: 'classic', mood: 'warm' },
    popular: false, featured: false, createdAt: '2024-03-04',
  },
  {
    id: 'tpl-restaurant-4', name: 'Street Food Hub', description: 'A vibrant, energetic template for food trucks, street food vendors, and casual dining.',
    category: 'restaurant', preview: '/templates/street-food-hub.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Flavor Street', content: 'Bold flavors from around the world' },
      { type: 'products', title: 'Our Menu', content: 'Tacos, bao buns, loaded fries, and craft sodas' },
      { type: 'about', title: 'Our Story', content: 'From a single food truck to a flavor destination' },
      { type: 'testimonials', title: 'Fans', content: 'What foodies are saying' },
      { type: 'cta', title: 'Catering', content: 'Book us for your next event' },
      { type: 'contact', title: 'Find Us', content: 'Locations and schedule' },
    ]),
    style: { primaryColor: '#ea580c', secondaryColor: '#facc15', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'energetic' },
    popular: true, featured: false, createdAt: '2024-03-10',
  },
  {
    id: 'tpl-restaurant-5', name: 'The Rooftop Lounge', description: 'A sophisticated template for rooftop bars, lounges, and upscale casual dining with stunning visual design.',
    category: 'restaurant', preview: '/templates/rooftop-lounge.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Sky-High Dining', content: 'Cocktails and cuisine with panoramic city views' },
      { type: 'about', title: 'The Experience', content: 'Sunset sessions, live music, and curated menus' },
      { type: 'products', title: 'Menu', content: 'Craft cocktails, share plates, and desserts' },
      { type: 'gallery', title: 'Views', content: 'Stunning sunset and skyline photography' },
      { type: 'events', title: 'Events', content: 'Private events and weekly specials' },
      { type: 'contact', title: 'Reservations', content: 'Book your table above the city' },
    ]),
    style: { primaryColor: '#0f172a', secondaryColor: '#6366f1', fontFamily: 'Inter', theme: 'modern', mood: 'chic' },
    popular: false, featured: false, createdAt: '2024-03-16',
  },
  {
    id: 'tpl-restaurant-6', name: 'Veggie Garden', description: 'A fresh, green-themed template for vegan and vegetarian restaurants with earthy, natural aesthetics.',
    category: 'restaurant', preview: '/templates/veggie-garden.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Plant Powered', content: 'Delicious vegan cuisine that celebrates nature' },
      { type: 'about', title: 'Our Mission', content: 'Sustainable dining that tastes incredible' },
      { type: 'products', title: 'Menu', content: 'Buddha bowls, plant-based burgers, raw desserts' },
      { type: 'testimonials', title: 'Reviews', content: 'Even meat-lovers love our food' },
      { type: 'faq', title: 'FAQ', content: 'Allergens, sourcing, and dietary info' },
      { type: 'contact', title: 'Visit', content: 'Location, hours, and delivery' },
    ]),
    style: { primaryColor: '#16a34a', secondaryColor: '#86efac', fontFamily: 'DM Sans', theme: 'minimal', mood: 'fresh' },
    popular: false, featured: false, createdAt: '2024-03-23',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLOTHING (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-clothing-1', name: 'Fashion Forward', description: 'A modern, minimal template for clothing brands and boutiques with clean lines and sophisticated layouts.',
    category: 'clothing', preview: '/templates/fashion-forward.jpg',
    sections: makeSections([
      { type: 'hero', title: 'New Collection', content: 'Elevate your wardrobe with our latest designs' },
      { type: 'products', title: 'Shop', content: 'Dresses, tops, bottoms, and accessories' },
      { type: 'about', title: 'Brand Story', content: 'Sustainable fashion for the modern individual' },
      { type: 'gallery', title: 'Lookbook', content: 'Editorial photography and style inspiration' },
      { type: 'testimonials', title: 'Customers', content: 'Real people, real style' },
      { type: 'contact', title: 'Contact', content: 'Customer service and inquiries' },
    ]),
    style: { primaryColor: '#171717', secondaryColor: '#a3a3a3', fontFamily: 'Inter', theme: 'minimal', mood: 'sophisticated' },
    popular: true, featured: false, createdAt: '2024-03-29',
  },
  {
    id: 'tpl-clothing-2', name: 'Vintage Revival', description: 'A retro-inspired template for thrift stores, vintage shops, and retro fashion brands.',
    category: 'clothing', preview: '/templates/vintage-revival.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Timeless Style', content: 'Curated vintage fashion from every era' },
      { type: 'products', title: 'Shop by Era', content: '60s mod, 70s boho, 80s power, 90s grunge' },
      { type: 'about', title: 'Our Curation', content: 'Handpicked pieces with history and character' },
      { type: 'gallery', title: 'Style Gallery', content: 'Vintage looks styled for today' },
      { type: 'contact', title: 'Visit', content: 'Shop location and hours' },
    ]),
    style: { primaryColor: '#92400e', secondaryColor: '#d97706', fontFamily: 'Playfair Display', theme: 'classic', mood: 'nostalgic' },
    popular: false, featured: false, createdAt: '2024-04-04',
  },
  {
    id: 'tpl-clothing-3', name: 'Athleisure Pro', description: 'A bold, energetic template for sportswear and athletic clothing brands with dynamic layouts.',
    category: 'clothing', preview: '/templates/athleisure-pro.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Move Better', content: 'Performance wear for every workout' },
      { type: 'products', title: 'Collections', content: 'Running, yoga, gym, and outdoor gear' },
      { type: 'features', title: 'Technology', content: 'Moisture-wicking, UV protection, 4-way stretch' },
      { type: 'testimonials', title: 'Athletes', content: 'Trusted by professional athletes' },
      { type: 'cta', title: 'Sale', content: 'Seasonal clearance event' },
      { type: 'contact', title: 'Support', content: 'Sizing guide and returns' },
    ]),
    style: { primaryColor: '#dc2626', secondaryColor: '#111827', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'powerful' },
    popular: true, featured: false, createdAt: '2024-04-10',
  },
  {
    id: 'tpl-clothing-4', name: 'Thread & Needle', description: 'An elegant template for bespoke tailoring, custom suits, and made-to-measure clothing services.',
    category: 'clothing', preview: '/templates/thread-needle.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Bespoke Excellence', content: 'Custom tailoring for the discerning gentleman' },
      { type: 'about', title: 'Craftsmanship', content: 'Hand-stitched quality since 1965' },
      { type: 'products', title: 'Services', content: 'Suits, shirts, alterations, and wedding packages' },
      { type: 'gallery', title: 'Portfolio', content: 'Our finest bespoke creations' },
      { type: 'testimonials', title: 'Clients', content: 'Distinguished gentlemen trust us' },
      { type: 'contact', title: 'Appointments', content: 'Book your fitting consultation' },
    ]),
    style: { primaryColor: '#1e293b', secondaryColor: '#c9a96e', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'luxurious' },
    popular: false, featured: false, createdAt: '2024-04-16',
  },
  {
    id: 'tpl-clothing-5', name: 'Kids Wardrobe', description: 'A playful, colorful template for children\'s clothing stores with fun elements and parent-friendly navigation.',
    category: 'clothing', preview: '/templates/kids-wardrobe.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Little Styles', content: 'Adorable, comfortable clothes for kids of all ages' },
      { type: 'products', title: 'Shop by Age', content: 'Baby (0-2), Toddler (2-5), Kids (6-12), Teens (13+)' },
      { type: 'about', title: 'Our Promise', content: 'Organic cotton, safe dyes, and durable construction' },
      { type: 'gallery', title: 'Lookbook', content: 'Cute kids in our latest collection' },
      { type: 'cta', title: 'Sale', content: 'End of season clearance' },
      { type: 'contact', title: 'Help', content: 'Size guide and customer service' },
    ]),
    style: { primaryColor: '#e11d48', secondaryColor: '#fbbf24', fontFamily: 'Nunito', theme: 'bold', mood: 'playful' },
    popular: false, featured: false, createdAt: '2024-04-22',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRONICS (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-electronics-1', name: 'Tech Store Pro', description: 'A sleek, dark template for electronics stores with high-contrast design and modern grid layouts.',
    category: 'electronics', preview: '/templates/tech-store-pro.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Latest Tech', content: 'Cutting-edge electronics at competitive prices' },
      { type: 'products', title: 'Products', content: 'Laptops, phones, tablets, accessories, and smart home' },
      { type: 'services', title: 'Services', content: 'Repair, setup, and tech support' },
      { type: 'testimonials', title: 'Reviews', content: 'Customer feedback and ratings' },
      { type: 'contact', title: 'Store Info', content: 'Location, hours, and support contacts' },
    ]),
    style: { primaryColor: '#0f172a', secondaryColor: '#22d3ee', fontFamily: 'Space Grotesk', theme: 'modern', mood: 'futuristic' },
    popular: true, featured: false, createdAt: '2024-04-29',
  },
  {
    id: 'tpl-electronics-2', name: 'Apple Reseller Elite', description: 'A clean, Apple-inspired template for authorized Apple resellers and premium tech boutiques.',
    category: 'electronics', preview: '/templates/apple-reseller-elite.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Think Different', content: 'Premium Apple products and expert guidance' },
      { type: 'products', title: 'Products', content: 'Mac, iPad, iPhone, Apple Watch, and accessories' },
      { type: 'services', title: 'Services', content: 'AppleCare, trade-in, personal setup, and training' },
      { type: 'about', title: 'About Us', content: 'Your neighborhood Apple Specialist' },
      { type: 'contact', title: 'Visit', content: 'Store location and Genius Bar hours' },
    ]),
    style: { primaryColor: '#111827', secondaryColor: '#6b7280', fontFamily: 'SF Pro Display', theme: 'minimal', mood: 'premium' },
    popular: true, featured: true, createdAt: '2024-05-05',
  },
  {
    id: 'tpl-electronics-3', name: 'Gaming Zone', description: 'A vibrant, neon-themed template for gaming stores and PC builders with dynamic visual effects.',
    category: 'electronics', preview: '/templates/gaming-zone.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Level Up', content: 'PC components, consoles, and gaming gear' },
      { type: 'products', title: 'Shop', content: 'GPUs, CPUs, monitors, keyboards, and headsets' },
      { type: 'services', title: 'Build Services', content: 'Custom PC building and optimization' },
      { type: 'features', title: 'Why Us', content: 'Price match guarantee, expert staff, fast shipping' },
      { type: 'testimonials', title: 'Gamers', content: 'Reviews from the gaming community' },
      { type: 'contact', title: 'Get In Touch', content: 'Store hours and support' },
    ]),
    style: { primaryColor: '#7c3aed', secondaryColor: '#06b6d4', fontFamily: 'Rajdhani', theme: 'bold', mood: 'intense' },
    popular: true, featured: false, createdAt: '2024-05-11',
  },
  {
    id: 'tpl-electronics-4', name: 'Smart Home Hub', description: 'A clean, modern template for smart home and IoT device retailers with emphasis on connectivity.',
    category: 'electronics', preview: '/templates/smart-home-hub.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Connected Living', content: 'Transform your home with smart technology' },
      { type: 'products', title: 'Devices', content: 'Smart speakers, lights, thermostats, cameras, and locks' },
      { type: 'features', title: 'Ecosystem', content: 'Compatible with Alexa, Google Home, and HomeKit' },
      { type: 'about', title: 'About', content: 'Making homes smarter since 2018' },
      { type: 'faq', title: 'FAQ', content: 'Compatibility, setup, and warranty questions' },
      { type: 'contact', title: 'Contact', content: 'Demo bookings and support' },
    ]),
    style: { primaryColor: '#0d9488', secondaryColor: '#14b8a6', fontFamily: 'Inter', theme: 'modern', mood: 'innovative' },
    popular: false, featured: false, createdAt: '2024-05-17',
  },
  {
    id: 'tpl-electronics-5', name: 'AudioPhile Store', description: 'A premium template for audio equipment stores, headphone brands, and music enthusiasts.',
    category: 'electronics', preview: '/templates/audiophile-store.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Sound Perfection', content: 'Premium audio equipment for discerning listeners' },
      { type: 'products', title: 'Equipment', content: 'Headphones, speakers, amplifiers, and turntables' },
      { type: 'services', title: 'Services', content: 'Demo room, calibration, and installation' },
      { type: 'testimonials', title: 'Audiophiles', content: 'Reviews from music professionals' },
      { type: 'contact', title: 'Visit', content: 'Listening room bookings and store info' },
    ]),
    style: { primaryColor: '#1c1917', secondaryColor: '#d4a853', fontFamily: 'Lora', theme: 'elegant', mood: 'premium' },
    popular: false, featured: false, createdAt: '2024-05-23',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SALON (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-salon-1', name: 'Beauty Salon', description: 'A soft, feminine template for beauty salons and spas with delicate pink accents and graceful typography.',
    category: 'salon', preview: '/templates/beauty-salon.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Welcome', content: 'Your beauty transformation starts here' },
      { type: 'services', title: 'Services', content: 'Hair, skin, nails, and wellness treatments' },
      { type: 'team', title: 'Our Team', content: 'Meet our expert stylists and therapists' },
      { type: 'gallery', title: 'Gallery', content: 'Before & after transformations' },
      { type: 'testimonials', title: 'Reviews', content: 'Client testimonials and ratings' },
      { type: 'contact', title: 'Book Now', content: 'Appointment booking and location' },
    ]),
    style: { primaryColor: '#ec4899', secondaryColor: '#f9a8d4', fontFamily: 'DM Sans', theme: 'modern', mood: 'feminine' },
    popular: true, featured: false, createdAt: '2024-05-30',
  },
  {
    id: 'tpl-salon-2', name: 'Barbershop Classic', description: 'A masculine, vintage-themed template for traditional barbershops with warm wood tones and classic typography.',
    category: 'salon', preview: '/templates/barbershop-classic.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Classic Cuts', content: 'Traditional grooming for the modern gentleman' },
      { type: 'services', title: 'Services', content: 'Haircuts, hot towel shaves, beard trims' },
      { type: 'team', title: 'Barbers', content: 'Our master barbers' },
      { type: 'gallery', title: 'Portfolio', content: 'Fresh cuts and clean shaves' },
      { type: 'hours', title: 'Walk-Ins Welcome', content: 'Open 7 days a week' },
      { type: 'contact', title: 'Find Us', content: 'Location and phone number' },
    ]),
    style: { primaryColor: '#78350f', secondaryColor: '#d97706', fontFamily: 'Playfair Display', theme: 'classic', mood: 'masculine' },
    popular: true, featured: false, createdAt: '2024-06-05',
  },
  {
    id: 'tpl-salon-3', name: 'Zen Wellness Spa', description: 'A serene, minimal template for day spas and wellness centers with calming green and white aesthetics.',
    category: 'salon', preview: '/templates/zen-wellness-spa.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Find Your Zen', content: 'Luxury spa treatments for mind, body, and soul' },
      { type: 'services', title: 'Treatments', content: 'Massages, facials, body wraps, and meditation' },
      { type: 'about', title: 'Our Philosophy', content: 'Holistic wellness rooted in ancient traditions' },
      { type: 'gallery', title: 'Facility', content: 'Tour our peaceful treatment rooms' },
      { type: 'testimonials', title: 'Experiences', content: 'Guest reviews and wellness journeys' },
      { type: 'contact', title: 'Book', content: 'Online booking and gift certificates' },
    ]),
    style: { primaryColor: '#0d9488', secondaryColor: '#a7f3d0', fontFamily: 'Lora', theme: 'minimal', mood: 'serene' },
    popular: false, featured: false, createdAt: '2024-06-11',
  },
  {
    id: 'tpl-salon-4', name: 'Nail Art Studio', description: 'A creative, vibrant template for nail salons with colorful galleries and booking integration.',
    category: 'salon', preview: '/templates/nail-art-studio.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Nail Perfection', content: 'Stunning nail art and premium manicures' },
      { type: 'services', title: 'Menu', content: 'Gel, acrylic, nail art, pedicures, and treatments' },
      { type: 'gallery', title: 'Design Gallery', content: 'Hundreds of nail art designs' },
      { type: 'testimonials', title: 'Clients', content: 'What our nail art lovers say' },
      { type: 'cta', title: 'Book Now', content: 'Schedule your appointment' },
      { type: 'contact', title: 'Visit', content: 'Location, hours, and pricing' },
    ]),
    style: { primaryColor: '#e11d48', secondaryColor: '#f472b6', fontFamily: 'DM Sans', theme: 'bold', mood: 'creative' },
    popular: false, featured: false, createdAt: '2024-06-17',
  },
  {
    id: 'tpl-salon-5', name: 'Hair Color Lab', description: 'A trendy, editorial template for hair colorists and color studios with bold visuals and portfolio focus.',
    category: 'salon', preview: '/templates/hair-color-lab.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Color Revolution', content: 'Transformative hair color by expert colorists' },
      { type: 'services', title: 'Services', content: 'Balayage, ombré, highlights, color correction' },
      { type: 'gallery', title: 'Color Portfolio', content: 'Before & after color transformations' },
      { type: 'team', title: 'Colorists', content: 'Meet our certified color experts' },
      { type: 'faq', title: 'Aftercare', content: 'Tips for maintaining your color' },
      { type: 'contact', title: 'Book', content: 'Consultation bookings' },
    ]),
    style: { primaryColor: '#7c3aed', secondaryColor: '#c084fc', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'trendy' },
    popular: true, featured: false, createdAt: '2024-06-23',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROCERY (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-grocery-1', name: 'Fresh Mart', description: 'A clean, green-themed template for organic grocery stores and health food shops.',
    category: 'grocery', preview: '/templates/fresh-mart.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Farm Fresh', content: 'Organic produce delivered to your door' },
      { type: 'products', title: 'Departments', content: 'Fruits, vegetables, dairy, bakery, and pantry' },
      { type: 'about', title: 'Our Sources', content: 'Local farms and sustainable suppliers' },
      { type: 'features', title: 'Why Organic', content: 'No pesticides, no GMOs, just pure food' },
      { type: 'contact', title: 'Delivery', content: 'Delivery zones and ordering info' },
    ]),
    style: { primaryColor: '#16a34a', secondaryColor: '#86efac', fontFamily: 'Nunito', theme: 'minimal', mood: 'fresh' },
    popular: true, featured: false, createdAt: '2024-06-30',
  },
  {
    id: 'tpl-grocery-2', name: 'Spice Market', description: 'A warm, aromatic template for ethnic grocery stores and spice shops with rich cultural aesthetics.',
    category: 'grocery', preview: '/templates/spice-market.jpg',
    sections: makeSections([
      { type: 'hero', title: 'World of Spices', content: 'Authentic ingredients from every corner of the globe' },
      { type: 'products', title: 'Aisles', content: 'Spices, lentils, rice, sauces, and specialty items' },
      { type: 'about', title: 'Heritage', content: 'Family-owned since 1992' },
      { type: 'gallery', title: 'Store', content: 'Aisles of colorful products' },
      { type: 'contact', title: 'Visit', content: 'Location, hours, and weekly specials' },
    ]),
    style: { primaryColor: '#b91c1c', secondaryColor: '#f59e0b', fontFamily: 'Lora', theme: 'classic', mood: 'warm' },
    popular: false, featured: false, createdAt: '2024-07-06',
  },
  {
    id: 'tpl-grocery-3', name: 'QuickCart Express', description: 'A modern, fast-paced template for convenience stores and quick-service grocery delivery.',
    category: 'grocery', preview: '/templates/quickcart-express.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Fast & Fresh', content: 'Groceries delivered in 30 minutes or less' },
      { type: 'products', title: 'Categories', content: 'Snacks, drinks, household, and essentials' },
      { type: 'features', title: 'Why QuickCart', content: '30-min delivery, lowest prices, fresh guarantee' },
      { type: 'cta', title: 'Order Now', content: 'Start shopping with our app' },
      { type: 'contact', title: 'Locations', content: 'Store finder and delivery zones' },
    ]),
    style: { primaryColor: '#2563eb', secondaryColor: '#22d3ee', fontFamily: 'Inter', theme: 'modern', mood: 'efficient' },
    popular: true, featured: false, createdAt: '2024-07-12',
  },
  {
    id: 'tpl-grocery-4', name: 'Wine & Cheese Cellar', description: 'An elegant template for wine shops, cheese stores, and gourmet food boutiques.',
    category: 'grocery', preview: '/templates/wine-cheese-cellar.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Curated Tastes', content: 'Fine wines and artisan cheeses from around the world' },
      { type: 'products', title: 'Collections', content: 'Wines by region, cheese boards, and gift sets' },
      { type: 'about', title: 'Our Sommelier', content: 'Expert recommendations for every palate' },
      { type: 'services', title: 'Tastings', content: 'Weekly wine and cheese pairing events' },
      { type: 'contact', title: 'Visit', content: 'Store location and event calendar' },
    ]),
    style: { primaryColor: '#7f1d1d', secondaryColor: '#d4a853', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'sophisticated' },
    popular: false, featured: false, createdAt: '2024-07-18',
  },
  {
    id: 'tpl-grocery-5', name: 'Butcher & Provisions', description: 'A rustic, trustworthy template for butcher shops and specialty meat/seafood markets.',
    category: 'grocery', preview: '/templates/butcher-provisions.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Quality Cuts', content: 'Locally sourced, hand-cut meats and fresh seafood' },
      { type: 'products', title: 'Counter', content: 'Beef, poultry, pork, lamb, and daily catch' },
      { type: 'about', title: 'Our Standards', content: 'Free-range, grass-fed, and sustainably caught' },
      { type: 'services', title: 'Services', content: 'Custom cuts, curing, and event catering' },
      { type: 'contact', title: 'Visit', content: 'Location, hours, and pre-orders' },
    ]),
    style: { primaryColor: '#991b1b', secondaryColor: '#78716c', fontFamily: 'Roboto Condensed', theme: 'bold', mood: 'rustic' },
    popular: false, featured: false, createdAt: '2024-07-24',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HARDWARE (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-hardware-1', name: 'Hardware Hub', description: 'An industrial-strength template for hardware stores with bold, practical design reflecting reliability.',
    category: 'hardware', preview: '/templates/hardware-hub.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Tools & More', content: 'Everything you need for your next project' },
      { type: 'products', title: 'Departments', content: 'Power tools, hand tools, lumber, plumbing, electrical' },
      { type: 'services', title: 'Services', content: 'Key cutting, screen repair, tool rental' },
      { type: 'about', title: 'About Us', content: 'Serving the community for over 30 years' },
      { type: 'contact', title: 'Visit Us', content: 'Store location and hours' },
    ]),
    style: { primaryColor: '#ea580c', secondaryColor: '#f59e0b', fontFamily: 'Roboto Condensed', theme: 'bold', mood: 'industrial' },
    popular: false, featured: false, createdAt: '2024-07-30',
  },
  {
    id: 'tpl-hardware-2', name: 'DIY Paradise', description: 'A colorful, inspiring template for DIY and craft supply stores with project ideas and tutorials.',
    category: 'hardware', preview: '/templates/diy-paradise.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Build Something', content: 'Tools, materials, and inspiration for every project' },
      { type: 'products', title: 'Shop', content: 'Power tools, hand tools, paints, and hardware' },
      { type: 'features', title: 'Workshops', content: 'Free weekend DIY workshops' },
      { type: 'gallery', title: 'Projects', content: 'Customer project showcase' },
      { type: 'contact', title: 'Visit', content: 'Store finder and workshop schedule' },
    ]),
    style: { primaryColor: '#16a34a', secondaryColor: '#eab308', fontFamily: 'Nunito', theme: 'modern', mood: 'inspiring' },
    popular: true, featured: false, createdAt: '2024-08-06',
  },
  {
    id: 'tpl-hardware-3', name: 'Garden & Outdoor', description: 'A nature-themed template for garden centers and outdoor living stores with earthy greens and warm browns.',
    category: 'hardware', preview: '/templates/garden-outdoor.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Outdoor Living', content: 'Plants, tools, and everything for your garden' },
      { type: 'products', title: 'Shop', content: 'Plants, pots, tools, fertilizers, and outdoor furniture' },
      { type: 'services', title: 'Services', content: 'Landscape design, delivery, and planting' },
      { type: 'about', title: 'Nursery', content: 'Growing since 1985' },
      { type: 'contact', title: 'Visit', content: 'Greenhouse location and seasonal hours' },
    ]),
    style: { primaryColor: '#166534', secondaryColor: '#a16207', fontFamily: 'Lora', theme: 'classic', mood: 'natural' },
    popular: false, featured: false, createdAt: '2024-08-12',
  },
  {
    id: 'tpl-hardware-4', name: 'PlumbPro Supply', description: 'A professional template for plumbing and electrical supply stores serving contractors and homeowners.',
    category: 'hardware', preview: '/templates/plumbpro-supply.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Pro Supplies', content: 'Commercial-grade plumbing and electrical supplies' },
      { type: 'products', title: 'Inventory', content: 'Pipes, fittings, wire, panels, and fixtures' },
      { type: 'services', title: 'Pro Services', content: 'Contractor accounts, bulk pricing, and delivery' },
      { type: 'about', title: 'About', content: 'Trusted by professionals for 25 years' },
      { type: 'contact', title: 'Contact', content: 'Trade counter hours and contractor signup' },
    ]),
    style: { primaryColor: '#1e3a5f', secondaryColor: '#3b82f6', fontFamily: 'Roboto', theme: 'modern', mood: 'professional' },
    popular: false, featured: false, createdAt: '2024-08-18',
  },
  {
    id: 'tpl-hardware-5', name: 'Smart Home Depot', description: 'A modern template for home improvement superstores with organized departments and project guides.',
    category: 'hardware', preview: '/templates/smart-home-depot.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Home Improvement', content: 'One-stop shop for every home project' },
      { type: 'products', title: 'Departments', content: 'Lumber, tools, paint, flooring, and appliances' },
      { type: 'services', title: 'Services', content: 'Installation, rental, and design consultation' },
      { type: 'features', title: 'Why Us', content: 'Price match, free delivery on orders over $50' },
      { type: 'faq', title: 'FAQ', content: 'Return policy, warranties, and financing' },
      { type: 'contact', title: 'Visit', content: 'Store locator and hours' },
    ]),
    style: { primaryColor: '#dc2626', secondaryColor: '#f59e0b', fontFamily: 'Inter', theme: 'bold', mood: 'reliable' },
    popular: true, featured: false, createdAt: '2024-08-24',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEDICAL (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-medical-1', name: 'Medical Care', description: 'A clean, professional template for medical clinics with trust-inspiring design and intuitive navigation.',
    category: 'medical', preview: '/templates/medical-care.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Your Health', content: 'Compassionate healthcare for your entire family' },
      { type: 'about', title: 'About Us', content: 'Board-certified physicians since 2005' },
      { type: 'services', title: 'Services', content: 'General practice, diagnostics, and preventive care' },
      { type: 'team', title: 'Our Doctors', content: 'Meet our experienced medical team' },
      { type: 'faq', title: 'FAQ', content: 'Insurance, appointments, and preparation' },
      { type: 'contact', title: 'Contact', content: 'Appointment scheduling and directions' },
    ]),
    style: { primaryColor: '#0d9488', secondaryColor: '#22d3ee', fontFamily: 'Nunito', theme: 'modern', mood: 'clean' },
    popular: true, featured: false, createdAt: '2024-08-30',
  },
  {
    id: 'tpl-medical-2', name: 'Dental Smile', description: 'A bright, friendly template for dental practices with emphasis on patient comfort and modern care.',
    category: 'medical', preview: '/templates/dental-smile.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Your Smile', content: 'Gentle dental care for the whole family' },
      { type: 'services', title: 'Treatments', content: 'Cleanings, fillings, whitening, orthodontics, implants' },
      { type: 'team', title: 'Our Dentists', content: 'Experienced and gentle dental professionals' },
      { type: 'testimonials', title: 'Patient Stories', content: 'Smile transformations and patient reviews' },
      { type: 'cta', title: 'New Patient', content: 'Special offer for first-time patients' },
      { type: 'contact', title: 'Book', content: 'Online appointment scheduling' },
    ]),
    style: { primaryColor: '#0891b2', secondaryColor: '#a5f3fc', fontFamily: 'DM Sans', theme: 'modern', mood: 'friendly' },
    popular: true, featured: false, createdAt: '2024-09-06',
  },
  {
    id: 'tpl-medical-3', name: 'VetCare Clinic', description: 'A warm, caring template for veterinary clinics and pet hospitals with playful animal-themed elements.',
    category: 'medical', preview: '/templates/vetcare-clinic.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Pet Wellness', content: 'Expert veterinary care for your furry family members' },
      { type: 'services', title: 'Services', content: 'Wellness exams, surgery, dental, vaccinations' },
      { type: 'team', title: 'Our Vets', content: 'Compassionate, experienced veterinarians' },
      { type: 'testimonials', title: 'Pet Parents', content: 'Reviews from happy pet owners' },
      { type: 'faq', title: 'FAQ', content: 'After-hours care, pricing, and pet insurance' },
      { type: 'contact', title: 'Emergency', content: '24/7 emergency line and appointments' },
    ]),
    style: { primaryColor: '#16a34a', secondaryColor: '#86efac', fontFamily: 'Nunito', theme: 'minimal', mood: 'caring' },
    popular: false, featured: false, createdAt: '2024-09-12',
  },
  {
    id: 'tpl-medical-4', name: 'PhysioActive', description: 'A dynamic, energetic template for physiotherapy and sports medicine clinics with active lifestyle imagery.',
    category: 'medical', preview: '/templates/physioactive.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Move Freely', content: 'Expert physiotherapy to get you back to doing what you love' },
      { type: 'services', title: 'Treatments', content: 'Sports rehab, manual therapy, dry needling, exercise programs' },
      { type: 'about', title: 'Our Approach', content: 'Evidence-based, patient-centered care' },
      { type: 'team', title: 'Therapists', content: 'Registered physiotherapists and sports specialists' },
      { type: 'testimonials', title: 'Recovery Stories', content: 'Patient success stories' },
      { type: 'contact', title: 'Book', content: 'Online booking and clinic locations' },
    ]),
    style: { primaryColor: '#059669', secondaryColor: '#f59e0b', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'energetic' },
    popular: false, featured: false, createdAt: '2024-09-18',
  },
  {
    id: 'tpl-medical-5', name: 'EyeCare Optometry', description: 'A crisp, clean template for optometry practices and eyewear boutiques with emphasis on style and clarity.',
    category: 'medical', preview: '/templates/eyecare-optometry.jpg',
    sections: makeSections([
      { type: 'hero', title: 'See Clearly', content: 'Comprehensive eye care and designer eyewear' },
      { type: 'products', title: 'Eyewear', content: 'Glasses, sunglasses, and contact lenses' },
      { type: 'services', title: 'Eye Care', content: 'Eye exams, LASIK consultation, pediatric eye care' },
      { type: 'about', title: 'Our Practice', content: 'Serving the community for 20 years' },
      { type: 'cta', title: 'Free Exam', content: 'Complimentary eye exam with purchase' },
      { type: 'contact', title: 'Book', content: 'Appointment scheduling and insurance info' },
    ]),
    style: { primaryColor: '#1e40af', secondaryColor: '#93c5fd', fontFamily: 'Inter', theme: 'modern', mood: 'professional' },
    popular: false, featured: false, createdAt: '2024-09-24',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BOUTIQUE (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-boutique-1', name: 'Luxe Accessories', description: 'A premium template for jewelry and accessories boutiques with gold accents and elegant layouts.',
    category: 'boutique', preview: '/templates/luxe-accessories.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Timeless Elegance', content: 'Handcrafted jewelry and accessories for every occasion' },
      { type: 'products', title: 'Collections', content: 'Necklaces, rings, earrings, bracelets, and handbags' },
      { type: 'about', title: 'Artisans', content: 'Every piece tells a story of craftsmanship' },
      { type: 'gallery', title: 'Gallery', content: 'Our exquisite jewelry showcase' },
      { type: 'testimonials', title: 'Clients', content: 'Treasured by our customers' },
      { type: 'contact', title: 'Visit', content: 'Boutique location and private shopping' },
    ]),
    style: { primaryColor: '#b8860b', secondaryColor: '#f5f5dc', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'luxurious' },
    popular: true, featured: true, createdAt: '2024-09-30',
  },
  {
    id: 'tpl-boutique-2', name: 'Home Decor Studio', description: 'A warm, inviting template for home decor and interior design boutiques with lifestyle photography.',
    category: 'boutique', preview: '/templates/home-decor-studio.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Beautiful Spaces', content: 'Curated home decor for modern living' },
      { type: 'products', title: 'Shop', content: 'Furniture, lighting, textiles, and accessories' },
      { type: 'about', title: 'Our Eye', content: 'Interior design expertise since 2012' },
      { type: 'gallery', title: 'Inspiration', content: 'Styled room shots and design ideas' },
      { type: 'services', title: 'Design Service', content: 'Free in-store design consultations' },
      { type: 'contact', title: 'Visit', content: 'Showroom location and hours' },
    ]),
    style: { primaryColor: '#92400e', secondaryColor: '#d4a853', fontFamily: 'Lora', theme: 'classic', mood: 'warm' },
    popular: false, featured: false, createdAt: '2024-10-07',
  },
  {
    id: 'tpl-boutique-3', name: 'Artisan Candle Co.', description: 'A cozy, atmospheric template for candle makers and fragrance boutiques with warm, glowing aesthetics.',
    category: 'boutique', preview: '/templates/artisan-candle-co.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Light & Scent', content: 'Hand-poured artisan candles and home fragrances' },
      { type: 'products', title: 'Collection', content: 'Soy candles, wax melts, diffusers, and gift sets' },
      { type: 'about', title: 'Our Craft', content: 'Small-batch, sustainable, and beautifully fragranced' },
      { type: 'gallery', title: 'Gallery', content: 'Our candles in beautiful settings' },
      { type: 'testimonials', title: 'Reviews', content: 'Customers love our scents' },
      { type: 'contact', title: 'Shop', content: 'Online store and market schedule' },
    ]),
    style: { primaryColor: '#9a3412', secondaryColor: '#fbbf24', fontFamily: 'DM Sans', theme: 'elegant', mood: 'cozy' },
    popular: false, featured: false, createdAt: '2024-10-13',
  },
  {
    id: 'tpl-boutique-4', name: 'Watch Collector', description: 'A sophisticated template for watch boutiques and luxury timepiece retailers with refined dark design.',
    category: 'boutique', preview: '/templates/watch-collector.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Timeless Pieces', content: 'Luxury watches for collectors and connoisseurs' },
      { type: 'products', title: 'Timepieces', content: 'Automatic, chronograph, diver, and dress watches' },
      { type: 'about', title: 'Our Passion', content: 'Curating the finest timepieces since 1995' },
      { type: 'services', title: 'Services', content: 'Watch servicing, appraisal, and authentication' },
      { type: 'gallery', title: 'Showcase', content: 'Macro photography of our finest pieces' },
      { type: 'contact', title: 'Visit', content: 'Private viewing appointments' },
    ]),
    style: { primaryColor: '#1c1917', secondaryColor: '#d4a853', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'prestigious' },
    popular: false, featured: false, createdAt: '2024-10-19',
  },
  {
    id: 'tpl-boutique-5', name: 'Gift Box Boutique', description: 'A cheerful, colorful template for gift shops and curated gift box services.',
    category: 'boutique', preview: '/templates/gift-box-boutique.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Perfect Gifts', content: 'Curated gift boxes for every occasion' },
      { type: 'products', title: 'Gift Boxes', content: 'Birthday, wedding, corporate, and holiday collections' },
      { type: 'about', title: 'How It Works', content: 'Select, customize, and we deliver' },
      { type: 'testimonials', title: 'Happy Recipients', content: 'Gift box reviews' },
      { type: 'cta', title: 'Corporate', content: 'Bulk orders and custom corporate gifting' },
      { type: 'contact', title: 'Order', content: 'Custom orders and inquiries' },
    ]),
    style: { primaryColor: '#e11d48', secondaryColor: '#fbbf24', fontFamily: 'Nunito', theme: 'bold', mood: 'festive' },
    popular: true, featured: false, createdAt: '2024-10-25',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE (5 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-service-1', name: 'Service Pro', description: 'A professional template for service businesses and consultants with polished design and clear CTAs.',
    category: 'service', preview: '/templates/service-pro.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Expert Services', content: 'Professional solutions tailored to your business' },
      { type: 'about', title: 'About', content: '10+ years delivering exceptional results' },
      { type: 'services', title: 'Our Services', content: 'Strategy, implementation, and support' },
      { type: 'testimonials', title: 'Testimonials', content: 'Client success stories' },
      { type: 'faq', title: 'FAQ', content: 'Pricing, process, and timelines' },
      { type: 'cta', title: 'Get Started', content: 'Book your free consultation' },
      { type: 'contact', title: 'Contact', content: 'Contact form and details' },
    ]),
    style: { primaryColor: '#475569', secondaryColor: '#64748b', fontFamily: 'Inter', theme: 'classic', mood: 'professional' },
    popular: true, featured: false, createdAt: '2024-10-31',
  },
  {
    id: 'tpl-service-2', name: 'Legal Associates', description: 'A dignified, authoritative template for law firms and legal services with emphasis on trust and expertise.',
    category: 'service', preview: '/templates/legal-associates.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Legal Excellence', content: 'Trusted legal counsel for individuals and businesses' },
      { type: 'about', title: 'Our Firm', content: 'Over 30 years of combined legal experience' },
      { type: 'services', title: 'Practice Areas', content: 'Corporate, family, real estate, and criminal law' },
      { type: 'team', title: 'Attorneys', content: 'Our experienced legal team' },
      { type: 'testimonials', title: 'Client Reviews', content: 'How we\'ve helped our clients' },
      { type: 'faq', title: 'FAQ', content: 'Consultation process and fees' },
      { type: 'contact', title: 'Consult', content: 'Schedule a confidential consultation' },
    ]),
    style: { primaryColor: '#1e293b', secondaryColor: '#94a3b8', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'authoritative' },
    popular: false, featured: false, createdAt: '2024-11-06',
  },
  {
    id: 'tpl-service-3', name: 'Creative Agency', description: 'A bold, portfolio-focused template for design agencies and creative studios with visual impact.',
    category: 'service', preview: '/templates/creative-agency.jpg',
    sections: makeSections([
      { type: 'hero', title: 'We Create', content: 'Branding, design, and digital experiences' },
      { type: 'about', title: 'Our Story', content: 'Award-winning creative team since 2015' },
      { type: 'services', title: 'Services', content: 'Brand identity, web design, UI/UX, motion graphics' },
      { type: 'gallery', title: 'Portfolio', content: 'Our latest projects and case studies' },
      { type: 'team', title: 'Team', content: 'Meet our creative minds' },
      { type: 'cta', title: 'Start a Project', content: 'Tell us about your vision' },
      { type: 'contact', title: 'Contact', content: 'Get in touch' },
    ]),
    style: { primaryColor: '#7c3aed', secondaryColor: '#06b6d4', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'creative' },
    popular: true, featured: true, createdAt: '2024-11-13',
  },
  {
    id: 'tpl-service-4', name: 'CleanPro Services', description: 'A fresh, clean template for cleaning services and maintenance companies with trust-building elements.',
    category: 'service', preview: '/templates/cleanpro-services.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Sparkling Clean', content: 'Professional residential and commercial cleaning' },
      { type: 'services', title: 'Services', content: 'Regular cleaning, deep clean, move-in/out, office cleaning' },
      { type: 'features', title: 'Why Us', content: 'Insured, bonded, eco-friendly products' },
      { type: 'testimonials', title: 'Reviews', content: 'Hundreds of 5-star reviews' },
      { type: 'pricing', title: 'Pricing', content: 'Transparent pricing with no hidden fees' },
      { type: 'contact', title: 'Book', content: 'Get a free quote in minutes' },
    ]),
    style: { primaryColor: '#0d9488', secondaryColor: '#a7f3d0', fontFamily: 'Nunito', theme: 'minimal', mood: 'fresh' },
    popular: false, featured: false, createdAt: '2024-11-19',
  },
  {
    id: 'tpl-service-5', name: 'FitLife Coaching', description: 'An energetic template for personal trainers and fitness coaches with motivational design.',
    category: 'service', preview: '/templates/fitlife-coaching.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Transform', content: 'Personalized fitness coaching for lasting results' },
      { type: 'services', title: 'Programs', content: '1-on-1 training, group classes, online coaching' },
      { type: 'about', title: 'Your Coach', content: 'Certified personal trainer with 500+ clients' },
      { type: 'testimonials', title: 'Success Stories', content: 'Real transformations' },
      { type: 'gallery', title: 'Gallery', content: 'Training sessions and gym photos' },
      { type: 'cta', title: 'Free Trial', content: 'Start with a complimentary session' },
      { type: 'contact', title: 'Contact', content: 'Book your free consultation' },
    ]),
    style: { primaryColor: '#dc2626', secondaryColor: '#f97316', fontFamily: 'Rajdhani', theme: 'bold', mood: 'energetic' },
    popular: false, featured: false, createdAt: '2024-11-25',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OTHER / GENERAL (8 templates)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'tpl-other-1', name: 'Wedding Planner', description: 'A romantic, elegant template for wedding planners and event coordinators with soft, dreamy aesthetics.',
    category: 'other', preview: '/templates/wedding-planner.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Your Perfect Day', content: 'Full-service wedding planning and coordination' },
      { type: 'about', title: 'Our Story', content: 'Creating dream weddings since 2010' },
      { type: 'services', title: 'Packages', content: 'Full planning, day-of coordination, partial planning' },
      { type: 'gallery', title: 'Portfolio', content: 'Stunning weddings we\'ve created' },
      { type: 'testimonials', title: 'Love Stories', content: 'Testimonials from happy couples' },
      { type: 'cta', title: 'Consultation', content: 'Book your complimentary consultation' },
      { type: 'contact', title: 'Contact', content: 'Get in touch with our team' },
    ]),
    style: { primaryColor: '#be185d', secondaryColor: '#f9a8d4', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'romantic' },
    popular: true, featured: false, createdAt: '2024-12-01',
  },
  {
    id: 'tpl-other-2', name: 'Real Estate Elite', description: 'A premium template for real estate agents and property firms with property listing layouts and search.',
    category: 'other', preview: '/templates/real-estate-elite.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Find Home', content: 'Luxury properties and expert real estate guidance' },
      { type: 'products', title: 'Listings', content: 'Featured properties and new listings' },
      { type: 'about', title: 'About Agent', content: 'Top-rated agent with $100M+ in sales' },
      { type: 'testimonials', title: 'Client Stories', content: 'Homebuyers and sellers share their experience' },
      { type: 'services', title: 'Services', content: 'Buying, selling, and property management' },
      { type: 'contact', title: 'Contact', content: 'Schedule a viewing or listing appointment' },
    ]),
    style: { primaryColor: '#1e3a5f', secondaryColor: '#d4a853', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'luxurious' },
    popular: true, featured: false, createdAt: '2024-12-07',
  },
  {
    id: 'tpl-other-3', name: 'Photography Studio', description: 'A visual-first template for photography studios and freelance photographers with stunning portfolio layouts.',
    category: 'other', preview: '/templates/photography-studio.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Captured Moments', content: 'Professional photography for life\'s milestones' },
      { type: 'services', title: 'Services', content: 'Weddings, portraits, commercial, and events' },
      { type: 'gallery', title: 'Portfolio', content: 'Our best work across all categories' },
      { type: 'about', title: 'The Photographer', content: 'Award-winning photographer with 15 years experience' },
      { type: 'testimonials', title: 'Clients', content: 'What our clients say' },
      { type: 'pricing', title: 'Investment', content: 'Packages and pricing' },
      { type: 'contact', title: 'Book', content: 'Inquire about your session' },
    ]),
    style: { primaryColor: '#111827', secondaryColor: '#9ca3af', fontFamily: 'Inter', theme: 'minimal', mood: 'artistic' },
    popular: true, featured: false, createdAt: '2024-12-14',
  },
  {
    id: 'tpl-other-4', name: 'Music Academy', description: 'A vibrant, creative template for music schools and academies with engaging course displays.',
    category: 'other', preview: '/templates/music-academy.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Learn Music', content: 'Expert music instruction for all ages and skill levels' },
      { type: 'services', title: 'Lessons', content: 'Piano, guitar, drums, vocals, and music theory' },
      { type: 'about', title: 'Our Teachers', content: 'Conservatory-trained professional musicians' },
      { type: 'testimonials', title: 'Students', content: 'Student success stories and recitals' },
      { type: 'gallery', title: 'Recitals', content: 'Performance photos and concert recordings' },
      { type: 'cta', title: 'Free Trial', content: 'Book your first lesson free' },
      { type: 'contact', title: 'Enroll', content: 'Registration and contact info' },
    ]),
    style: { primaryColor: '#7c3aed', secondaryColor: '#f59e0b', fontFamily: 'DM Sans', theme: 'bold', mood: 'creative' },
    popular: false, featured: false, createdAt: '2024-12-20',
  },
  {
    id: 'tpl-other-5', name: 'Yoga & Meditation', description: 'A peaceful, zen-inspired template for yoga studios and meditation centers with calming design.',
    category: 'other', preview: '/templates/yoga-meditation.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Inner Peace', content: 'Yoga and meditation for body, mind, and spirit' },
      { type: 'services', title: 'Classes', content: 'Vinyasa, Hatha, Yin, Meditation, and Breathwork' },
      { type: 'about', title: 'Our Studio', content: 'A sanctuary of calm in the heart of the city' },
      { type: 'team', title: 'Teachers', content: 'Our certified yoga instructors' },
      { type: 'pricing', title: 'Pricing', content: 'Drop-in, class packs, and unlimited memberships' },
      { type: 'cta', title: 'First Class Free', content: 'Experience our studio' },
      { type: 'contact', title: 'Find Us', content: 'Schedule and location' },
    ]),
    style: { primaryColor: '#5b21b6', secondaryColor: '#c4b5fd', fontFamily: 'Lora', theme: 'minimal', mood: 'peaceful' },
    popular: false, featured: false, createdAt: '2024-12-26',
  },
  {
    id: 'tpl-other-6', name: 'Childcare Center', description: 'A warm, friendly template for daycare centers and preschools with parent-focused features.',
    category: 'other', preview: '/templates/childcare-center.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Happy Kids', content: 'Safe, nurturing childcare for children 6 months to 6 years' },
      { type: 'about', title: 'Our Approach', content: 'Play-based learning in a loving environment' },
      { type: 'services', title: 'Programs', content: 'Infant, toddler, and preschool programs' },
      { type: 'gallery', title: 'Facility', content: 'Tour our bright, colorful classrooms and playground' },
      { type: 'team', title: 'Caregivers', content: 'Our certified early childhood educators' },
      { type: 'faq', title: 'FAQ', content: 'Hours, meals, naps, and enrollment' },
      { type: 'contact', title: 'Enroll', content: 'Schedule a tour and registration' },
    ]),
    style: { primaryColor: '#f59e0b', secondaryColor: '#fbbf24', fontFamily: 'Nunito', theme: 'modern', mood: 'playful' },
    popular: false, featured: false, createdAt: '2025-01-01',
  },
  {
    id: 'tpl-other-7', name: 'Auto Detailing', description: 'A sleek, professional template for car detailing and auto services with dark automotive styling.',
    category: 'other', preview: '/templates/auto-detailing.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Showroom Shine', content: 'Premium auto detailing and ceramic coating' },
      { type: 'services', title: 'Packages', content: 'Express, full detail, ceramic coating, and paint correction' },
      { type: 'gallery', title: 'Results', content: 'Before & after transformations' },
      { type: 'testimonials', title: 'Reviews', content: 'Car enthusiasts trust us' },
      { type: 'pricing', title: 'Pricing', content: 'Transparent package pricing' },
      { type: 'contact', title: 'Book', content: 'Schedule your detail appointment' },
    ]),
    style: { primaryColor: '#0f172a', secondaryColor: '#dc2626', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'sleek' },
    popular: false, featured: false, createdAt: '2025-01-07',
  },
  {
    id: 'tpl-other-8', name: 'Coffee Roasters', description: 'A rich, aromatic template for coffee roasters and specialty cafes with warm, inviting design.',
    category: 'other', preview: '/templates/coffee-roasters.jpg',
    sections: makeSections([
      { type: 'hero', title: 'Fresh Roasted', content: 'Single-origin specialty coffee roasted in small batches' },
      { type: 'products', title: 'Coffee', content: 'Light, medium, and dark roasts from 12 countries' },
      { type: 'about', title: 'Our Roastery', content: 'From green bean to your cup, we obsess over quality' },
      { type: 'services', title: 'Wholesale', content: 'Wholesale accounts for cafes and restaurants' },
      { type: 'gallery', title: 'Gallery', content: 'Roastery, cafe, and latte art' },
      { type: 'contact', title: 'Visit', content: 'Cafe location, hours, and online ordering' },
    ]),
    style: { primaryColor: '#78350f', secondaryColor: '#a16207', fontFamily: 'Lora', theme: 'classic', mood: 'warm' },
    popular: true, featured: false, createdAt: '2025-01-14',
  },
];
