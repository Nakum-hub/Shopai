'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { DesignComponentCategory, DesignStyle, DesignComponent, DesignTheme } from '@/lib/types';
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
  Plus,
  Sparkles,
  Palette,
  Layers,
  Star,
  Download,
  Code2,
  ArrowRight,
  TrendingUp,
  Flame,
  Grid3X3,
  LayoutDashboard,
  Monitor,
  Smartphone,
  MousePointer,
  Check,
  Copy,
  X,
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
  { id: 'hero', label: 'Hero Sections', icon: Monitor, description: 'Eye-catching hero banners and landing page headers', image: '/design-library/hero-sections.png', count: 6, color: 'from-violet-600 to-purple-500' },
  { id: 'navigation', label: 'Navigation Bars', icon: LayoutDashboard, description: 'Sticky, transparent, hamburger, and mega menus', image: '/design-library/navigation.png', count: 6, color: 'from-sky-600 to-blue-500' },
  { id: 'features', label: 'Feature Sections', icon: Grid3X3, description: 'Feature grids, bento layouts, and showcases', image: '/design-library/feature-sections.png', count: 6, color: 'from-emerald-600 to-teal-500' },
  { id: 'pricing', label: 'Pricing Tables', icon: Layers, description: 'SaaS pricing cards, toggles, and comparisons', image: '/design-library/pricing-tables.png', count: 6, color: 'from-amber-600 to-orange-500' },
  { id: 'testimonials', label: 'Testimonials', icon: Star, description: 'Review carousels, social proof, and quote cards', image: '/design-library/testimonials.png', count: 6, color: 'from-pink-600 to-rose-500' },
  { id: 'cta', label: 'CTA Sections', icon: MousePointer, description: 'Call-to-action banners, newsletters, and signups', image: '/design-library/cta-sections.png', count: 6, color: 'from-red-600 to-orange-500' },
  { id: 'about', label: 'About & Team', icon: Layers, description: 'Team grids, timelines, company stories, and FAQs', image: '/design-library/about-contact.png', count: 6, color: 'from-cyan-600 to-teal-500' },
  { id: 'footer', label: 'Footers', icon: LayoutDashboard, description: 'Multi-column, minimal, and creative footer designs', image: '/design-library/footers.png', count: 6, color: 'from-slate-600 to-gray-500' },
];

// =============================================================================
// Data: Individual Components per Category
// =============================================================================

interface ComponentVariant {
  id: string;
  name: string;
  style: DesignStyle;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popular: boolean;
  previewGradient: string;
  miniPreview: React.ReactNode;
}

