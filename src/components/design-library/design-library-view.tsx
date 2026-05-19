'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { DesignComponentCategory, DesignStyle, DesignComponent, DesignTheme } from '@/lib/types';
import { expandedComponentVariants, expandedDesignThemes, generateComponentHtml, type ComponentVariant } from '@/data/design-components';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  Sparkles,
  Palette,
  Layers,
  Star,
  Download,
  Code2,
  ArrowRight,
  TrendingUp,
  Grid3X3,
  LayoutDashboard,
  Monitor,
  MousePointer,
  Copy,
  ExternalLink,
  Globe,
  Lightbulb,
  Brush,
  Wand2,
  BookOpen,
  Palette as PaletteIcon,
} from 'lucide-react';

// =============================================================================
// Data: Component Categories
// =============================================================================

interface ComponentCategoryDef {
  id: DesignComponentCategory;
  label: string;
  icon: React.ElementType;
  description: string;
  image: string;
  count: number;
  color: string;
}

const componentCategories: ComponentCategoryDef[] = [
  { id: 'hero', label: 'Hero Sections', icon: Monitor, description: 'Eye-catching hero banners and landing page headers', image: '/design-library/hero-sections.png', count: 15, color: 'from-violet-600 to-purple-500' },
  { id: 'navigation', label: 'Navigation Bars', icon: LayoutDashboard, description: 'Sticky, transparent, hamburger, and mega menus', image: '/design-library/navigation.png', count: 15, color: 'from-sky-600 to-blue-500' },
  { id: 'features', label: 'Feature Sections', icon: Grid3X3, description: 'Feature grids, bento layouts, and showcases', image: '/design-library/feature-sections.png', count: 15, color: 'from-emerald-600 to-teal-500' },
  { id: 'pricing', label: 'Pricing Tables', icon: Layers, description: 'SaaS pricing cards, toggles, and comparisons', image: '/design-library/pricing-tables.png', count: 15, color: 'from-amber-600 to-orange-500' },
  { id: 'testimonials', label: 'Testimonials', icon: Star, description: 'Review carousels, social proof, and quote cards', image: '/design-library/testimonials.png', count: 15, color: 'from-pink-600 to-rose-500' },
  { id: 'cta', label: 'CTA Sections', icon: MousePointer, description: 'Call-to-action banners, newsletters, and signups', image: '/design-library/cta-sections.png', count: 15, color: 'from-red-600 to-orange-500' },
  { id: 'about', label: 'About & Team', icon: Layers, description: 'Team grids, timelines, company stories, and FAQs', image: '/design-library/about-contact.png', count: 15, color: 'from-cyan-600 to-teal-500' },
  { id: 'footer', label: 'Footers', icon: LayoutDashboard, description: 'Multi-column, minimal, and creative footer designs', image: '/design-library/footers.png', count: 15, color: 'from-slate-600 to-gray-500' },
];

// =============================================================================
// Data: Individual Components per Category
// =============================================================================

// ComponentVariant type imported from @/data/design-components

const componentVariants = expandedComponentVariants;

// =============================================================================
// Data: Design Themes
// =============================================================================

const designThemes = expandedDesignThemes;

// =============================================================================
// Data: External Design Resources
// =============================================================================

interface ExternalResource {
  id: string;
  name: string;
  url: string;
  description: string;
  tags: string[];
  icon: React.ElementType;
  gradient: string;
}

