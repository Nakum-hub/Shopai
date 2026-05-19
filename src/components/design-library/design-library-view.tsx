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
}

const componentVariants: Record<DesignComponentCategory, ComponentVariant[]> = {
  hero: [
    { id: 'hero-gradient', name: 'Gradient Overlays', style: 'gradient', description: 'Vibrant gradient background with text overlay and floating elements', tags: ['gradient', 'animated', 'modern'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 via-fuchsia-500 to-pink-500' },
    { id: 'hero-split', name: 'Split Layout', style: 'minimal', description: 'Side-by-side layout with image on one side and content on the other', tags: ['split', 'responsive', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-neutral-100 to-neutral-200' },
    { id: 'hero-centered', name: 'Centered Minimalist', style: 'minimal', description: 'Clean centered text with a single CTA button', tags: ['centered', 'minimal', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-stone-50 to-stone-100' },
    { id: 'hero-dark', name: 'Dark Cinematic', style: 'dark', description: 'Dark background with dramatic lighting effects and bold typography', tags: ['dark', 'cinematic', 'bold'], difficulty: 'intermediate', popular: true, previewGradient: 'from-gray-900 via-slate-800 to-gray-900' },
    { id: 'hero-glass', name: 'Glassmorphism', style: 'glass', description: 'Frosted glass elements over a colorful background', tags: ['glass', 'blur', 'modern'], difficulty: 'intermediate', popular: false, previewGradient: 'from-cyan-400 via-blue-500 to-purple-600' },
    { id: 'hero-3d', name: '3D Elements', style: 'bold', description: 'Floating 3D elements and perspective transforms', tags: ['3d', 'animated', 'interactive'], difficulty: 'advanced', popular: false, previewGradient: 'from-orange-500 via-red-500 to-pink-500' },
  ],
  navigation: [
    { id: 'nav-sticky', name: 'Sticky White', style: 'minimal', description: 'Clean white navigation bar that sticks to the top on scroll', tags: ['sticky', 'clean', 'white'], difficulty: 'beginner', popular: true, previewGradient: 'from-white to-gray-50' },
    { id: 'nav-transparent', name: 'Transparent Overlay', style: 'minimal', description: 'Transparent nav that becomes solid on scroll', tags: ['transparent', 'overlay', 'hero'], difficulty: 'intermediate', popular: true, previewGradient: 'from-transparent to-black/20' },
    { id: 'nav-dark', name: 'Dark Mode', style: 'dark', description: 'Sleek dark navigation with light text', tags: ['dark', 'modern', 'elegant'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-gray-800' },
    { id: 'nav-mega', name: 'Mega Dropdown', style: 'bold', description: 'Expandable mega menu with multi-column dropdowns', tags: ['mega', 'dropdown', 'multi-column'], difficulty: 'advanced', popular: false, previewGradient: 'from-blue-50 to-indigo-50' },
    { id: 'nav-centered', name: 'Centered Links', style: 'minimal', description: 'Logo centered with links distributed on both sides', tags: ['centered', 'symmetric', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-neutral-100' },
    { id: 'nav-sidebar', name: 'Side Drawer', style: 'glass', description: 'Hamburger-triggered sidebar navigation', tags: ['sidebar', 'hamburger', 'mobile'], difficulty: 'intermediate', popular: false, previewGradient: 'from-slate-800 to-slate-900' },
  ],
  features: [
    { id: 'feat-icon-grid', name: 'Icon Grid', style: 'minimal', description: 'Grid of feature cards with icons and descriptions', tags: ['icons', 'grid', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-emerald-50 to-teal-50' },
    { id: 'feat-alternating', name: 'Alternating Rows', style: 'bold', description: 'Alternating image-text rows for feature showcases', tags: ['alternating', 'images', 'storytelling'], difficulty: 'intermediate', popular: true, previewGradient: 'from-blue-50 to-cyan-50' },
    { id: 'feat-bento', name: 'Bento Grid', style: 'bold', description: 'Apple-style bento grid with mixed card sizes', tags: ['bento', 'grid', 'mixed'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50' },
    { id: 'feat-cards', name: 'Elevated Cards', style: 'glass', description: 'Floating cards with hover effects and shadows', tags: ['cards', 'hover', 'shadows'], difficulty: 'beginner', popular: false, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'feat-timeline', name: 'Timeline List', style: 'minimal', description: 'Vertical timeline with connected feature milestones', tags: ['timeline', 'milestones', 'vertical'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50' },
    { id: 'feat-tabs', name: 'Tabbed Showcase', style: 'gradient', description: 'Feature tabs with animated content switching', tags: ['tabs', 'interactive', 'animated'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-purple-50' },
  ],
  pricing: [
    { id: 'price-3col', name: '3-Column Cards', style: 'minimal', description: 'Classic three-column pricing layout with highlight', tags: ['3-column', 'classic', 'popular'], difficulty: 'beginner', popular: true, previewGradient: 'from-amber-50 to-yellow-50' },
    { id: 'price-toggle', name: 'Monthly/Yearly Toggle', style: 'glass', description: 'Pricing with monthly/yearly toggle switch', tags: ['toggle', 'billing', 'interactive'], difficulty: 'intermediate', popular: true, previewGradient: 'from-cyan-50 to-blue-50' },
    { id: 'price-dark', name: 'Dark Premium', style: 'dark', description: 'Dark-themed pricing cards with gradient accents', tags: ['dark', 'premium', 'gradient'], difficulty: 'intermediate', popular: false, previewGradient: 'from-gray-900 to-slate-800' },
    { id: 'price-comparison', name: 'Comparison Table', style: 'minimal', description: 'Feature comparison table across plans', tags: ['comparison', 'table', 'features'], difficulty: 'advanced', popular: false, previewGradient: 'from-green-50 to-emerald-50' },
    { id: 'price-gradient', name: 'Gradient Highlight', style: 'gradient', description: 'Popular plan highlighted with gradient border', tags: ['gradient', 'highlight', 'popular'], difficulty: 'beginner', popular: false, previewGradient: 'from-violet-500 to-fuchsia-500' },
    { id: 'price-minimal', name: 'Ultra Minimal', style: 'minimal', description: 'Stripped-down pricing with just the essentials', tags: ['minimal', 'clean', 'simple'], difficulty: 'beginner', popular: false, previewGradient: 'from-neutral-50 to-stone-50' },
  ],
  testimonials: [
    { id: 'test-cards', name: 'Card Grid', style: 'minimal', description: 'Testimonial cards in a responsive grid layout', tags: ['cards', 'grid', 'avatars'], difficulty: 'beginner', popular: true, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'test-carousel', name: 'Carousel Slider', style: 'bold', description: 'Auto-sliding testimonial carousel', tags: ['carousel', 'slider', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-orange-50 to-amber-50' },
    { id: 'test-quote', name: 'Large Quote', style: 'minimal', description: 'Full-width quote with large typography', tags: ['quote', 'typography', 'large'], difficulty: 'beginner', popular: false, previewGradient: 'from-slate-50 to-gray-50' },
    { id: 'test-social-proof', name: 'Social Proof Bar', style: 'bold', description: 'Logo wall + stats bar for social proof', tags: ['logos', 'stats', 'social-proof'], difficulty: 'beginner', popular: true, previewGradient: 'from-indigo-50 to-violet-50' },
    { id: 'test-video', name: 'Video Testimonials', style: 'dark', description: 'Embedded video testimonials with play buttons', tags: ['video', 'multimedia', 'engaging'], difficulty: 'advanced', popular: false, previewGradient: 'from-gray-900 to-zinc-900' },
    { id: 'test-masonry', name: 'Masonry Layout', style: 'bold', description: 'Pinterest-style masonry layout for varied testimonials', tags: ['masonry', 'varied', 'dynamic'], difficulty: 'intermediate', popular: false, previewGradient: 'from-teal-50 to-cyan-50' },
  ],
  cta: [
    { id: 'cta-gradient', name: 'Gradient Banner', style: 'gradient', description: 'Full-width gradient CTA with bold typography', tags: ['gradient', 'bold', 'banner'], difficulty: 'beginner', popular: true, previewGradient: 'from-violet-600 to-fuchsia-500' },
    { id: 'cta-split', name: 'Split Content', style: 'minimal', description: 'Image on one side, CTA form on the other', tags: ['split', 'form', 'image'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-indigo-50' },
    { id: 'cta-newsletter', name: 'Newsletter Signup', style: 'glass', description: 'Email signup with glassmorphism card design', tags: ['newsletter', 'email', 'signup'], difficulty: 'beginner', popular: true, previewGradient: 'from-cyan-400 to-blue-500' },
    { id: 'cta-dark', name: 'Dark CTA', style: 'dark', description: 'Dark background with neon accent button', tags: ['dark', 'neon', 'dramatic'], difficulty: 'beginner', popular: false, previewGradient: 'from-gray-900 to-slate-900' },
    { id: 'cta-minimal', name: 'Simple Button', style: 'minimal', description: 'Ultra-minimal centered CTA with single button', tags: ['minimal', 'simple', 'clean'], difficulty: 'beginner', popular: false, previewGradient: 'from-white to-stone-50' },
    { id: 'cta-animated', name: 'Animated Glow', style: 'gradient', description: 'Animated glowing border CTA with particle effects', tags: ['animated', 'glow', 'particles'], difficulty: 'advanced', popular: false, previewGradient: 'from-purple-600 via-pink-500 to-red-500' },
  ],
  about: [
    { id: 'about-team', name: 'Team Grid', style: 'minimal', description: 'Team member cards with photos, names, and roles', tags: ['team', 'grid', 'photos'], difficulty: 'beginner', popular: true, previewGradient: 'from-teal-50 to-cyan-50' },
    { id: 'about-timeline', name: 'Company Timeline', style: 'minimal', description: 'Vertical timeline of company milestones', tags: ['timeline', 'history', 'milestones'], difficulty: 'intermediate', popular: false, previewGradient: 'from-amber-50 to-orange-50' },
    { id: 'about-stats', name: 'Stats Counter', style: 'bold', description: 'Animated counter section with key metrics', tags: ['stats', 'counter', 'animated'], difficulty: 'intermediate', popular: true, previewGradient: 'from-violet-50 to-purple-50' },
    { id: 'about-faq', name: 'FAQ Accordion', style: 'minimal', description: 'Expandable FAQ accordion with smooth animations', tags: ['faq', 'accordion', 'interactive'], difficulty: 'beginner', popular: true, previewGradient: 'from-green-50 to-emerald-50' },
    { id: 'about-gallery', name: 'Image Gallery', style: 'glass', description: 'Responsive image gallery with lightbox', tags: ['gallery', 'images', 'lightbox'], difficulty: 'intermediate', popular: false, previewGradient: 'from-pink-50 to-rose-50' },
    { id: 'about-story', name: 'Story Section', style: 'bold', description: 'Visual storytelling with images and text blocks', tags: ['story', 'visual', 'narrative'], difficulty: 'intermediate', popular: false, previewGradient: 'from-blue-50 to-sky-50' },
  ],
  footer: [
    { id: 'foot-multicolumn', name: 'Multi-Column', style: 'minimal', description: 'Classic 4-column footer with links and social', tags: ['columns', 'links', 'classic'], difficulty: 'beginner', popular: true, previewGradient: 'from-gray-900 to-gray-800' },
    { id: 'foot-minimal', name: 'Minimal Centered', style: 'minimal', description: 'Simple centered footer with just the essentials', tags: ['minimal', 'centered', 'clean'], difficulty: 'beginner', popular: true, previewGradient: 'from-stone-100 to-neutral-100' },
    { id: 'foot-dark', name: 'Dark Social', style: 'dark', description: 'Dark footer with prominent social media links', tags: ['dark', 'social', 'icons'], difficulty: 'beginner', popular: false, previewGradient: 'from-zinc-900 to-neutral-900' },
    { id: 'foot-newsletter', name: 'Newsletter Footer', style: 'gradient', description: 'Footer with integrated email signup form', tags: ['newsletter', 'signup', 'email'], difficulty: 'intermediate', popular: false, previewGradient: 'from-violet-900 to-indigo-900' },
    { id: 'foot-mega', name: 'Mega Footer', style: 'bold', description: 'Full-width mega footer with sitemap and resources', tags: ['mega', 'sitemap', 'comprehensive'], difficulty: 'advanced', popular: false, previewGradient: 'from-slate-100 to-gray-100' },
    { id: 'foot-creative', name: 'Creative Layout', style: 'bold', description: 'Asymmetric creative footer with unique design', tags: ['creative', 'asymmetric', 'unique'], difficulty: 'advanced', popular: false, previewGradient: 'from-fuchsia-50 to-pink-50' },
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
  const codeMap: Record<string, string> = {
    'hero-gradient': `<section class="relative overflow-hidden min-h-[600px] flex items-center justify-center" style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%);">
  <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
    <span class="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">\u2728 Something New</span>
    <h1 class="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">Build Something Amazing Today</h1>
    <p class="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">Create beautiful, performant websites with our modern toolkit designed for the next generation of web developers.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">Get Started Free</a>
      <a href="#" class="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/25 hover:bg-white/20 transition-colors">Watch Demo \u2192</a>
    </div>
  </div>
</section>`,

    'hero-split': `<section class="min-h-[600px] flex items-center bg-white">
  <div class="flex-1 relative hidden lg:block">
    <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800" alt="Team working" class="absolute inset-0 w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
  </div>
  <div class="flex-1 px-6 md:px-12 lg:px-16 py-16">
    <span class="inline-block px-3 py-1 bg-violet-100 text-violet-700 text-sm font-medium rounded-full mb-4">New Release v2.0</span>
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">The Modern Way to Build Websites</h1>
    <p class="text-lg text-gray-600 mb-8 max-w-lg">Ship faster with our all-in-one platform. From design to deployment, everything you need in one place.</p>
    <div class="flex flex-col sm:flex-row gap-3">
      <a href="#" class="px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition-colors">Start Building</a>
      <a href="#" class="px-6 py-3 text-gray-700 font-semibold rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">View Examples</a>
    </div>
    <div class="flex items-center gap-6 mt-10 text-sm text-gray-500">
      <span class="flex items-center gap-1.5">\u2713 No credit card</span>
      <span class="flex items-center gap-1.5">\u2713 Free 14-day trial</span>
    </div>
  </div>
</section>`,

    'hero-centered': `<section class="min-h-[500px] flex items-center justify-center bg-stone-50">
  <div class="max-w-2xl mx-auto px-6 text-center">
    <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Less Noise. More Signal.</h1>
    <p class="text-lg text-gray-600 mb-10 max-w-lg mx-auto">A minimalist toolkit designed for clarity. Focus on what matters, ship with confidence.</p>
    <a href="#" class="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
      Get Started <span>\u2192</span>
    </a>
  </div>
</section>`,

    'hero-dark': `<section class="relative min-h-[600px] flex items-center justify-center bg-gray-950 overflow-hidden">
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]"></div>
  <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
  <div class="relative z-10 max-w-4xl mx-auto px-6 text-center">
    <h1 class="text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tight">THE FUTURE<br/><span class="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">IS NOW</span></h1>
    <p class="text-lg text-gray-400 max-w-xl mx-auto mb-10">Experience the next evolution in web technology. Built for speed, designed for impact.</p>
    <a href="#" class="inline-block px-10 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-2xl shadow-violet-500/25">Enter the Future</a>
  </div>
</section>`,

    'hero-glass': `<section class="relative min-h-[600px] flex items-center justify-center overflow-hidden" style="background: linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6);">
  <div class="absolute inset-0 backdrop-blur-[1px]"></div>
  <div class="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
  <div class="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
  <div class="relative z-10 max-w-2xl mx-auto px-6 text-center">
    <div class="bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 p-10 shadow-2xl">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">Crystal Clear Design</h1>
      <p class="text-white/80 text-lg mb-8">Beautiful glassmorphic interfaces that feel modern, elegant, and alive.</p>
      <a href="#" class="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-white/90 transition-colors">Explore Now</a>
    </div>
  </div>
</section>`,

    'hero-3d': `<section class="relative min-h-[600px] flex items-center justify-center bg-gray-900 overflow-hidden">
  <div class="absolute inset-0" style="perspective: 1000px;">
    <div class="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl rotate-12 shadow-2xl" style="transform: translateZ(80px) rotateX(10deg);"></div>
    <div class="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full shadow-2xl" style="transform: translateZ(40px);"></div>
    <div class="absolute bottom-1/3 left-1/3 w-28 h-28 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl -rotate-6 shadow-2xl" style="transform: translateZ(60px) rotateY(-10deg);"></div>
  </div>
  <div class="relative z-10 max-w-2xl mx-auto px-6 text-center">
    <h1 class="text-5xl md:text-6xl font-black text-white mb-6">Dimensional Design</h1>
    <p class="text-lg text-gray-300 mb-8">Step into the third dimension. Interactive 3D elements that captivate and engage.</p>
    <a href="#" class="inline-block px-8 py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-shadow">Get Started</a>
  </div>
</section>`,

    'nav-sticky': `<nav class="sticky top-0 z-50 bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-900">Brand<span class="text-violet-600">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Products</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Solutions</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Resources</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</a>
      <a href="#" class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Get Started</a>
    </div>
  </div>
</nav>`,

    'nav-transparent': `<nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300" id="mainNav">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand<span class="text-cyan-400">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Products</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Features</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">Pricing</a>
      <a href="#" class="text-sm font-medium text-white/80 hover:text-white transition-colors">About</a>
    </div>
    <a href="#" class="px-5 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-colors">Sign Up</a>
  </div>
</nav>
<script>
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (window.scrollY > 50) { nav.style.background = 'rgba(15,23,42,0.9)'; nav.style.backdropFilter = 'blur(12px)'; }
  else { nav.style.background = 'transparent'; nav.style.backdropFilter = 'none'; }
});
</script>`,

    'nav-dark': `<nav class="bg-gray-950 border-b border-gray-800">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-white">Brand<span class="text-emerald-400">.</span></a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Docs</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Components</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Blog</a>
      <a href="#" class="text-sm font-medium text-gray-400 hover:text-white transition-colors">Pricing</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors">GitHub</a>
      <a href="#" class="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-500 transition-colors">Get Started</a>
    </div>
  </div>
</nav>`,

    'nav-mega': `<nav class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-900">Brand</a>
    <div class="hidden lg:flex items-center gap-6" id="megaNav">
      <div class="relative group">
        <button class="text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1">Products <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
        <div class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
          <div class="w-[480px] bg-white rounded-xl shadow-xl border border-gray-100 p-6 grid grid-cols-2 gap-6">
            <div><h3 class="font-semibold text-gray-900 mb-3 text-sm">Platform</h3>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">Analytics</a>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">Automation</a>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">Integrations</a>
            </div>
            <div><h3 class="font-semibold text-gray-900 mb-3 text-sm">Resources</h3>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">Documentation</a>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">API Reference</a>
              <a href="#" class="block text-sm text-gray-600 hover:text-violet-600 py-1">Community</a>
            </div>
          </div>
        </div>
      </div>
      <a href="#" class="text-sm font-medium text-gray-700 hover:text-gray-900">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-700 hover:text-gray-900">Blog</a>
    </div>
    <a href="#" class="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg">Sign Up</a>
  </div>
</nav>`,

    'nav-centered': `<nav class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-900">Brand</a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Home</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Work</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
    </div>
    <a href="#" class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">Hire Us</a>
  </div>
</nav>`,

    'nav-sidebar': `<nav class="bg-white border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="#" class="text-xl font-bold text-gray-900">Brand</a>
    <button onclick="document.getElementById('sidebar').classList.toggle('-translate-x-full')" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    <div class="hidden md:flex items-center gap-6">
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</a>
      <a href="#" class="text-sm font-medium text-gray-600 hover:text-gray-900">Docs</a>
      <a href="#" class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">Sign In</a>
    </div>
  </div>
</nav>
<div id="sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform -translate-x-full transition-transform duration-300 p-6">
  <button onclick="this.parentElement.classList.add('-translate-x-full')" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">\u2715</button>
  <div class="mt-8 space-y-4">
    <a href="#" class="block text-lg font-medium text-gray-900 hover:text-violet-600">Home</a>
    <a href="#" class="block text-lg font-medium text-gray-900 hover:text-violet-600">Features</a>
    <a href="#" class="block text-lg font-medium text-gray-900 hover:text-violet-600">Pricing</a>
    <a href="#" class="block text-lg font-medium text-gray-900 hover:text-violet-600">Contact</a>
  </div>
</div>`,

    'feat-icon-grid': `<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">Powerful features to help you build, launch, and grow your online presence.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-4">\u26a1</div>
        <h3 class="font-semibold text-gray-900 mb-2">Lightning Fast</h3>
        <p class="text-sm text-gray-600">Optimized for speed with edge caching and CDN delivery worldwide.</p>
      </div>
      <div class="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">\U0001f512</div>
        <h3 class="font-semibold text-gray-900 mb-2">Secure by Default</h3>
        <p class="text-sm text-gray-600">SSL certificates, DDoS protection, and automatic backups included.</p>
      </div>
      <div class="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">\U0001f4ca</div>
        <h3 class="font-semibold text-gray-900 mb-2">Analytics Built-in</h3>
        <p class="text-sm text-gray-600">Track visitors, conversions, and engagement with real-time dashboards.</p>
      </div>
    </div>
  </div>
</section>`,

    'feat-bento': `<section class="py-20 bg-gray-50">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-gray-900 mb-10">Built for Modern Teams</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="md:col-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl p-8 text-white">
        <h3 class="text-2xl font-bold mb-3">AI-Powered Design</h3>
        <p class="text-white/80">Let our AI engine generate beautiful layouts tailored to your brand identity.</p>
      </div>
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 mb-3">Drag & Drop</h3>
        <p class="text-gray-600">Intuitive visual editor that requires zero coding skills.</p>
      </div>
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 mb-3">SEO Tools</h3>
        <p class="text-gray-600">Automatic meta tags, sitemaps, and structured data generation.</p>
      </div>
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-900 mb-3">Analytics</h3>
        <p class="text-gray-600">Real-time visitor tracking and conversion funnels.</p>
      </div>
      <div class="bg-gray-900 rounded-2xl p-8 text-white">
        <h3 class="text-lg font-bold mb-3">\U0001f680 One-Click Deploy</h3>
        <p class="text-gray-400">Publish to custom domain or free subdomain instantly.</p>
      </div>
    </div>
  </div>
</section>`,

    'price-3col': `<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <div class="text-center mb-14">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
      <p class="text-gray-600 text-lg">Choose the plan that fits your needs. No hidden fees.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      <div class="rounded-2xl border border-gray-200 p-8">
        <h3 class="font-semibold text-gray-900 text-lg">Starter</h3>
        <p class="text-gray-500 text-sm mt-1">For personal projects</p>
        <div class="mt-6 mb-6"><span class="text-4xl font-bold text-gray-900">$9</span><span class="text-gray-500">/month</span></div>
        <a href="#" class="block text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Get Started</a>
      </div>
      <div class="rounded-2xl border-2 border-violet-600 p-8 relative shadow-lg shadow-violet-500/10">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-600 text-white text-xs font-medium rounded-full">Popular</span>
        <h3 class="font-semibold text-gray-900 text-lg">Professional</h3>
        <p class="text-gray-500 text-sm mt-1">For growing businesses</p>
        <div class="mt-6 mb-6"><span class="text-4xl font-bold text-gray-900">$29</span><span class="text-gray-500">/month</span></div>
        <a href="#" class="block text-center py-2.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors">Get Started</a>
      </div>
      <div class="rounded-2xl border border-gray-200 p-8">
        <h3 class="font-semibold text-gray-900 text-lg">Enterprise</h3>
        <p class="text-gray-500 text-sm mt-1">For large teams</p>
        <div class="mt-6 mb-6"><span class="text-4xl font-bold text-gray-900">$99</span><span class="text-gray-500">/month</span></div>
        <a href="#" class="block text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Contact Sales</a>
      </div>
    </div>
  </div>
</section>`,

    'test-cards': `<section class="py-20 bg-gray-50">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Loved by Thousands</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex gap-1 mb-3">\u2b50\u2b50\u2b50\u2b50\u2b50</div>
        <p class="text-gray-700 mb-4">"This platform completely transformed how we build websites. We launched in under an hour!"</p>
        <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center font-bold text-violet-600">S</div><div><p class="font-medium text-gray-900 text-sm">Sarah Chen</p><p class="text-xs text-gray-500">CEO, TechFlow</p></div></div>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex gap-1 mb-3">\u2b50\u2b50\u2b50\u2b50\u2b50</div>
        <p class="text-gray-700 mb-4">"The AI-powered design is incredible. It understood our brand perfectly and generated exactly what we needed."</p>
        <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600">M</div><div><p class="font-medium text-gray-900 text-sm">Marcus Rivera</p><p class="text-xs text-gray-500">Founder, GreenLeaf</p></div></div>
      </div>
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div class="flex gap-1 mb-3">\u2b50\u2b50\u2b50\u2b50\u2b50</div>
        <p class="text-gray-700 mb-4">"Best investment for our small business. Professional website without the professional price tag."</p>
        <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-600">P</div><div><p class="font-medium text-gray-900 text-sm">Priya Patel</p><p class="text-xs text-gray-500">Owner, Spice Route</p></div></div>
      </div>
    </div>
  </div>
</section>`,

    'cta-gradient': `<section class="py-20" style="background: linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #ec4899 100%);">
  <div class="max-w-3xl mx-auto px-6 text-center">
    <h2 class="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Build Your Website?</h2>
    <p class="text-lg text-white/80 mb-10 max-w-xl mx-auto">Join thousands of businesses already using our platform. Start for free, no credit card required.</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#" class="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-xl">Start Building Free</a>
      <a href="#" class="px-8 py-4 text-white font-medium rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors">Talk to Sales</a>
    </div>
  </div>
</section>`,

    'about-team': `<section class="py-20 bg-white">
  <div class="max-w-6xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center text-gray-900 mb-4">Meet Our Team</h2>
    <p class="text-gray-600 text-center mb-12 max-w-xl mx-auto">The passionate people behind our mission to make the web accessible to everyone.</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <div class="text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">A</div>
        <h3 class="font-semibold text-gray-900">Alex Johnson</h3>
        <p class="text-sm text-gray-500">CEO & Founder</p>
      </div>
      <div class="text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">M</div>
        <h3 class="font-semibold text-gray-900">Maya Singh</h3>
        <p class="text-sm text-gray-500">Head of Design</p>
      </div>
      <div class="text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">R</div>
        <h3 class="font-semibold text-gray-900">Raj Patel</h3>
        <p class="text-sm text-gray-500">Lead Engineer</p>
      </div>
      <div class="text-center">
        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">L</div>
        <h3 class="font-semibold text-gray-900">Lisa Chen</h3>
        <p class="text-sm text-gray-500">Product Manager</p>
      </div>
    </div>
  </div>
</section>`,

    'about-faq': `<section class="py-20 bg-white">
  <div class="max-w-3xl mx-auto px-6">
    <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
    <div class="space-y-4">
      <details class="group border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
        <summary class="flex items-center justify-between cursor-pointer font-medium text-gray-900">How does the AI website builder work?<svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
        <p class="mt-3 text-gray-600">Simply describe your business using voice or text. Our AI analyzes your requirements and generates a complete, professional website in minutes.</p>
      </details>
      <details class="group border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
        <summary class="flex items-center justify-between cursor-pointer font-medium text-gray-900">Can I customize the generated website?<svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
        <p class="mt-3 text-gray-600">Absolutely! You can edit every section, change colors, fonts, images, and content. The visual editor makes it easy without any coding knowledge.</p>
      </details>
      <details class="group border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
        <summary class="flex items-center justify-between cursor-pointer font-medium text-gray-900">Is there a free plan available?<svg class="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></summary>
        <p class="mt-3 text-gray-600">Yes! Our free plan includes one website with basic features. Upgrade anytime for premium templates, custom domains, and advanced analytics.</p>
      </details>
    </div>
  </div>
</section>`,

    'foot-multicolumn': `<footer class="bg-gray-950 text-gray-400 pt-16 pb-8">
  <div class="max-w-6xl mx-auto px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
      <div>
        <h4 class="text-white font-semibold mb-4">Product</h4>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Features</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Templates</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Pricing</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Integrations</a>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Company</h4>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">About</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Blog</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Careers</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Contact</a>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Resources</h4>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Documentation</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Help Center</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Community</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Status</a>
      </div>
      <div>
        <h4 class="text-white font-semibold mb-4">Legal</h4>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Privacy</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Terms</a>
        <a href="#" class="block text-sm hover:text-white py-1 transition-colors">Cookie Policy</a>
      </div>
    </div>
    <div class="border-t border-gray-800 pt-8 text-sm text-gray-500 text-center">&copy; 2025 Brand Inc. All rights reserved.</div>
  </div>
</footer>`,

    'foot-minimal': `<footer class="bg-white border-t border-gray-200 py-10">
  <div class="max-w-6xl mx-auto px-6 text-center">
    <a href="#" class="text-xl font-bold text-gray-900">Brand<span class="text-violet-600">.</span></a>
    <p class="text-sm text-gray-500 mt-3 max-w-md mx-auto">Building beautiful websites for everyone. Made with love by the Brand team.</p>
    <div class="flex justify-center gap-6 mt-6">
      <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy</a>
      <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms</a>
      <a href="#" class="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact</a>
    </div>
    <p class="text-xs text-gray-400 mt-6">&copy; 2025 Brand Inc.</p>
  </div>
</footer>`,

    'cta-newsletter': `<section class="py-20 bg-white">
  <div class="max-w-xl mx-auto px-6">
    <div class="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-10 text-center text-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      <div class="relative z-10">
        <h2 class="text-2xl md:text-3xl font-bold mb-3">Stay in the Loop</h2>
        <p class="text-white/80 mb-6">Get the latest updates, tips, and exclusive offers delivered to your inbox.</p>
        <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" placeholder="Enter your email" class="flex-1 px-4 py-3 rounded-lg bg-white/15 backdrop-blur-sm border border-white/25 text-white placeholder-white/60 focus:outline-none focus:border-white/50" />
          <button class="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-colors shrink-0">Subscribe</button>
        </div>
        <p class="text-xs text-white/60 mt-3">No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  </div>
</section>`,
  };

  return codeMap[variant.id] || `<section class="py-16 px-6">\n  <div class="max-w-4xl mx-auto text-center">\n    <h2 class="text-3xl font-bold mb-4">${variant.name}</h2>\n    <p class="text-gray-600">${variant.description}</p>\n  </div>\n</section>`;
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
                  {filteredVariants.map((variant) => (
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