const componentVariants: Record<DesignComponentCategory, ComponentVariant[]> = {
  hero: [
    { id: 'hero-gradient', name: 'Gradient Overlays', style: 'gradient', description: 'Vibrant gradient background with text overlay and floating elements', tags: ['gradient', 'animated', 'modern'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 via-fuchsia-500 to-pink-500', miniPreview: null },
    { id: 'hero-split', name: 'Split Layout', style: 'minimal', description: 'Side-by-side layout with image on one side and content on the other', tags: ['split', 'responsive', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-neutral-100 to-neutral-200', miniPreview: null },
    { id: 'hero-centered', name: 'Centered Minimalist', style: 'minimal', description: 'Clean centered text with a single CTA button', tags: ['centered', 'minimal', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-stone-50 to-stone-100', miniPreview: null },
    { id: 'hero-dark', name: 'Dark Cinematic', style: 'dark', description: 'Dark background with dramatic lighting effects and bold typography', tags: ['dark', 'cinematic', 'bold'], difficulty: 'intermediate', popular: true, previewGradient: 'from-gray-900 via-slate-800 to-gray-900', miniPreview: null },
    { id: 'hero-glass', name: 'Glassmorphism', style: 'glass', description: 'Frosted glass elements over a colorful background', tags: ['glass', 'blur', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-400 via-blue-500 to-purple-600', miniPreview: null },
    { id: 'hero-3d', name: '3D Elements', style: 'bold', description: 'Floating 3D elements and perspective transforms', tags: ['3d', 'animated', 'interactive'], difficulty: 'advanced', popular: false, previewGradient: 'from-orange-500 via-red-500 to-pink-500', miniPreview: null },
  ],
  navigation: [
    { id: 'nav-sticky', name: 'Sticky White', style: 'minimal', description: 'Clean white navigation bar that sticks to the top on scroll', tags: ['sticky', 'clean', 'white'], difficulty: 'beginner', popular: true, previewGradient: 'from-white to-gray-50', miniPreview: null },
    { id: 'nav-transparent', name: 'Transparent Overlay', style: 'minimal', description: 'Transparent nav that becomes solid on scroll', tags: ['transparent', 'overlay', 'hero'], difficulty: 'intermediate', popular: true, previewGradient: 'from-transparent to-black/20', miniPreview: null },
    { id: 'nav-dark', name: 'Dark Mode', style: 'dark', description: 'Sleek dark navigation with light text', tags: ['dark', 'modern', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-gray-800', miniPreview: null },
    { id: 'nav-mega', name: 'Mega Dropdown', style: 'bold', description: 'Expandable mega menu with multi-column dropdowns', tags: ['mega', 'dropdown', 'multi-column'], difficulty: 'advanced', popular: false, previewGradient: 'from-blue-50 to-indigo-50', miniPreview: null },
    { id: 'nav-centered', name: 'Centered Links', style: 'minimal', description: 'Logo centered with links distributed on both sides', tags: ['centered', 'symmetric', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-neutral-100', miniPreview: null },
    { id: 'nav-sidebar', name: 'Side Drawer', style: 'glass', description: 'Hamburger-triggered sidebar navigation', tags: ['sidebar', 'hamburger', 'mobile'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-800 to-slate-900', miniPreview: null },
  ],
  features: [
    { id: 'feat-icon-grid', name: 'Icon Grid', style: 'minimal', description: 'Grid of feature cards with icons and descriptions', tags: ['icons', 'grid', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-emerald-50 to-teal-50', miniPreview: null },
    { id: 'feat-alternating', name: 'Alternating Rows', style: 'bold', description: 'Alternating image-text rows for feature showcases', tags: ['alternating', 'images', 'storytelling'], difficulty: 'intermediate', popular: true, previewGradient: 'from-blue-50 to-cyan-50', miniPreview: null },
    { id: 'feat-bento', name: 'Bento Grid', style: 'bold', description: 'Apple-style bento grid with mixed card sizes', tags: ['bento', 'grid', 'mixed'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50', miniPreview: null },
    { id: 'feat-cards', name: 'Elevated Cards', style: 'glass', description: 'Floating cards with hover effects and shadows', tags: ['cards', 'hover', 'shadows'], difficulty: 'beginner', popular: false, previewGradient: 'from-pink-50 to-rose-50', miniPreview: null },
    { id: 'feat-timeline', name: 'Timeline List', style: 'minimal', description: 'Vertical timeline with connected feature milestones', tags: ['timeline', 'milestones', 'vertical'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50', miniPreview: null },
    { id: 'feat-tabs', name: 'Tabbed Showcase', style: 'gradient', description: 'Feature tabs with animated content switching', tags: ['tabs', 'interactive', 'animated'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-purple-50', miniPreview: null },
  ],
  pricing: [
    { id: 'price-3col', name: '3-Column Cards', style: 'minimal', description: 'Classic three-column pricing layout with highlight', tags: ['3-column', 'classic', 'popular'], difficulty: 'beginner', popular: true, previewGradient: 'from-amber-50 to-yellow-50', miniPreview: null },
    { id: 'price-toggle', name: 'Monthly/Yearly Toggle', style: 'glass', description: 'Pricing with monthly/yearly toggle switch', tags: ['toggle', 'billing', 'interactive'], difficulty: 'intermediate', popular: true, previewGradient: 'from-cyan-50 to-blue-50', miniPreview: null },
    { id: 'price-dark', name: 'Dark Premium', style: 'dark', description: 'Dark-themed pricing cards with gradient accents', tags: ['dark', 'premium', 'gradient'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-900 to-slate-800', miniPreview: null },
    { id: 'price-comparison', name: 'Comparison Table', style: 'minimal', description: 'Feature comparison table across plans', tags: ['comparison', 'table', 'features'], difficulty: 'advanced', popular: false, previewGradient: 'from-green-50 to-emerald-50', miniPreview: null },
    { id: 'price-gradient', name: 'Gradient Highlight', style: 'gradient', description: 'Popular plan highlighted with gradient border', tags: ['gradient', 'highlight', 'popular'], difficulty: 'beginner', popular: false, previewGradient: 'from-violet-500 to-fuchsia-500', miniPreview: null },
    { id: 'price-minimal', name: 'Ultra Minimal', style: 'minimal', description: 'Stripped-down pricing with just the essentials', tags: ['minimal', 'clean', 'simple'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-stone-50', miniPreview: null },
  ],
  testimonials: [
    { id: 'test-cards', name: 'Card Grid', style: 'minimal', description: 'Testimonial cards in a responsive grid layout', tags: ['cards', 'grid', 'avatars'], difficulty: 'beginner', popular: true, previewGradient: 'from-pink-50 to-rose-50', miniPreview: null },
    { id: 'test-carousel', name: 'Carousel Slider', style: 'bold', description: 'Auto-sliding testimonial carousel', tags: ['carousel', 'slider', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-orange-50 to-amber-50', miniPreview: null },
    { id: 'test-quote', name: 'Large Quote', style: 'minimal', description: 'Full-width quote with large typography', tags: ['quote', 'typography', 'large'], difficulty: 'beginner', popular: false, previewGradient: 'from-slate-50 to-gray-50', miniPreview: null },
    { id: 'test-social-proof', name: 'Social Proof Bar', style: 'bold', description: 'Logo wall + stats bar for social proof', tags: ['logos', 'stats', 'social-proof'], difficulty: 'beginner', popular: true, previewGradient: 'from-indigo-50 to-violet-50', miniPreview: null },
    { id: 'test-video', name: 'Video Testimonials', style: 'dark', description: 'Embedded video testimonials with play buttons', tags: ['video', 'multimedia', 'engaging'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-900 to-zinc-900', miniPreview: null },
    { id: 'test-masonry', name: 'Masonry Layout', style: 'bold', description: 'Pinterest-style masonry layout for varied testimonials', tags: ['masonry', 'varied', 'dynamic'], difficulty: 'intermediate', popular: false, previewGradient: 'from-teal-50 to-cyan-50', miniPreview: null },
  ],
  cta: [
    { id: 'cta-gradient', name: 'Gradient Banner', style: 'gradient', description: 'Full-width gradient CTA with bold typography', tags: ['gradient', 'bold', 'banner'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 to-fuchsia-500', miniPreview: null },
    { id: 'cta-split', name: 'Split Content', style: 'minimal', description: 'Image on one side, CTA form on the other', tags: ['split', 'form', 'image'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-indigo-50', miniPreview: null },
    { id: 'cta-newsletter', name: 'Newsletter Signup', style: 'glass', description: 'Email signup with glassmorphism card design', tags: ['newsletter', 'email', 'signup'], difficulty: 'beginner', popular: true, previewGradient: 'from-cyan-400 to-blue-500', miniPreview: null },
    { id: 'cta-dark', name: 'Dark CTA', style: 'dark', description: 'Dark background with neon accent button', tags: ['dark', 'neon', 'dramatic'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-slate-900', miniPreview: null },
    { id: 'cta-minimal', name: 'Simple Button', style: 'minimal', description: 'Ultra-minimal centered CTA with single button', tags: ['minimal', 'simple', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-stone-50', miniPreview: null },
    { id: 'cta-animated', name: 'Animated Glow', style: 'gradient', description: 'Animated glowing border CTA with particle effects', tags: ['animated', 'glow', 'particles'], difficulty: 'advanced', popular: false, previewGradient: 'from-purple-600 via-pink-500 to-red-500', miniPreview: null },
  ],
  about: [
    { id: 'about-team', name: 'Team Grid', style: 'minimal', description: 'Team member cards with photos, names, and roles', tags: ['team', 'grid', 'photos'], difficulty: 'beginner', popular: true, previewGradient: 'from-teal-50 to-cyan-50', miniPreview: null },
    { id: 'about-timeline', name: 'Company Timeline', style: 'minimal', description: 'Vertical timeline of company milestones', tags: ['timeline', 'history', 'milestones'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50', miniPreview: null },
    { id: 'about-stats', name: 'Stats Counter', style: 'bold', description: 'Animated counter section with key metrics', tags: ['stats', 'counter', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50', miniPreview: null },
    { id: 'about-faq', name: 'FAQ Accordion', style: 'minimal', description: 'Expandable FAQ accordion with smooth animations', tags: ['faq', 'accordion', 'interactive'], difficulty: 'beginner', popular: true, previewGradient: 'from-green-50 to-emerald-50', miniPreview: null },
    { id: 'about-gallery', name: 'Image Gallery', style: 'glass', description: 'Responsive image gallery with lightbox', tags: ['gallery', 'images', 'lightbox'], difficulty: 'intermediate', popular: false, previewGradient: 'from-pink-50 to-rose-50', miniPreview: null },
    { id: 'about-story', name: 'Story Section', style: 'bold', description: 'Visual storytelling with images and text blocks', tags: ['story', 'visual', 'narrative'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-sky-50', miniPreview: null },
  ],
  footer: [
    { id: 'foot-multicolumn', name: 'Multi-Column', style: 'minimal', description: 'Classic 4-column footer with links and social', tags: ['columns', 'links', 'classic'], difficulty: 'beginner', popular: true, previewGradient: 'from-gray-900 to-gray-800', miniPreview: null },
    { id: 'foot-minimal', name: 'Minimal Centered', style: 'minimal', description: 'Simple centered footer with just the essentials', tags: ['minimal', 'centered', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-stone-100 to-neutral-100', miniPreview: null },
    { id: 'foot-dark', name: 'Dark Social', style: 'dark', description: 'Dark footer with prominent social media links', tags: ['dark', 'social', 'icons'], difficulty: 'beginner', popular: false, previewGradient: 'from-zinc-900 to-neutral-900', miniPreview: null },
    { id: 'foot-newsletter', name: 'Newsletter Footer', style: 'gradient', description: 'Footer with integrated email signup form', tags: ['newsletter', 'signup', 'email'], difficulty: 'intermediate', popular: false, previewGradient: 'from-violet-900 to-indigo-900', miniPreview: null },
    { id: 'foot-mega', name: 'Mega Footer', style: 'bold', description: 'Full-width mega footer with sitemap and resources', tags: ['mega', 'sitemap', 'comprehensive'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-100 to-gray-100', miniPreview: null },
    { id: 'foot-creative', name: 'Creative Layout', style: 'bold', description: 'Asymmetric creative footer with unique design', tags: ['creative', 'asymmetric', 'unique'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-pink-50', miniPreview: null },
  ],
};

// =============================================================================
// Data: Design Themes
// =============================================================================

const designThemes: DesignTheme[] = [
  { id: 'theme-dark-luxury', name: 'Dark Luxury', description: 'Rich dark tones with golden accents for premium brands', preview: '/design-library/themes-colors.png', colors: { primary: '#1a1a2e', secondary: '#d4a853', accent: '#c9a96e', background: '#0d0d1a', foreground: '#f5f5f0', muted: '#2a2a3e' }, fontFamily: 'Cormorant Garamond', mood: 'Luxurious', style: 'dark', popular: true, useCount: 3842 },
  { id: 'theme-minimal-mono', name: 'Minimal Mono', description: 'Pure monochrome for maximum elegance and clarity', preview: '/design-library/themes-colors.png', colors: { primary: '#111111', secondary: '#666666', accent: '#000000', background: '#ffffff', foreground: '#111111', muted: '#f5f5f5' }, fontFamily: 'Inter', mood: 'Clean', style: 'minimal', popular: true, useCount: 5102 },
  { id: 'theme-neon-gradient', name: 'Neon Gradient', description: 'Vibrant neon gradients for bold, modern brands', preview: '/design-library/themes-colors.png', colors: { primary: '#7c3aed', secondary: '#06b6d4', accent: '#f43f5e', background: '#0a0a0f', foreground: '#f0f0ff', muted: '#1a1a2e' }, fontFamily: 'Space Grotesk', mood: 'Energetic', style: 'gradient', popular: true, useCount: 2947 },
  { id: 'theme-pastel-feminine', name: 'Soft Pastel', description: 'Gentle pastel palette for beauty and wellness brands', preview: '/design-library/themes-colors.png', colors: { primary: '#ec4899', secondary: '#f9a8d4', accent: '#fce7f3', background: '#fef7ff', foreground: '#4a1942', muted: '#fdf2f8' }, fontFamily: 'DM Sans', mood: 'Serene', style: 'glass', popular: false, useCount: 2183 },
  { id: 'theme-earthy-organic', name: 'Earthy Organic', description: 'Natural tones for sustainable and organic brands', preview: '/design-library/themes-colors.png', colors: { primary: '#2d5016', secondary: '#8fae6b', accent: '#d4a853', background: '#faf8f0', foreground: '#1a2e0d', muted: '#f0ede0' }, fontFamily: 'Lora', mood: 'Natural', style: 'minimal', popular: false, useCount: 1847 },
  { id: 'theme-bold-primary', name: 'Bold Primary', description: 'Strong primary colors for attention-grabbing designs', preview: '/design-library/themes-colors.png', colors: { primary: '#dc2626', secondary: '#2563eb', accent: '#f59e0b', background: '#ffffff', foreground: '#111827', muted: '#f3f4f6' }, fontFamily: 'Roboto', mood: 'Confident', style: 'bold', popular: true, useCount: 4215 },
  { id: 'theme-warm-sunset', name: 'Warm Sunset', description: 'Warm orange and coral tones for inviting brands', preview: '/design-library/themes-colors.png', colors: { primary: '#ea580c', secondary: '#f59e0b', accent: '#ef4444', background: '#fffbeb', foreground: '#451a03', muted: '#fef3c7' }, fontFamily: 'Nunito', mood: 'Warm', style: 'gradient', popular: false, useCount: 1567 },
  { id: 'theme-ocean-breeze', name: 'Ocean Breeze', description: 'Cool blues and teals for professional services', preview: '/design-library/themes-colors.png', colors: { primary: '#0d9488', secondary: '#0891b2', accent: '#22d3ee', background: '#f0fdfa', foreground: '#042f2e', muted: '#ccfbf1' }, fontFamily: 'Nunito', mood: 'Trustworthy', style: 'minimal', popular: false, useCount: 2341 },
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

const difficultyColors = {
  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

// =============================================================================
// MiniPreview: Inline HTML/CSS Component Preview
// =============================================================================

function MiniPreview({ variant }: { variant: ComponentVariant }) {
  const isDark = variant.style === 'dark';
  const bgBase = isDark ? 'bg-gray-900' : 'bg-white';

  const categoryPreviews: Record<DesignComponentCategory, React.ReactNode> = {
    hero: (
      <div className={cn('relative rounded-lg overflow-hidden h-full', isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-violet-500 to-fuchsia-500')}>
        <div className="absolute inset-0 bg-gradient-to-br opacity-30" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
        <div className="relative p-3 flex flex-col items-center justify-center h-full text-center">
          <div className="text-[7px] font-bold text-white/90 mb-1">HEADLINE</div>
          <div className="text-[5px] text-white/60 mb-2 leading-tight">Subtitle text goes here</div>
          <div className="px-2 py-0.5 bg-white/20 backdrop-blur rounded text-[5px] text-white">Get Started →</div>
        </div>
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
    gallery: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2 grid grid-cols-3 gap-1', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={cn('rounded-sm aspect-square', variant.previewGradient)} style={{ opacity: 0.3 + (i * 0.1) }} />
        ))}
      </div>
    ),
    contact: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className={cn('rounded p-1.5', isDark ? 'bg-gray-800' : 'bg-white border border-gray-200')}>
          <div className={cn('w-full h-1.5 rounded mb-1', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          <div className={cn('w-full h-1.5 rounded mb-1', isDark ? 'bg-gray-700' : 'bg-gray-200')} />
          <div className={cn('w-2/3 h-1.5 rounded', isDark ? 'bg-violet-700' : 'bg-violet-300')} />
        </div>
      </div>
    ),
    themes: (
      <div className={cn('rounded-lg overflow-hidden h-full p-2 grid grid-cols-3 gap-1', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
        {[1, 2, 3].map(i => (
          <div key={i} className={cn('rounded-full aspect-square', variant.previewGradient)} style={{ opacity: 0.7 }} />
        ))}
      </div>
    ),
  };

  return categoryPreviews[variant.category] || categoryPreviews.hero;
}

// =============================================================================
// DesignLibraryView
// =============================================================================

export function DesignLibraryView() {
  const { setCurrentView } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<DesignComponentCategory | 'all'>('all');
  const [activeStyle, setActiveStyle] = useState<DesignStyle | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategoryDef | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ComponentVariant | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme | null>(null);
  const [activeTab, setActiveTab] = useState<'components' | 'themes'>('components');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter components
  const filteredCategories = useMemo(() => {
    let cats = componentCategories;

    if (activeStyle !== 'all') {
      cats = cats.filter(cat =>
        componentVariants[cat.id].some(v => v.style === activeStyle)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cats = cats.filter(cat =>
        cat.label.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        componentVariants[cat.id].some(v =>
          v.name.toLowerCase().includes(q) ||
          v.tags.some(t => t.toLowerCase().includes(q))
        )
      );
    }

    return cats;
  }, [searchQuery, activeStyle]);

  const filteredVariants = useMemo(() => {
    if (!selectedCategory) return [];
    let variants = componentVariants[selectedCategory.id];

    if (activeStyle !== 'all') {
      variants = variants.filter(v => v.style === activeStyle);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      variants = variants.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.tags.some(t => t.toLowerCase().includes(q)) ||
        v.description.toLowerCase().includes(q)
      );
    }

    return variants;
  }, [selectedCategory, activeStyle, searchQuery]);

  const filteredThemes = useMemo(() => {
    let themes = designThemes;
    if (activeStyle !== 'all') {
      themes = themes.filter(t => t.style === activeStyle);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      themes = themes.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.mood.toLowerCase().includes(q)
      );
    }
    return themes;
  }, [searchQuery, activeStyle]);

  const handleCopyCode = useCallback((id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleUseComponent = useCallback((variant: ComponentVariant) => {
    setSelectedVariant(null);
    setCurrentView('builder');
  }, [setCurrentView]);

  const handleUseTheme = useCallback((theme: DesignTheme) => {
    setSelectedTheme(null);
    setCurrentView('builder');
  }, [setCurrentView]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Palette className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Design Library</h1>
            <p className="text-muted-foreground mt-0.5">
              Browse themes, components, and design elements for your website
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs: Components | Themes */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'components' | 'themes')}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="components" className="gap-1.5 data-[state=active]:bg-background">
              <Grid3X3 className="size-3.5" />
              Components
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-1.5 data-[state=active]:bg-background">
              <Palette className="size-3.5" />
              Themes & Colors
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search components, themes, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Style Filter Pills */}
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex gap-1.5 pb-1">
              {styleFilters.map((sf) => (
                <button
                  key={sf.value}
                  onClick={() => setActiveStyle(sf.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                    activeStyle === sf.value
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
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
            /* ---- Browsing inside a category ---- */
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)}>
                  ← Back
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', selectedCategory.color.replace('from-', 'bg-').split(' ')[0].replace('to-', ''))} />
                  <h2 className="text-lg font-semibold">{selectedCategory.label}</h2>
                  <Badge variant="secondary" className="text-xs">{filteredVariants.length} variants</Badge>
                </div>
              </motion.div>

              {/* Category showcase image */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-xl overflow-hidden border border-border/50 h-48"
              >
                <Image
                  src={selectedCategory.image}
                  alt={`${selectedCategory.label} showcase`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-white text-lg font-bold">{selectedCategory.label}</h3>
                  <p className="text-white/70 text-sm">{selectedCategory.description}</p>
                </div>
              </motion.div>

              {/* Variant grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredVariants.map((variant) => (
                    <motion.div
                      key={variant.id}
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <Card
                        className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer"
                        onClick={() => setSelectedVariant(variant)}
                      >
                        {/* Mini component preview */}
                        <div className="relative h-36 overflow-hidden bg-muted/20">
                          <MiniPreview variant={variant} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                          {variant.popular && (
                            <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white border-0 text-[9px]">
                              <TrendingUp className="size-2 mr-0.5" />
                              Popular
                            </Badge>
                          )}
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            <Badge className={cn('text-[9px] border-0 capitalize', difficultyColors[variant.difficulty])}>
                              {variant.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="capitalize text-[9px] bg-black/40 text-white border-0 backdrop-blur-sm">
                              {variant.style}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <CardContent className="p-3">
                          <h3 className="font-semibold text-sm">{variant.name}</h3>
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                            {variant.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {variant.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedVariant(variant); }}>
                                <Eye className="size-3 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm" className="h-6 px-2 text-xs bg-violet-600 hover:bg-violet-700 text-white" onClick={(e) => { e.stopPropagation(); handleUseComponent(variant); }}>
                                <Plus className="size-3 mr-1" />
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

              {filteredVariants.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                  <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="text-muted-foreground font-medium">No variants found</h3>
                  <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search or style filter</p>
                </motion.div>
              )}
            </div>
          ) : (
            /* ---- Category Grid (default view) ---- */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredCategories.map((cat) => (
                  <motion.div
                    key={cat.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <Card className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer h-full flex flex-col">
                      {/* Category image */}
                      <div className="relative h-44 overflow-hidden">
                        <Image
                          src={cat.image}
                          alt={`${cat.label} designs`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-white font-bold text-sm">{cat.label}</h3>
                          <p className="text-white/70 text-[11px] line-clamp-1">{cat.description}</p>
                        </div>
                        <Badge className="absolute top-3 right-3 bg-black/40 text-white border-0 backdrop-blur-sm text-[10px]">
                          {cat.count} designs
                        </Badge>
                      </div>

                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex gap-1">
                          {componentVariants[cat.id].slice(0, 3).map(v => (
                            <Badge key={v.id} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                              {v.style}
                            </Badge>
                          ))}
                          {componentVariants[cat.id].length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{componentVariants[cat.id].length - 3}
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredCategories.length === 0 && !selectedCategory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-muted-foreground font-medium">No components found</h3>
              <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search or style filter</p>
            </motion.div>
          )}
        </TabsContent>

        {/* ============================================================= */}
        {/* TAB: Themes                                                     */}
        {/* ============================================================= */}
        <TabsContent value="themes" className="mt-6 space-y-6">
          {/* Theme showcase */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl overflow-hidden border border-border/50 h-48"
          >
            <Image
              src="/design-library/themes-colors.png"
              alt="Theme palettes showcase"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5">
              <h3 className="text-white text-lg font-bold">Color Themes & Palettes</h3>
              <p className="text-white/70 text-sm">Choose a pre-built color scheme or customize your own</p>
            </div>
          </motion.div>

          {/* Theme grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredThemes.map((theme) => (
                <motion.div
                  key={theme.id}
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Card
                    className="group overflow-hidden border-border/50 hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 cursor-pointer"
                    onClick={() => setSelectedTheme(theme)}
                  >
                    {/* Color palette preview */}
                    <div className="h-32 flex">
                      <div className="flex-1" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="flex-1" style={{ backgroundColor: theme.colors.secondary }} />
                      <div className="flex-1" style={{ backgroundColor: theme.colors.accent }} />
                      <div className="flex-1" style={{ backgroundColor: theme.colors.background }} />
                    </div>

                    <CardContent className="p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{theme.name}</h3>
                        {theme.popular && (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">
                            <Flame className="size-2 mr-0.5" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2">{theme.description}</p>

                      {/* Color swatches */}
                      <div className="flex gap-1.5">
                        {Object.values(theme.colors).map((color, i) => (
                          <div
                            key={i}
                            className="size-5 rounded-md border border-border/50 shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: color }}
                            title={color}
                          >
                            <span className="text-[6px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: isLightColor(color) ? '#000' : '#fff' }}>
                              {color.slice(1, 4)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Download className="size-3" />
                          {theme.useCount.toLocaleString()}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                            {theme.style}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {theme.mood}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredThemes.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Palette className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-muted-foreground font-medium">No themes found</h3>
              <p className="text-muted-foreground/60 text-sm mt-1">Try adjusting your search or style filter</p>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* ============================================================= */}
      {/* Component Detail Dialog                                        */}
      {/* ============================================================= */}
      <Dialog open={!!selectedVariant} onOpenChange={() => setSelectedVariant(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedVariant && (
            <>
              {/* Large preview */}
              <div className="h-56 rounded-xl overflow-hidden -mx-6 -mt-6 mb-4 bg-muted/20">
                <MiniPreview variant={selectedVariant} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <Badge className={cn('text-[10px] border-0 capitalize', difficultyColors[selectedVariant.difficulty])}>
                      {selectedVariant.difficulty}
                    </Badge>
                    <Badge className="text-[10px] capitalize bg-black/40 text-white border-0 backdrop-blur-sm">
                      {selectedVariant.style}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedVariant.name}
                  {selectedVariant.popular && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      <TrendingUp className="size-3 mr-0.5" />
                      Popular
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedVariant.description}</DialogDescription>
              </DialogHeader>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedVariant.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Color palette */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="size-4 text-violet-400" />
                  Recommended Colors
                </h4>
                <div className="flex gap-2">
                  {['bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500'].map((c, i) => (
                    <div key={i} className={cn('size-8 rounded-lg', c)} />
                  ))}
                </div>
              </div>

              {/* Code preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Code2 className="size-4 text-cyan-400" />
                    Component Code
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopyCode(selectedVariant.id, `<!-- ${selectedVariant.name} component -->\n<section class="${selectedVariant.style}-style">\n  <!-- Generated by StoreCraft AI -->\n</section>`)}
                  >
                    {copiedId === selectedVariant.id ? (
                      <><Check className="size-3 mr-1" /> Copied!</>
                    ) : (
                      <><Copy className="size-3 mr-1" /> Copy</>
                    )}
                  </Button>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-xs font-mono text-muted-foreground max-h-32 overflow-auto">
                  <pre>{`<!-- ${selectedVariant.name} -->\n<section class="${selectedVariant.style}-style">\n  <div class="container mx-auto px-6">\n    <!-- Your content here -->\n  </div>\n</section>`}</pre>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleUseComponent(selectedVariant)}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white"
                >
                  <Sparkles className="size-4 mr-2" />
                  Use This Component
                </Button>
                <Button variant="outline" onClick={() => setSelectedVariant(null)} className="flex-1">
                  Close
                </Button>
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
              {/* Color banner */}
              <div className="h-40 rounded-xl overflow-hidden -mx-6 -mt-6 mb-4 flex">
                <div className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: selectedTheme.colors.primary }}>
                  <span className="text-white/40 text-sm font-mono">Primary</span>
                </div>
                <div className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: selectedTheme.colors.secondary }}>
                  <span className="text-white/40 text-sm font-mono">Secondary</span>
                </div>
                <div className="flex-1 relative flex items-center justify-center" style={{ backgroundColor: selectedTheme.colors.accent }}>
                  <span className="text-white/40 text-sm font-mono">Accent</span>
                </div>
              </div>

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTheme.name}
                  {selectedTheme.popular && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                      <Flame className="size-3 mr-0.5" />
                      Popular
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>{selectedTheme.description}</DialogDescription>
              </DialogHeader>

              {/* All colors */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Color Palette</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedTheme.colors).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <div
                        className="size-8 rounded-lg border border-border/50 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <p className="text-xs text-muted-foreground capitalize">{name}</p>
                        <p className="text-xs font-mono">{color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Font & style info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Details</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <span className="text-lg" style={{ fontFamily: selectedTheme.fontFamily }}>Aa</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Font</p>
                      <p className="text-xs font-medium">{selectedTheme.fontFamily}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Palette className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mood</p>
                      <p className="text-xs font-medium">{selectedTheme.mood}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 py-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Download className="size-3.5" />
                  {selectedTheme.useCount.toLocaleString()} uses
                </span>
              </div>

              {/* CTA */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleUseTheme(selectedTheme)}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600 text-white"
                >
                  <Palette className="size-4 mr-2" />
                  Apply This Theme
                </Button>
                <Button variant="outline" onClick={() => setSelectedTheme(null)} className="flex-1">
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

// =============================================================================
// Helpers
// =============================================================================

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