const externalResources: ExternalResource[] = [
  { id: '21stdev', name: '21st.dev', url: 'https://21st.dev/home', description: 'Modern component library with interactive React components and hooks for Next.js', tags: ['Components', 'React', 'Tailwind'], icon: Wand2, gradient: 'from-violet-600 to-fuchsia-500' },
  { id: 'designarena', name: 'Design Arena', url: 'https://www.designarena.ai', description: 'AI-powered design comparison and generation platform for creating stunning visuals', tags: ['AI', 'Generation', 'Design'], icon: Lightbulb, gradient: 'from-cyan-500 to-blue-600' },
  { id: 'landingfolio', name: 'Landingfolio', url: 'https://www.landingfolio.com/components', description: 'Curated landing page components and design inspiration from real websites', tags: ['Inspiration', 'Templates', 'Landing Pages'], icon: Globe, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'uiverse', name: 'UIverse', url: 'https://uiverse.io', description: 'Open-source UI elements created by the community with CSS and Tailwind CSS', tags: ['Open Source', 'CSS', 'Community'], icon: Brush, gradient: 'from-pink-500 to-rose-600' },
  { id: 'dribbble', name: 'Dribbble', url: 'https://dribbble.com/tags/web-components', description: 'Community-driven design inspiration from the world\'s top creators and designers', tags: ['Inspiration', 'Community', 'Design'], icon: BookOpen, gradient: 'from-pink-600 to-orange-500' },
  { id: 'aceternity', name: 'Aceternity UI', url: 'https://ui.aceternity.com', description: 'Beautiful, animated Tailwind CSS components with smooth interactions and effects', tags: ['Components', 'Animated', 'Tailwind'], icon: Sparkles, gradient: 'from-amber-500 to-orange-600' },
  { id: 'magicui', name: 'Magic UI', url: 'https://magicui.design/docs/components', description: 'Animated components built with Framer Motion and Tailwind CSS for modern apps', tags: ['Components', 'Framer Motion', 'Animated'], icon: PaletteIcon, gradient: 'from-violet-500 to-purple-700' },
  { id: 'tailwindspark', name: 'TailwindSpark', url: 'https://tailwindspark.com', description: 'Ready-to-use Tailwind CSS snippets, patterns, and code examples for rapid development', tags: ['Snippets', 'Tailwind', 'Patterns'], icon: Code2, gradient: 'from-sky-500 to-indigo-600' },
];

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// =============================================================================
// Style filter options
// =============================================================================

