'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { Template, BusinessCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Download,
  Eye,
  Sparkles,
  Layout,
  Palette,
  Type,
  Layers,
  ArrowRight,
  Star,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// Loading Skeleton
// =============================================================================

function TemplateCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 h-full flex flex-col">
      <div className="h-40 bg-muted animate-pulse" />
      <CardContent className="p-4 flex-1 flex flex-col gap-3">
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-3 bg-muted rounded animate-pulse w-full" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="h-3 bg-muted rounded animate-pulse w-16" />
          <div className="flex gap-2">
            <div className="h-7 w-16 bg-muted rounded animate-pulse" />
            <div className="h-7 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50">
      <div className="absolute inset-0 bg-muted/20" />
      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="shrink-0 w-32 h-24 sm:w-48 sm:h-36 rounded-xl bg-muted animate-pulse" />
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="h-6 bg-muted rounded animate-pulse w-48" />
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="flex gap-4">
            <div className="h-4 bg-muted rounded animate-pulse w-24" />
            <div className="h-4 bg-muted rounded animate-pulse w-20" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-9 w-24 bg-muted rounded animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Mock Templates Data (fallback)
// =============================================================================

const mockTemplates: Template[] = [
  {
    id: 'tpl-1',
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
    id: 'tpl-2',
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
    id: 'tpl-3',
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
    id: 'tpl-4',
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
    id: 'tpl-5',
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
    id: 'tpl-6',
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
    id: 'tpl-7',
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
    id: 'tpl-8',
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

// =============================================================================
// Categories
// =============================================================================

const categories: { label: string; value: BusinessCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bakery', value: 'bakery' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Electronics', value: 'electronics' },
  { label: 'Salon', value: 'salon' },
  { label: 'Medical', value: 'medical' },
  { label: 'Service', value: 'service' },
  { label: 'Hardware', value: 'hardware' },
];

type SortOption = 'popular' | 'newest' | 'downloads';

// =============================================================================
// Section type label map
// =============================================================================

const sectionLabels: Record<string, string> = {
  hero: 'Hero Banner',
  about: 'About Section',
  products: 'Products / Menu',
  services: 'Services',
  testimonials: 'Testimonials',
  contact: 'Contact',
  gallery: 'Gallery',
  hours: 'Hours & Location',
  team: 'Team / Staff',
  faq: 'FAQ',
  cta: 'Call to Action',
  footer: 'Footer',
  map: 'Map',
};

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// =============================================================================
// TemplatesView
// =============================================================================

export function TemplatesView() {
  const { setCurrentView } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BusinessCategory | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from API on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const raw = data.templates as unknown[];
        if (!Array.isArray(raw) || raw.length === 0) {
          // API returned empty – use local mock
          setTemplates(mockTemplates);
          return;
        }

        // Validate that sections are StorefrontSection objects (not strings)
        const valid = raw.every(
          (t) =>
            t &&
            typeof t === 'object' &&
            Array.isArray(t.sections) &&
            t.sections.length > 0 &&
            typeof t.sections[0] === 'object' &&
            'type' in t.sections[0]
        );

        if (valid) {
          setTemplates(raw as Template[]);
        } else {
          // API mock data has sections as strings – fall back to local mocks
          setTemplates(mockTemplates);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[TemplatesView] fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplates(mockTemplates);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTemplates();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setTemplates([]);
    // Trigger a refetch by leveraging a state toggle trick
    fetch('/api/templates')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const raw = data.templates as unknown[];
        if (Array.isArray(raw) && raw.length > 0) {
          const valid = raw.every(
            (t) =>
              t &&
              typeof t === 'object' &&
              Array.isArray(t.sections) &&
              t.sections.length > 0 &&
              typeof t.sections[0] === 'object' &&
              'type' in t.sections[0]
          );
          if (valid) {
            setTemplates(raw as Template[]);
            setError(null);
          } else {
            setTemplates(mockTemplates);
          }
        } else {
          setTemplates(mockTemplates);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplates(mockTemplates);
      })
      .finally(() => setLoading(false));
  }, []);

  // Featured template
  const featuredTemplate = templates.find((t) => t.featured) || templates[0];

  // Filter & sort
  const filteredTemplates = useMemo(() => {
    let result = templates.filter((t) => t.id !== featuredTemplate?.id);

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
        break;
      case 'newest':
        result.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case 'downloads':
        result.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
    }

    return result;
  }, [searchQuery, activeCategory, sortOption, templates, featuredTemplate?.id]);

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(null);
    setCurrentView('builder');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Browse our curated collection of business-specific website templates
        </p>
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <span>Could not load from server — showing local templates.</span>
          <Button variant="outline" size="sm" onClick={handleRetry} className="shrink-0 border-destructive/30 hover:bg-destructive/10">
            Retry
          </Button>
        </motion.div>
      )}

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="downloads">Most Downloads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                activeCategory === cat.value
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Featured Template / Skeleton */}
      {loading ? (
        <FeaturedSkeleton />
      ) : featuredTemplate ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border/50">
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Preview Image */}
            <div className="shrink-0">
              <div className="w-32 h-24 sm:w-48 sm:h-36 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={featuredTemplate.preview}
                  alt={`${featuredTemplate.name} template preview`}
                  width={192}
                  height={144}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-violet-600/20 text-violet-400 border-violet-500/30">
                  <Star className="size-3" />
                  Featured
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {featuredTemplate.category}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">{featuredTemplate.name}</h2>
              <p className="text-muted-foreground mt-1 line-clamp-2">
                {featuredTemplate.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Download className="size-3.5" />
                  {featuredTemplate.downloadCount.toLocaleString()} downloads
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="size-3.5" />
                  {featuredTemplate.sections.length} sections
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplate(featuredTemplate)}
              >
                <Eye className="size-4 mr-1.5" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => handleUseTemplate(featuredTemplate)}
                className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white"
              >
                Use Template
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      ) : null}

      {/* Template Grid / Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              variants={itemVariants}
              layout
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer h-full flex flex-col"
                onClick={() => setSelectedTemplate(template)}
              >
                {/* Preview */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={template.preview}
                    alt={`${template.name} template preview`}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  {template.popular && (
                    <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white border-0 text-[10px]">
                      <TrendingUp className="size-2.5 mr-0.5" />
                      Popular
                    </Badge>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="capitalize bg-black/40 text-white border-0 backdrop-blur-sm text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-sm leading-tight">{template.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2 flex-1">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="size-3" />
                      {template.downloadCount.toLocaleString()}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                      >
                        <Eye className="size-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                      >
                        <Sparkles className="size-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Layout className="size-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No templates found</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search or filter criteria
          </p>
        </motion.div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              {/* Large Preview */}
              <div className="h-56 sm:h-72 rounded-xl relative overflow-hidden -mx-6 -mt-6 mb-4">
                <Image
                  src={selectedTemplate.preview}
                  alt={`${selectedTemplate.name} template preview`}
                  width={800}
                  height={400}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedTemplate.featured && (
                      <Badge className="bg-violet-600/20 text-violet-300 border-violet-500/30">
                        <Star className="size-3" />
                        Featured
                      </Badge>
                    )}
                    {selectedTemplate.popular && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                        <TrendingUp className="size-3" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">
                      {selectedTemplate.name}
                    </DialogTitle>
                    <DialogDescription className="text-white/80 text-sm">
                      {selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)} Template
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>

              {/* Full Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedTemplate.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 py-3">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Download className="size-4" />
                  {selectedTemplate.downloadCount.toLocaleString()} downloads
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Layers className="size-4" />
                  {selectedTemplate.sections.length} sections
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="size-4 text-violet-400" />
                  Included Sections
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedTemplate.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <span className="size-5 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      {sectionLabels[section.type] || section.title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Style Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="size-4 text-cyan-400" />
                  Style Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary Color */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <div
                      className="size-8 rounded-lg border border-border/50 shadow-inner"
                      style={{ backgroundColor: selectedTemplate.style.primaryColor }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Primary</p>
                      <p className="text-xs font-mono">{selectedTemplate.style.primaryColor}</p>
                    </div>
                  </div>
                  {/* Secondary Color */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <div
                      className="size-8 rounded-lg border border-border/50 shadow-inner"
                      style={{ backgroundColor: selectedTemplate.style.secondaryColor }}
                    />
                    <div>
                      <p className="text-xs text-muted-foreground">Secondary</p>
                      <p className="text-xs font-mono">{selectedTemplate.style.secondaryColor}</p>
                    </div>
                  </div>
                  {/* Font */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                      <Type className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Font</p>
                      <p className="text-xs font-medium">{selectedTemplate.style.fontFamily}</p>
                    </div>
                  </div>
                  {/* Theme */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                      <Layout className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Theme</p>
                      <p className="text-xs font-medium capitalize">{selectedTemplate.style.theme}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white"
                >
                  <Sparkles className="size-4 mr-2" />
                  Use This Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
