'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Globe,
  Rocket,
  Share2,
  Download,
  Pencil,
  Layers,
  Sparkles,
  ArrowRight,
  GripVertical,
  Image,
  LayoutGrid,
  Quote,
  Phone,
  Clock,
  MapPin,
  Mail,
  MessageCircle,
  UserCircle,
  Minus,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import type { StorefrontSection } from '@/lib/types';

// =============================================================================
// Mock Bakery Storefront HTML
// =============================================================================

const MOCK_BAKERY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sweet Dreams Bakery</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #2d1b0e; background: #fffaf5; }

  /* Hero */
  .hero {
    background: linear-gradient(135deg, #8B4513 0%, #D2691E 40%, #F4A460 100%);
    padding: 80px 20px;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%);
    animation: shimmer 8s ease-in-out infinite;
  }
  @keyframes shimmer { 0%,100% { transform: translate(0,0); } 50% { transform: translate(5%,5%); } }
  .hero h1 { font-size: 3.2em; font-weight: 800; margin-bottom: 12px; position: relative; text-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .hero p { font-size: 1.2em; opacity: 0.92; max-width: 550px; margin: 0 auto 30px; position: relative; line-height: 1.6; }
  .hero-btn {
    display: inline-block;
    background: white;
    color: #8B4513;
    padding: 14px 36px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 700;
    font-size: 1em;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    position: relative;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(0,0,0,0.2); }

  /* About */
  .about {
    padding: 70px 20px;
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }
  .about h2 { font-size: 2em; color: #8B4513; margin-bottom: 16px; }
  .about p { color: #6b4c3b; line-height: 1.8; font-size: 1.05em; max-width: 700px; margin: 0 auto; }
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    margin-top: 40px;
    text-align: center;
  }
  .feature-item {
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(139,69,19,0.08);
    border: 1px solid #f0e6d8;
  }
  .feature-icon { font-size: 2em; margin-bottom: 12px; }
  .feature-item h3 { color: #8B4513; margin-bottom: 8px; font-size: 1.1em; }
  .feature-item p { color: #9b7d6b; font-size: 0.9em; }

  /* Products */
  .products {
    padding: 70px 20px;
    background: #f5ebe0;
  }
  .products-inner { max-width: 1100px; margin: 0 auto; }
  .products h2 { text-align: center; font-size: 2em; color: #8B4513; margin-bottom: 40px; }
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 28px;
  }
  .product-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(139,69,19,0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(139,69,19,0.15); }
  .product-img {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3.5em;
  }
  .product-img.cakes { background: linear-gradient(135deg, #ffecd2, #fcb69f); }
  .product-img.cookies { background: linear-gradient(135deg, #f6d365, #fda085); }
  .product-img.pastries { background: linear-gradient(135deg, #ffecd2, #a8e6cf); }
  .product-info { padding: 20px; }
  .product-info h3 { color: #8B4513; font-size: 1.15em; margin-bottom: 6px; }
  .product-info p { color: #9b7d6b; font-size: 0.9em; line-height: 1.5; margin-bottom: 12px; }
  .product-price {
    display: inline-block;
    background: linear-gradient(135deg, #8B4513, #D2691E);
    color: white;
    padding: 6px 18px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 0.95em;
  }

  /* Testimonials */
  .testimonials { padding: 70px 20px; max-width: 900px; margin: 0 auto; text-align: center; }
  .testimonials h2 { font-size: 2em; color: #8B4513; margin-bottom: 40px; }
  .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .testimonial-card {
    background: white;
    padding: 28px;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(139,69,19,0.08);
    border: 1px solid #f0e6d8;
    text-align: left;
  }
  .stars { color: #f59e0b; font-size: 1.1em; margin-bottom: 12px; }
  .testimonial-card p { color: #6b4c3b; line-height: 1.7; font-style: italic; margin-bottom: 16px; }
  .reviewer { display: flex; align-items: center; gap: 12px; }
  .reviewer-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8B4513, #D2691E);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 0.85em;
  }
  .reviewer-name { font-weight: 600; color: #8B4513; font-size: 0.95em; }
  .reviewer-title { color: #9b7d6b; font-size: 0.8em; }

  /* Contact */
  .contact {
    padding: 70px 20px;
    background: linear-gradient(135deg, #3e2723, #5d4037);
    color: white;
  }
  .contact-inner {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 40px;
  }
  .contact h2 { font-size: 2em; margin-bottom: 30px; grid-column: 1 / -1; text-align: center; }
  .contact-item { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
  .contact-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    flex-shrink: 0;
  }
  .contact-item h4 { font-size: 0.95em; margin-bottom: 4px; opacity: 0.7; }
  .contact-item p { font-weight: 600; font-size: 1em; }
  .hours-table { width: 100%; }
  .hours-table td { padding: 4px 0; font-size: 0.9em; }
  .hours-table td:first-child { opacity: 0.7; padding-right: 16px; }

  /* Footer */
  .footer {
    padding: 30px 20px;
    background: #2d1b0e;
    color: rgba(255,255,255,0.5);
    text-align: center;
    font-size: 0.85em;
  }
  .footer a { color: #D2691E; text-decoration: none; }

  @media (max-width: 600px) {
    .hero h1 { font-size: 2.2em; }
    .hero { padding: 50px 16px; }
    .about, .products, .testimonials, .contact { padding: 40px 16px; }
  }
</style>
</head>
<body>

<!-- Hero Section -->
<section class="hero">
  <h1>&#127856; Sweet Dreams Bakery</h1>
  <p>Handcrafted with love since 2010. From artisan breads to decadent cakes, every bite tells a story of passion and tradition.</p>
  <a href="#products" class="hero-btn">Explore Our Menu</a>
</section>

<!-- About Section -->
<section class="about">
  <h2>&#127757; Our Story</h2>
  <p>What started as a small family kitchen has blossomed into the most beloved bakery in town. We believe in using only the finest ingredients — locally sourced butter, organic flour, and farm-fresh eggs — to create treats that warm your soul.</p>
  <div class="features">
    <div class="feature-item">
      <div class="feature-icon">&#127858;</div>
      <h3>Fresh Daily</h3>
      <p>Everything baked from scratch every morning before dawn</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">&#127793;</div>
      <h3>Organic Ingredients</h3>
      <p>Locally sourced, premium quality ingredients in every recipe</p>
    </div>
    <div class="feature-item">
      <div class="feature-icon">&#10024;</div>
      <h3>Custom Orders</h3>
      <p>Personalized cakes and pastries for your special occasions</p>
    </div>
  </div>
</section>

<!-- Products Section -->
<section class="products" id="products">
  <div class="products-inner">
    <h2>&#128073; Our Favorites</h2>
    <div class="product-grid">
      <div class="product-card">
        <div class="product-img cakes">&#127856;</div>
        <div class="product-info">
          <h3>Chocolate Dream Cake</h3>
          <p>Three layers of rich chocolate sponge with Belgian chocolate ganache</p>
          <span class="product-price">$42.00</span>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img cookies">&#127850;</div>
        <div class="product-info">
          <h3>Artisan Cookie Box</h3>
          <p>Assorted hand-decorated cookies with unique seasonal flavors</p>
          <span class="product-price">$18.00</span>
        </div>
      </div>
      <div class="product-card">
        <div class="product-img pastries">&#127856;</div>
        <div class="product-info">
          <h3>French Croissant Assortment</h3>
          <p>Buttery, flaky croissants — plain, almond, and chocolate</p>
          <span class="product-price">$16.00</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Testimonials -->
<section class="testimonials">
  <h2>&#128172; What People Say</h2>
  <div class="testimonial-grid">
    <div class="testimonial-card">
      <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p>"The best cakes I have ever tasted! They made our wedding cake and it was absolutely perfect. Every guest asked where we ordered it."</p>
      <div class="reviewer">
        <div class="reviewer-avatar">SM</div>
        <div>
          <div class="reviewer-name">Sarah Mitchell</div>
          <div class="reviewer-title">Wedding Client</div>
        </div>
      </div>
    </div>
    <div class="testimonial-card">
      <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p>"Their croissants rival any I had in Paris. The buttery layers just melt in your mouth. My family drives 30 minutes every weekend."</p>
      <div class="reviewer">
        <div class="reviewer-avatar">JC</div>
        <div>
          <div class="reviewer-name">James Chen</div>
          <div class="reviewer-title">Regular Customer</div>
        </div>
      </div>
    </div>
    <div class="testimonial-card">
      <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
      <p>"I ordered custom cookies for my daughter's birthday and they were stunning. Beautiful designs and incredibly delicious. Highly recommend!"</p>
      <div class="reviewer">
        <div class="reviewer-avatar">ER</div>
        <div>
          <div class="reviewer-name">Emily Rodriguez</div>
          <div class="reviewer-title">Happy Parent</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section class="contact">
  <h2>&#128205; Visit Us</h2>
  <div class="contact-inner">
    <div>
      <div class="contact-item">
        <div class="contact-icon">&#128205;</div>
        <div>
          <h4>Address</h4>
          <p>123 Baker Street, Sweetville, CA 90210</p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">&#128222;</div>
        <div>
          <h4>Phone</h4>
          <p>(555) 123-4567</p>
        </div>
      </div>
      <div class="contact-item">
        <div class="contact-icon">&#9993;</div>
        <div>
          <h4>Email</h4>
          <p>hello@sweetdreamsbakery.com</p>
        </div>
      </div>
    </div>
    <div>
      <div class="contact-item">
        <div class="contact-icon">&#128336;</div>
        <div>
          <h4>Hours</h4>
          <table class="hours-table">
            <tr><td>Mon – Fri</td><td>7:00 AM – 7:00 PM</td></tr>
            <tr><td>Saturday</td><td>8:00 AM – 6:00 PM</td></tr>
            <tr><td>Sunday</td><td>9:00 AM – 4:00 PM</td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="footer">
  <p>&#169; 2024 Sweet Dreams Bakery. All rights reserved. Made with &#10084;&#65039; by <a href="#">StoreCraft AI</a></p>
</footer>

</body>
</html>`;

// =============================================================================
// Mock Sections Data
// =============================================================================

const MOCK_SECTIONS: StorefrontSection[] = [
  {
    id: 'hero',
    type: 'hero',
    title: 'Hero Banner',
    content: 'Main hero with bakery branding and CTA',
    order: 0,
    visible: true,
    config: {},
  },
  {
    id: 'about',
    type: 'about',
    title: 'About Us',
    content: 'Our story and key features',
    order: 1,
    visible: true,
    config: {},
  },
  {
    id: 'products',
    type: 'products',
    title: 'Products',
    content: 'Featured products grid with prices',
    order: 2,
    visible: true,
    config: {},
  },
  {
    id: 'testimonials',
    type: 'testimonials',
    title: 'Testimonials',
    content: 'Customer reviews and ratings',
    order: 3,
    visible: true,
    config: {},
  },
  {
    id: 'contact',
    type: 'contact',
    title: 'Contact & Hours',
    content: 'Location, phone, email, and business hours',
    order: 4,
    visible: true,
    config: {},
  },
  {
    id: 'footer',
    type: 'footer',
    title: 'Footer',
    content: 'Copyright and credits',
    order: 5,
    visible: true,
    config: {},
  },
];

// =============================================================================
// Section Type Icons
// =============================================================================

const sectionIcons: Record<string, React.ElementType> = {
  hero: Sparkles,
  about: UserCircle,
  products: LayoutGrid,
  services: Layers,
  testimonials: Quote,
  contact: Phone,
  gallery: Image,
  hours: Clock,
  map: MapPin,
  footer: Minus,
  cta: ArrowRight,
  team: UserCircle,
  faq: MessageCircle,
};

// =============================================================================
// Default business profile for generation when none exists
// =============================================================================

const DEFAULT_BUSINESS_PROFILE = {
  name: 'Sweet Dreams Bakery',
  category: 'bakery',
  description: 'A charming local bakery specializing in artisan breads, custom cakes, and freshly baked pastries. We use organic, locally-sourced ingredients to craft treats that bring joy to every occasion.',
  location: '123 Baker Street, Sweetville, CA 90210',
  phone: '(555) 123-4567',
  email: 'hello@sweetdreamsbakery.com',
  hours: 'Mon-Fri 7AM-7PM, Sat 8AM-6PM, Sun 9AM-4PM',
  products: [
    { name: 'Chocolate Dream Cake', description: 'Three layers of rich chocolate sponge with Belgian chocolate ganache', price: '$42.00', category: 'Cakes' },
    { name: 'Artisan Cookie Box', description: 'Assorted hand-decorated cookies with unique seasonal flavors', price: '$18.00', category: 'Cookies' },
    { name: 'French Croissant Assortment', description: 'Buttery, flaky croissants — plain, almond, and chocolate', price: '$16.00', category: 'Pastries' },
  ],
  services: [
    { name: 'Custom Cake Design', description: 'Personalized cakes for weddings, birthdays, and special events' },
    { name: 'Catering', description: 'Full-service bakery catering for events and corporate functions' },
  ],
  style: {
    primaryColor: '#8B4513',
    secondaryColor: '#D2691E',
    fontFamily: 'Segoe UI',
    theme: 'elegant',
    mood: 'warm',
  },
  features: ['Fresh Daily Baking', 'Organic Ingredients', 'Custom Orders', 'Delivery Available'],
};

// =============================================================================
// Sortable Section Item
// =============================================================================

function SortableSectionItem({
  section,
  onToggleVisibility,
}: {
  section: StorefrontSection;
  onToggleVisibility: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const Icon = sectionIcons[section.type] || Layers;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 group cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg border-violet-500/50 bg-accent',
        !section.visible && 'opacity-50'
      )}
    >
      <button
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
        section.visible
          ? 'bg-violet-500/10 text-violet-400'
          : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className={cn(
        'flex-1 text-sm font-medium truncate',
        !section.visible && 'text-muted-foreground line-through'
      )}>
        {section.title}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => onToggleVisibility(section.id)}>
            <Switch
              checked={section.visible}
              onCheckedChange={() => onToggleVisibility(section.id)}
              className="scale-75"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {section.visible ? 'Hide section' : 'Show section'}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

// =============================================================================
// Device Switcher
// =============================================================================

function DeviceSwitcher() {
  const { previewDevice, setPreviewDevice } = useAppStore();

  const devices = [
    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile', width: '375px' },
    { id: 'tablet' as const, icon: Tablet, label: 'Tablet', width: '768px' },
    { id: 'desktop' as const, icon: Monitor, label: 'Desktop', width: '100%' },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {devices.map((device) => {
        const isActive = previewDevice === device.id;
        const Icon = device.icon;
        return (
          <Tooltip key={device.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-md transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setPreviewDevice(device.id)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {device.label} {device.id !== 'desktop' && `(${device.width})`}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState() {
  const { setCurrentView, businessProfile } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWithAI = useCallback(async () => {
    setIsGenerating(true);
    try {
      const profile = businessProfile || DEFAULT_BUSINESS_PROFILE;
      const res = await fetch('/api/generate/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfile: profile }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast({
          title: 'Generation Failed',
          description: data.error || 'Failed to generate website. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data.success && data.html) {
        // Create a storefront from the generated HTML
        const { useAppStore: store } = await import('@/store/app-store');
        const newStorefront = {
          id: `storefront-${Date.now()}`,
          name: profile.name || 'Generated Storefront',
          businessName: profile.name || 'My Business',
          category: profile.category || 'other',
          status: 'ready' as const,
          description: profile.description || '',
          url: '',
          sections: MOCK_SECTIONS,
          html: data.html,
          businessProfile: profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: null,
          viewCount: 0,
          deploymentStatus: 'none' as const,
          deploymentUrl: null,
        };

        store.getState().addStorefront(newStorefront);
        store.getState().setCurrentStorefront(newStorefront);

        toast({
          title: 'Website Generated!',
          description: 'Your storefront has been created with AI. You can preview it now.',
        });
      }
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [businessProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-border">
          <Eye className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-cyan-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">No Storefront Selected</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        Generate a storefront using the AI Builder, or select one from your projects to preview it here.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleGenerateWithAI}
          disabled={isGenerating}
          className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90 min-w-[180px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Website with AI
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentView('builder')}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Go to Builder
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentView('projects')}
        >
          <Layers className="h-4 w-4 mr-2" />
          View Projects
        </Button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Main Preview View
// =============================================================================

export function PreviewView() {
  const {
    currentStorefront,
    currentJob,
    businessProfile,
    previewDevice,
    previewMode,
    setPreviewMode,
    setCurrentView,
    updateStorefront,
  } = useAppStore();

  const [sections, setSections] = useState<StorefrontSection[]>(MOCK_SECTIONS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const generateAttemptedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Resolve the HTML to display: generatedHtml > currentStorefront.html > MOCK_BAKERY_HTML
  const displayHtml = useMemo(() => {
    if (generatedHtml) return generatedHtml;
    if (currentStorefront?.html) return currentStorefront.html;
    return MOCK_BAKERY_HTML;
  }, [generatedHtml, currentStorefront?.html]);

  const isAiGenerated = useMemo(() => {
    return !!generatedHtml || (currentStorefront?.html && currentStorefront.html !== MOCK_BAKERY_HTML);
  }, [generatedHtml, currentStorefront?.html]);

  const deviceWidth = useMemo(() => {
    switch (previewDevice) {
      case 'mobile': return 375;
      case 'tablet': return 768;
      case 'desktop': return '100%';
      default: return '100%';
    }
  }, [previewDevice]);

  // When the storefront changes, sync sections and clear generatedHtml if it was for a different storefront
  useEffect(() => {
    if (currentStorefront?.sections && currentStorefront.sections.length > 0) {
      setSections(currentStorefront.sections);
    } else {
      setSections(MOCK_SECTIONS);
    }
    // Clear local generated HTML when switching storefronts
    setGeneratedHtml(null);
    generateAttemptedRef.current = false;
  }, [currentStorefront?.id]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const profile = businessProfile || currentStorefront?.businessProfile || DEFAULT_BUSINESS_PROFILE;

      const res = await fetch('/api/generate/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfile: profile }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast({
          title: 'Generation Failed',
          description: data.error || 'Failed to generate website. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data.success && data.html) {
        setGeneratedHtml(data.html);

        // Also update the storefront if it exists
        if (currentStorefront) {
          updateStorefront(currentStorefront.id, {
            html: data.html,
            status: 'ready',
            updatedAt: new Date().toISOString(),
          });
        }

        toast({
          title: 'Website Regenerated!',
          description: 'Your storefront has been updated with fresh AI-generated content.',
        });
      }
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [businessProfile, currentStorefront, updateStorefront]);

  // When currentJob completes and there's a storefront, try to fetch the latest HTML
  useEffect(() => {
    if (
      currentJob?.status === 'complete' &&
      currentStorefront?.id &&
      !generateAttemptedRef.current &&
      !currentStorefront.html
    ) {
      generateAttemptedRef.current = true;
      handleGenerate();
    }
  }, [currentJob?.status, currentStorefront?.id, currentStorefront?.html, handleGenerate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleSectionVisibility = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  // If no storefront selected, show empty state
  if (!currentStorefront) {
    return <EmptyState />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full gap-4 -m-6">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm"
          >
            {/* Edit Mode Toggle */}
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {previewMode === 'preview' ? 'Preview' : 'Edit'} Mode
              </span>
              <Switch
                checked={previewMode === 'edit'}
                onCheckedChange={(checked) =>
                  setPreviewMode(checked ? 'edit' : 'preview')
                }
              />
              <Pencil className={cn(
                'h-3.5 w-3.5',
                previewMode === 'edit' ? 'text-violet-400' : 'text-muted-foreground'
              )} />
            </div>

            {/* Action Buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 text-violet-400" />
                  )}
                  <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Regenerate'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isGenerating ? 'Generating with AI...' : 'Regenerate website with AI'}
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Rocket className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Deploy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Share2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-3.5 w-3.5 text-violet-400" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Device Switcher */}
            <DeviceSwitcher />

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Section Panel Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    sidebarOpen && 'bg-accent'
                  )}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{sidebarOpen ? 'Hide sections' : 'Show sections'}</TooltipContent>
            </Tooltip>
          </motion.div>

          {/* AI Generated Badge */}
          {isAiGenerated && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-center gap-2 px-4 py-1.5 bg-violet-500/5 border-b border-violet-500/10"
            >
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="text-xs font-medium text-violet-400">AI-Generated Content</span>
              {isGenerating && (
                <>
                  <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />
                  <span className="text-xs text-muted-foreground">Regenerating...</span>
                </>
              )}
            </motion.div>
          )}

          {/* Preview Frame Container */}
          <div className="flex-1 flex items-start justify-center overflow-auto bg-muted/30 p-6">
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative"
              style={{
                width: typeof deviceWidth === 'number' ? `${deviceWidth}px` : deviceWidth,
                maxWidth: '100%',
              }}
            >
              {/* Browser Chrome for non-desktop */}
              {previewDevice !== 'desktop' && (
                <div className="rounded-t-xl border border-border border-b-0 bg-card overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                      <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {currentStorefront.businessName
                          ? `${currentStorefront.businessName.toLowerCase().replace(/\s+/g, '')}.com`
                          : 'sweetdreamsbakery.com'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* iframe */}
              <div
                className={cn(
                  'bg-white rounded-xl overflow-hidden shadow-2xl shadow-black/20',
                  previewDevice !== 'desktop' ? 'rounded-t-none border border-t-0 border-border' : 'border border-border'
                )}
              >
                {/* Loading Overlay */}
                <AnimatePresence>
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl"
                    >
                      <div className="relative mb-4">
                        <div className="h-16 w-16 rounded-full border-4 border-muted border-t-violet-500 animate-spin" />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-violet-500" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">Generating with AI</h3>
                      <p className="text-xs text-muted-foreground">Crafting your perfect storefront...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <iframe
                  srcDoc={displayHtml}
                  title="Storefront Preview"
                  className="w-full border-0"
                  style={{
                    height: previewDevice === 'mobile' ? '667px' : previewDevice === 'tablet' ? '1024px' : 'calc(100vh - 180px)',
                  }}
                  sandbox="allow-scripts"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section List Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-l border-border bg-card overflow-hidden flex-shrink-0"
            >
              <div className="w-[280px] h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-400" />
                    <h3 className="text-sm font-semibold">Sections</h3>
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">
                      {sections.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Drag to reorder &middot; Toggle visibility
                  </p>
                </div>

                {/* Sortable Section List */}
                <ScrollArea className="flex-1 p-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sections.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {sections.map((section) => (
                          <SortableSectionItem
                            key={section.id}
                            section={section}
                            onToggleVisibility={toggleSectionVisibility}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>

                {/* Sidebar Footer */}
                <div className="px-4 py-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Show All Sections
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