const styleFilters: { label: string; value: DesignStyle | 'all' }[] = [
  { label: 'All Styles', value: 'all' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Bold', value: 'bold' },
  { label: 'Dark', value: 'dark' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Glass', value: 'glass' },
];

const difficultyColors: {
  beginner: string;
  intermediate: string;
  advanced: string;
} = {
  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// =============================================================================
// Component Code Generator — Real HTML/CSS for every variant
// =============================================================================

function getComponentCode(variant: ComponentVariant, category: DesignComponentCategory): string {
  return generateComponentHtml(variant, category);
}


function getThemeCSS(theme: DesignTheme): string {
  return `:root {
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-foreground: ${theme.colors.foreground};
  --color-muted: ${theme.colors.muted};
  --font-family: '${theme.fontFamily}', system-ui, sans-serif;
}

/* Typography */
body {
  font-family: var(--font-family);
  background-color: var(--color-background);
  color: var(--color-foreground);
}

/* Buttons */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

/* Accent elements */
.accent-text { color: var(--color-accent); }
.accent-bg { background-color: var(--color-accent); }

/* Muted backgrounds */
.muted-section {
  background-color: var(--color-muted);
}`;
}

// =============================================================================
// MiniPreview: Inline HTML/CSS Component Preview (FIXED - accepts category prop)
// =============================================================================

function MiniPreview({ variant, category }: { variant: ComponentVariant; category: DesignComponentCategory }) {
  const isDark = variant.style === 'dark';

  const previews: Record<string, React.ReactNode> = {
    hero: (
      <div className={cn('relative rounded-lg overflow-hidden h-full flex flex-col items-center justify-center p-3', isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500')}>
        <div className="text-[7px] font-bold text-white/90 mb-1 text-center">HEADLINE</div>
        <div className="text-[5px] text-white/60 mb-2 text-center">Subtitle text goes here</div>
        <div className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[5px] text-white">Get Started &rarr;</div>
      </div>
    ),
    navigation: (
      <div className={cn('rounded-lg overflow-hidden h-full flex items-center px-3', isDark ? 'bg-gray-900' : 'bg-white border border-gray-200')}>
        <div className={cn('text-[7px] font-bold', isDark ? 'text-white' : 'text-gray-900')}>Brand</div>
        <div className="flex-1" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={cn('w-4 h-0.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
          ))}
        </div>
        <div className={cn('ml-2 px-1.5 py-0.5 rounded text-[5px]', isDark ? 'bg-violet-600 text-white' : 'bg-gray-900 text-white')}>CTA</div>
      </div>
    ),
    features: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2 grid grid-cols-3 gap-1.5', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        {[1, 2, 3].map(i => (
          <div key={i} className={cn('rounded p-1.5 flex flex-col items-center', isDark ? 'bg-gray-800' : 'bg-white border border-gray-200')}>
            <div className={cn('w-3 h-3 rounded-full mb-1', variant.previewGradient)} style={{ opacity: 0.6 }} />
            <div className={cn('w-5 h-0.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
          </div>
        ))}
      </div>
    ),
    pricing: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2 flex gap-1.5', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        {[1, 2, 3].map(i => (
          <div key={i} className={cn('flex-1 rounded p-1.5 flex flex-col items-center', i === 2 ? (isDark ? 'bg-violet-900/50 border border-violet-500/30' : 'bg-violet-50 border border-violet-300') : (isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'))}>
            <div className={cn('text-[5px] font-bold', i === 2 ? 'text-violet-500' : (isDark ? 'text-gray-400' : 'text-gray-500'))}>Plan</div>
            <div className={cn('text-[8px] font-bold mt-0.5', isDark ? 'text-white' : 'text-gray-900')}>$99</div>
          </div>
        ))}
      </div>
    ),
    testimonials: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className={cn('rounded p-2', isDark ? 'bg-gray-800' : 'bg-white border border-gray-200')}>
          <div className="flex gap-0.5 mb-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ))}
          </div>
          <div className={cn('w-full h-0.5 rounded-full mb-1', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          <div className={cn('w-3/4 h-0.5 rounded-full', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
        </div>
      </div>
    ),
    cta: (
      <div className={cn('rounded-lg overflow-hidden h-full flex flex-col items-center justify-center p-2', variant.style === 'gradient' || variant.style === 'bold' ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500' : (isDark ? 'bg-gray-900' : 'bg-gray-50'))}>
        <div className="text-[6px] font-bold text-white mb-1 text-center">Ready to Start?</div>
        <div className="text-[4px] text-white/70 mb-1.5 text-center">Join thousands of users</div>
        <div className="px-2 py-0.5 bg-white rounded text-[5px] text-gray-900 font-medium">Get Started</div>
      </div>
    ),
    about: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} className={cn('flex-1 rounded flex flex-col items-center p-1', isDark ? 'bg-gray-800' : 'bg-white border border-gray-200')}>
              <div className="w-3 h-3 rounded-full bg-muted mb-1" />
              <div className={cn('w-4 h-0.5 rounded-full', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
            </div>
          ))}
        </div>
      </div>
    ),
    footer: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2', isDark ? 'bg-gray-900' : 'bg-gray-100')}>
        <div className="grid grid-cols-4 gap-1 mb-1.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className={cn('w-4 h-0.5 rounded-full mb-0.5', isDark ? 'bg-gray-600' : 'bg-gray-400')} />
              {[1, 2].map(j => (
                <div key={j} className={cn('w-3 h-0.5 rounded-full mb-0.5', isDark ? 'bg-gray-700' : 'bg-gray-300')} />
              ))}
            </div>
          ))}
        </div>
        <div className={cn('border-t h-px', isDark ? 'border-gray-700' : 'border-gray-300')} />
      </div>
    ),
  };

  return previews[category] || previews.hero;
}

// =============================================================================
// DesignLibraryView
// =============================================================================

export function DesignLibraryView() {
  const {
    setCurrentView,
    setSelectedDesignComponent,
    setSelectedDesignTheme,
  } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStyle, setActiveStyle] = useState<DesignStyle | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategoryDef | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ComponentVariant | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme | null>(null);
  const [activeTab, setActiveTab] = useState<'components' | 'themes' | 'resources'>('components');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [visibleVariantCount, setVisibleVariantCount] = useState(12);

  // Reset variant count when switching categories or style
  React.useEffect(() => {
    setVisibleVariantCount(12);
  }, [selectedCategory, activeStyle]);

  // Filter components
  const filteredCategories = useMemo(() => {
    let cats = componentCategories;
    if (activeStyle !== 'all') {
      cats = cats.filter(cat => componentVariants[cat.id].some(v => v.style === activeStyle));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.filter(cat =>
        cat.label.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        componentVariants[cat.id].some(v =>
          v.name.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q))
        )
      );
    }
    return cats;
  }, [searchQuery, activeStyle]);

  const filteredVariants = useMemo(() => {
    if (!selectedCategory) return [];
    let variants = componentVariants[selectedCategory.id];
    if (activeStyle !== 'all') variants = variants.filter(v => v.style === activeStyle);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      variants = variants.filter(v => v.name.toLowerCase().includes(q) || v.tags.some(t => t.toLowerCase().includes(q)) || v.description.toLowerCase().includes(q));
    }
    return variants;
  }, [selectedCategory, activeStyle, searchQuery]);

  const filteredThemes = useMemo(() => {
    let themes = designThemes;
    if (activeStyle !== 'all') themes = themes.filter(t => t.style === activeStyle);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      themes = themes.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.mood.toLowerCase().includes(q));
    }
    return themes;
  }, [searchQuery, activeStyle]);

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return externalResources;
    const q = searchQuery.toLowerCase();
    return externalResources.filter(r => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q)));
  }, [searchQuery]);

  const handleCopyCode = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleUseComponent = useCallback((variant: ComponentVariant, category: DesignComponentCategory) => {
    const code = getComponentCode(variant, category);
    const component: DesignComponent = {
      id: variant.id,
      name: variant.name,
      description: variant.description,
      category,
      style: variant.style,
      preview: '',
      html: code,
      css: '',
      tags: variant.tags,
      difficulty: variant.difficulty,
      popular: variant.popular,
      featured: false,
      useCount: 0,
    };
    setSelectedDesignComponent(component);
    setSelectedVariant(null);
    setCurrentView('builder');
  }, [setCurrentView, setSelectedDesignComponent]);

  const handleUseTheme = useCallback((theme: DesignTheme) => {
    setSelectedDesignTheme(theme);
    setSelectedTheme(null);
    setCurrentView('builder');
  }, [setCurrentView, setSelectedDesignTheme]);

  const activeCategoryForDialog = selectedCategory?.id || 'hero';
  const dialogCode = selectedVariant ? getComponentCode(selectedVariant, activeCategoryForDialog) : '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Design Library</h1>
            <p className="text-muted-foreground mt-0.5">Browse themes, components, and design resources for your website</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'components' | 'themes' | 'resources')}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="components" className="gap-1.5 data-[state=active]:bg-background">
              <Grid3X3 className="size-3.5" /> Components
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-1.5 data-[state=active]:bg-background">
              <Palette className="size-3.5" /> Themes
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-1.5 data-[state=active]:bg-background">
              <ExternalLink className="size-3.5" /> Resources
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search components, themes, resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>

          {/* Style Filter Pills */}
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex gap-1.5 pb-1">
              {styleFilters.map((sf) => (
                <button key={sf.value} onClick={() => setActiveStyle(sf.value)} className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap', activeStyle === sf.value ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25' : 'bg-muted text-muted-foreground hover:bg-muted/80')}>
                  {sf.label}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* ============================================================= */}
        {/* TAB: Components                                                 */}
        {/* ============================================================= */}
        <TabsContent value="components" className="mt-6 space-y-6">
          {selectedCategory ? (
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>&larr; Back</Button>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{selectedCategory.label}</h2>
                  <Badge variant="secondary" className="text-xs">{filteredVariants.length} variants</Badge>
                </div>
              </motion.div>

              {/* Category showcase image */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden border border-border/50 h-48">
                <Image src={selectedCategory.image} alt={`${selectedCategory.label} showcase`} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-white text-lg font-bold">{selectedCategory.label}</h3>
                  <p className="text-white/70 text-sm">{selectedCategory.description}</p>
                </div>
              </motion.div>

              {/* Variant grid */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredVariants.slice(0, visibleVariantCount).map((variant) => (
                    <motion.div key={variant.id} variants={itemVariants} layout exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                      <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer" onClick={() => setSelectedVariant(variant)}>
                        <div className="relative h-36 overflow-hidden bg-muted/20">
                          <MiniPreview variant={variant} category={selectedCategory.id} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          {variant.popular && <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 text-[9px]"><TrendingUp className="size-2 mr-0.5" /> Popular</Badge>}
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            <Badge className={cn('text-[9px] border-0 capitalize', difficultyColors[variant.difficulty])}>{variant.difficulty}</Badge>
                            <Badge variant="secondary" className="capitalize text-[9px] bg-black/40 text-white border-0 backdrop-blur-sm">{variant.style}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-semibold text-sm">{variant.name}</h3>
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{variant.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {variant.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="h-6 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={(e) => { e.stopPropagation(); handleUseComponent(variant, selectedCategory.id); }}>
                              <Sparkles className="size-3 mr-1" /> Use
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedVariant(variant); }}>
                              <Eye className="size-3 mr-1" /> Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
              {/* Load More Variants */}
              {filteredVariants.length > visibleVariantCount && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => setVisibleVariantCount((prev) => prev + 12)} className="min-w-[200px]">
                    Show More ({filteredVariants.length - visibleVariantCount} more)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Category grid */
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((cat) => (
                <motion.div key={cat.id} variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                  <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={() => setSelectedCategory(cat)}>
                    <div className="relative h-40 overflow-hidden">
                      <Image src={cat.image} alt={cat.label} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="text-white font-semibold">{cat.label}</h3>
                        <p className="text-white/70 text-xs line-clamp-1">{cat.description}</p>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-black/40 text-white border-0 backdrop-blur-sm text-[10px]">{cat.count} items</Badge>
                    </div>
                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {componentVariants[cat.id].slice(0, 3).map(v => (
                          <Badge key={v.id} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{v.style}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB: Themes                                                     */}
        {/* ============================================================= */}
        <TabsContent value="themes" className="mt-6">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredThemes.map((theme) => (
              <motion.div key={theme.id} variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg cursor-pointer" onClick={() => setSelectedTheme(theme)}>
                  <div className="relative h-32 overflow-hidden">
                    <div className="flex h-full">
                      <div className="flex-1" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="flex-1" style={{ backgroundColor: theme.colors.secondary }} />
                      <div className="flex-1" style={{ backgroundColor: theme.colors.accent }} />
                    </div>
                    {theme.popular && <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 text-[9px]"><TrendingUp className="size-2 mr-0.5" /> Popular</Badge>}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm">{theme.name}</h3>
                    <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{theme.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.primary }} />
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.secondary }} />
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: theme.colors.accent }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{theme.useCount.toLocaleString()} uses</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB: Resources                                                  */}
        {/* ============================================================= */}
        <TabsContent value="resources" className="mt-6">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-violet-600/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><ExternalLink className="size-5 text-violet-400" /> External Design Resources</h3>
              <p className="text-sm text-muted-foreground">Curated collection of the best design tools and inspiration from around the web. Click to visit any site.</p>
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <motion.div key={resource.id} variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                    <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg">
                      <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center relative', resource.gradient)}>
                        <Icon className="h-10 w-10 text-white/80 group-hover:text-white transition-colors" />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm flex items-center gap-1.5">{resource.name} <ExternalLink className="size-3 text-muted-foreground" /></h3>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{resource.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                        <Button size="sm" className="w-full mt-3 h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white" asChild>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            Visit Site <ArrowRight className="size-3 ml-1" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================= */}
      {/* Component Detail Dialog                                        */}
      {/* ============================================================= */}
      <Dialog open={!!selectedVariant} onOpenChange={() => setSelectedVariant(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVariant && (
            <>
              {/* Preview */}
              <div className="h-48 rounded-xl overflow-hidden bg-muted/20 border border-border/50">
                <MiniPreview variant={selectedVariant} category={activeCategoryForDialog} />
              </div>
              <div className="absolute top-4 right-4 flex gap-1">
                <Badge className={cn('text-[10px] border-0 capitalize', difficultyColors[selectedVariant.difficulty])}>{selectedVariant.difficulty}</Badge>
                <Badge variant="secondary" className="capitalize text-[10px]">{selectedVariant.style}</Badge>
              </div>

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedVariant.name}
                  {selectedVariant.popular && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 text-[10px]"><TrendingUp className="size-3 mr-0.5" /> Popular</Badge>}
                </DialogTitle>
                <DialogDescription>{selectedVariant.description}</DialogDescription>
              </DialogHeader>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedVariant.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>

              {/* Code Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Code2 className="size-4 text-violet-400" /> Component Code</h4>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyCode(selectedVariant.id, dialogCode)}>
                    {copiedId === selectedVariant.id ? <><Copy className="size-3" /> Copied!</> : <><Copy className="size-3" /> Copy Code</>}
                  </Button>
                </div>
                <pre className="bg-gray-950 text-gray-300 text-xs rounded-xl p-4 overflow-x-auto max-h-64 border border-gray-800 leading-relaxed">
                  <code>{dialogCode}</code>
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleUseComponent(selectedVariant, activeCategoryForDialog)} className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white">
                  <Sparkles className="size-4 mr-2" /> Use This Component
                </Button>
                <Button variant="outline" onClick={() => setSelectedVariant(null)} className="flex-1">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* Theme Detail Dialog                                            */}
      {/* ============================================================= */}
      <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTheme && (
            <>
              {/* Color Preview */}
              <div className="flex rounded-xl overflow-hidden h-32 border border-border/50">
                <div className="flex-1 relative flex items-end p-3" style={{ backgroundColor: selectedTheme.colors.primary }}>
                  <span className="text-white text-xs font-medium">{selectedTheme.colors.primary}</span>
                </div>
                <div className="flex-1 relative flex items-end p-3" style={{ backgroundColor: selectedTheme.colors.secondary }}>
                  <span className="text-white text-xs font-medium">{selectedTheme.colors.secondary}</span>
                </div>
                <div className="flex-1 relative flex items-end p-3" style={{ backgroundColor: selectedTheme.colors.accent }}>
                  <span className="text-white text-xs font-medium">{selectedTheme.colors.accent}</span>
                </div>
              </div>

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTheme.name}
                  {selectedTheme.popular && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20 text-[10px]"><TrendingUp className="size-3 mr-0.5" /> Popular</Badge>}
                </DialogTitle>
                <DialogDescription>{selectedTheme.description}</DialogDescription>
              </DialogHeader>

              {/* Colors */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Color Palette</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedTheme.colors).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg border border-border/50 shadow-inner shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-xs text-muted-foreground capitalize">{name}</p>
                        <p className="text-xs font-mono">{color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font & Mood */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <span className="text-lg" style={{ fontFamily: selectedTheme.fontFamily }}>Aa</span>
                  <div><p className="text-xs text-muted-foreground">Font</p><p className="text-xs font-medium">{selectedTheme.fontFamily}</p></div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <Palette className="size-5 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground">Mood</p><p className="text-xs font-medium">{selectedTheme.mood}</p></div>
                </div>
              </div>

              {/* CSS Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2"><Code2 className="size-4 text-cyan-400" /> Theme CSS</h4>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleCopyCode(selectedTheme.id + '-css', getThemeCSS(selectedTheme))}>
                    {copiedId === selectedTheme.id + '-css' ? <><Copy className="size-3" /> Copied!</> : <><Copy className="size-3" /> Copy CSS</>}
                  </Button>
                </div>
                <pre className="bg-gray-950 text-gray-300 text-xs rounded-xl p-4 overflow-x-auto max-h-48 border border-gray-800 leading-relaxed">
                  <code>{getThemeCSS(selectedTheme)}</code>
                </pre>
              </div>

              <div className="flex items-center gap-3 py-3">
                <Download className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{selectedTheme.useCount.toLocaleString()} uses</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleUseTheme(selectedTheme)} className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white">
                  <Sparkles className="size-4 mr-2" /> Apply This Theme
                </Button>
                <Button variant="outline" onClick={() => setSelectedTheme(null)} className="flex-1">Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
