'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { Template, BusinessCategory } from '@/lib/types';
import { allTemplates } from '@/data/templates';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Eye,
  Sparkles,
  Layout,
  Palette,
  Type,
  Layers,
  ArrowRight,
  Star,
  TrendingUp,
  ScrollText,
  Monitor,
  Filter,
  X,
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

const localTemplates: Template[] = allTemplates;

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
  { label: 'Grocery', value: 'grocery' },
  { label: 'Hardware', value: 'hardware' },
  { label: 'Medical', value: 'medical' },
  { label: 'Boutique', value: 'boutique' },
  { label: 'Service', value: 'service' },
  { label: 'Other', value: 'other' },
];

type SortOption = 'popular' | 'newest' | 'sections';

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
  features: 'Features',
  pricing: 'Pricing',
  events: 'Events',
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// =============================================================================
// TemplatesView
// =============================================================================

export function TemplatesView() {
  const { setCurrentView, setSelectedTemplate: setStoreTemplate } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BusinessCategory | 'all'>('all');
  const [activeMood, setActiveMood] = useState<string>('all');
  const [activeSectionType, setActiveSectionType] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategory, activeMood, activeSectionType, searchQuery]);

  // Reset mood and section type filters when category changes
  useEffect(() => {
    setActiveMood('all');
    setActiveSectionType('all');
  }, [activeCategory]);

  // Fetch templates from API on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        // Fix 1: API response is wrapped in { success, data: { templates } }
        const raw = (data as any).data?.templates as unknown[];
        if (!Array.isArray(raw) || raw.length === 0) {
          // API returned empty – use local mock
          setTemplates(localTemplates);
          return;
        }

        // Validate that sections are StorefrontSection objects (not strings)
        const valid = raw.every(
          (t: unknown) => {
            const obj = t as Record<string, unknown>;
            const sections = obj.sections;
            return (
              t &&
              typeof t === 'object' &&
              Array.isArray(sections) &&
              sections.length > 0 &&
              typeof sections[0] === 'object' &&
              sections[0] !== null &&
              'type' in sections[0]
            );
          }
        );

        if (valid) {
          setTemplates(raw as Template[]);
        } else {
          // API mock data has sections as strings – fall back to local mocks
          setTemplates(localTemplates);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[TemplatesView] fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplates(localTemplates);
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
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTemplates([]);
    fetch('/api/templates')
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        // Fix 1: API response is wrapped in { success, data: { templates } }
        const raw = (data as any).data?.templates as unknown[];
        if (Array.isArray(raw) && raw.length > 0) {
          const valid = raw.every(
            (t: unknown) => {
              const obj = t as Record<string, unknown>;
              const sections = obj.sections;
              return (
                t &&
                typeof t === 'object' &&
                Array.isArray(sections) &&
                sections.length > 0 &&
                typeof sections[0] === 'object' &&
                sections[0] !== null &&
                'type' in sections[0]
              );
            }
          );
          if (valid) {
            setTemplates(raw as Template[]);
            setError(null);
          } else {
            setTemplates(localTemplates);
          }
        } else {
          setTemplates(localTemplates);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplates(localTemplates);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
  }, []);

  // Featured templates (all featured, or first template as fallback)
  const featuredTemplates = useMemo(() => {
    const featured = templates.filter((t) => t.featured);
    return featured.length > 0 ? featured : templates.length > 0 ? [templates[0]] : [];
  }, [templates]);
  const featuredTemplate = featuredTemplates[0];

  // Fix 4: Extract unique moods and section types
  const uniqueMoods = useMemo(
    () => [...new Set(templates.map((t) => t.style.mood))].sort(),
    [templates]
  );

  const uniqueSectionTypes = useMemo(
    () => [...new Set(templates.flatMap((t) => t.sections.map((s) => s.type)))].sort(),
    [templates]
  );

  // Fix 4: Check if any non-default filter is active
  const hasActiveFilters = activeCategory !== 'all' || activeMood !== 'all' || activeSectionType !== 'all' || searchQuery.trim() !== '';

  const resetAllFilters = useCallback(() => {
    setActiveCategory('all');
    setActiveMood('all');
    setActiveSectionType('all');
    setSearchQuery('');
  }, []);

  // Filter & sort
  const filteredTemplates = useMemo(() => {
    let result = templates.filter((t) => t.id !== featuredTemplate?.id);

    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category === activeCategory);
    }

    // Fix 4: Mood filter
    if (activeMood !== 'all') {
      result = result.filter((t) => t.style.mood === activeMood);
    }

    // Fix 4: Section type filter
    if (activeSectionType !== 'all') {
      result = result.filter((t) => t.sections.some((s) => s.type === activeSectionType));
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

    // Fix 3: Updated sort options
    switch (sortOption) {
      case 'popular':
        result.sort((a, b) => {
          const popDiff = (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
          if (popDiff !== 0) return popDiff;
          return a.name.localeCompare(b.name);
        });
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'sections':
        result.sort((a, b) => b.sections.length - a.sections.length);
        break;
    }

    return result;
  }, [searchQuery, activeCategory, activeMood, activeSectionType, sortOption, templates, featuredTemplate?.id]);

  // Rich HTML preview — renders each section type as a professional website section
  const previewHtml = useMemo(() => {
    if (!selectedTemplate) return '';
    const t = selectedTemplate;
    const pc = t.style.primaryColor;
    const sc = t.style.secondaryColor;
    const ff = t.style.fontFamily;
    const isDark = t.style.theme === 'bold' || t.style.mood === 'luxury' || t.style.mood === 'sophisticated';
    const bg = isDark ? '#0f0f0f' : '#ffffff';
    const textMain = isDark ? '#f1f1f1' : '#1a1a1a';
    const textMuted = isDark ? '#a0a0a0' : '#6b7280';
    const cardBg = isDark ? '#1a1a1a' : '#f9fafb';
    const borderCol = isDark ? '#2a2a2a' : '#e5e7eb';

    // SVG icons as inline data URIs for each section
    const icons: Record<string, string> = {
      star: `<svg width="20" height="20" fill="${pc}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
      quote: `<svg width="32" height="32" fill="${pc}" opacity="0.3" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>`,
      phone: `<svg width="18" height="18" fill="none" stroke="${pc}" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
      clock: `<svg width="18" height="18" fill="none" stroke="${pc}" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
      check: `<svg width="16" height="16" fill="${pc}" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`,
    };

    const sectionRenderers: Record<string, (s: typeof t.sections[0]) => string> = {
      hero: (s) => `
        <section style="background:linear-gradient(135deg,${pc},${sc});padding:80px 24px 72px;text-align:center;color:#fff;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%2230%22 r=%221%22 fill=%22rgba(255,255,255,0.08)%22/></svg>');"></div>
          <div style="position:relative;max-width:680px;margin:0 auto;">
            <h1 style="font-size:2.6rem;font-weight:700;line-height:1.15;margin-bottom:16px;letter-spacing:-0.02em;">${s.title}</h1>
            <p style="font-size:1.15rem;opacity:0.92;line-height:1.6;max-width:520px;margin:0 auto 28px;">${s.content}</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
              <a href="#" style="display:inline-block;padding:13px 32px;background:#fff;color:${pc};border-radius:8px;font-weight:600;font-size:0.95rem;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Get Started</a>
              <a href="#" style="display:inline-block;padding:13px 32px;background:rgba(255,255,255,0.15);color:#fff;border-radius:8px;font-weight:600;font-size:0.95rem;text-decoration:none;border:1px solid rgba(255,255,255,0.3);backdrop-filter:blur(4px);">Learn More</a>
            </div>
          </div>
        </section>`,

      about: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">
            <div>
              <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">About Us</p>
              <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:16px;line-height:1.2;">${s.title}</h2>
              <p style="color:${textMuted};line-height:1.7;font-size:0.95rem;">${s.content}</p>
            </div>
            <div style="background:linear-gradient(135deg,${pc}22,${sc}22);border-radius:16px;height:220px;display:flex;align-items:center;justify-content:center;">
              <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${pc},${sc});opacity:0.6;"></div>
            </div>
          </div>
        </section>`,

      products: (s) => `
        <section style="padding:64px 24px;background:${cardBg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Our Products</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:8px;">${s.title}</h2>
            <p style="color:${textMuted};margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto;">${s.content}</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
              ${[1,2,3].map(i => `
              <div style="background:${bg};border-radius:12px;overflow:hidden;border:1px solid ${borderCol};text-align:left;">
                <div style="height:140px;background:linear-gradient(${120+i*30}deg,${pc}18,${sc}25);display:flex;align-items:center;justify-content:center;">
                  <div style="width:48px;height:48px;border-radius:12px;background:${pc}30;"></div>
                </div>
                <div style="padding:16px;">
                  <h3 style="font-size:0.95rem;font-weight:600;color:${textMain};margin-bottom:4px;">Product ${i}</h3>
                  <p style="font-size:0.8rem;color:${textMuted};margin-bottom:10px;">Premium quality item</p>
                  <span style="font-weight:700;color:${pc};font-size:1rem;">$${(19.99 * i).toFixed(2)}</span>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      services: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Services</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
              ${['Consultation','Implementation','Support'].map((name, i) => `
              <div style="padding:28px 20px;background:${cardBg};border-radius:12px;border:1px solid ${borderCol};text-align:center;">
                <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,${pc},${sc});margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                  <div style="width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,0.4);"></div>
                </div>
                <h3 style="font-size:1rem;font-weight:600;color:${textMain};margin-bottom:6px;">${name}</h3>
                <p style="font-size:0.8rem;color:${textMuted};line-height:1.5;">${s.content.split(',')[i] || 'Professional service tailored to your needs'}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      gallery: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Gallery</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
              ${[0,1,2,3,4,5].map(i => `
              <div style="aspect-ratio:1;border-radius:12px;background:linear-gradient(${i*60}deg,${pc}${15+i*5},${sc}${20+i*5});display:flex;align-items:center;justify-content:center;overflow:hidden;">
                <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);"></div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      testimonials: (s) => `
        <section style="padding:64px 24px;background:${cardBg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Testimonials</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">
              ${[{n:'Sarah M.',r:'Amazing quality and service!',t:'5.0'},{n:'James K.',r:'Best in the city, highly recommend.',t:'4.9'}].map(rev => `
              <div style="background:${bg};border-radius:12px;padding:24px;text-align:left;border:1px solid ${borderCol};">
                <div style="margin-bottom:12px;">${icons.quote}</div>
                <p style="color:${textMain};font-size:0.9rem;line-height:1.6;margin-bottom:16px;font-style:italic;">"${rev.r}"</p>
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${pc},${sc});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:0.8rem;">${rev.n[0]}</div>
                  <div>
                    <p style="font-weight:600;font-size:0.85rem;color:${textMain};">${rev.n}</p>
                    <div style="display:flex;gap:2px;">${[1,2,3,4,5].map(() => icons.star).join('')}</div>
                  </div>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      contact: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;">
            <div>
              <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Contact</p>
              <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:16px;">${s.title}</h2>
              <p style="color:${textMuted};margin-bottom:24px;line-height:1.6;font-size:0.9rem;">${s.content}</p>
              <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;align-items:center;gap:10px;">${icons.phone}<span style="color:${textMain};font-size:0.9rem;">+1 (555) 123-4567</span></div>
                <div style="display:flex;align-items:center;gap:10px;">${icons.clock}<span style="color:${textMain};font-size:0.9rem;">Mon-Sat: 9AM - 8PM</span></div>
              </div>
            </div>
            <div style="background:${cardBg};border-radius:12px;padding:24px;border:1px solid ${borderCol};">
              <div style="margin-bottom:14px;"><label style="font-size:0.8rem;font-weight:600;color:${textMain};display:block;margin-bottom:6px;">Name</label><div style="height:40px;border-radius:8px;border:1px solid ${borderCol};background:${bg};"></div></div>
              <div style="margin-bottom:14px;"><label style="font-size:0.8rem;font-weight:600;color:${textMain};display:block;margin-bottom:6px;">Email</label><div style="height:40px;border-radius:8px;border:1px solid ${borderCol};background:${bg};"></div></div>
              <div style="margin-bottom:18px;"><label style="font-size:0.8rem;font-weight:600;color:${textMain};display:block;margin-bottom:6px;">Message</label><div style="height:80px;border-radius:8px;border:1px solid ${borderCol};background:${bg};"></div></div>
              <div style="height:42px;border-radius:8px;background:linear-gradient(135deg,${pc},${sc});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:0.9rem;cursor:pointer;">Send Message</div>
            </div>
          </div>
        </section>`,

      hours: (s) => `
        <section style="padding:56px 24px;background:${cardBg};">
          <div style="max-width:600px;margin:0 auto;text-align:center;">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px;">${icons.clock}<h2 style="font-size:1.5rem;font-weight:700;color:${textMain};">${s.title}</h2></div>
            <p style="color:${textMuted};margin-bottom:24px;">${s.content}</p>
            <div style="background:${bg};border-radius:12px;padding:20px;border:1px solid ${borderCol};">
              ${['Mon - Fri: 8AM - 9PM','Saturday: 9AM - 8PM','Sunday: 10AM - 6PM'].map(h => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${borderCol};"><span style="color:${textMain};font-size:0.9rem;">${h.split(':')[0]}</span><span style="color:${pc};font-weight:600;font-size:0.9rem;">${h.split(':').slice(1).join(':')}</span></div>`).join('')}
            </div>
          </div>
        </section>`,

      team: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Our Team</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
              ${['Alex','Jordan','Sam'].map((n,i) => `
              <div style="text-align:center;">
                <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(${135+i*45}deg,${pc},${sc});margin:0 auto 14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.6rem;font-weight:700;">${n[0]}</div>
                <h3 style="font-size:0.95rem;font-weight:600;color:${textMain};">${n}</h3>
                <p style="font-size:0.8rem;color:${textMuted};">${['Founder','Manager','Specialist'][i]}</p>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      faq: (s) => `
        <section style="padding:64px 24px;background:${cardBg};">
          <div style="max-width:700px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">FAQ</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="text-align:left;display:flex;flex-direction:column;gap:12px;">
              ${['What are your hours?','Do you offer delivery?','How do I place a custom order?'].map(q => `
              <div style="background:${bg};border-radius:10px;padding:18px 20px;border:1px solid ${borderCol};">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <h3 style="font-size:0.9rem;font-weight:600;color:${textMain};">${q}</h3>
                  <span style="color:${pc};font-size:1.2rem;font-weight:300;">+</span>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      features: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Features</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;text-align:left;">
              ${['Fast Delivery','Top Quality','24/7 Support','Best Prices'].map(f => `
              <div style="display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:10px;background:${cardBg};border:1px solid ${borderCol};">
                <div style="width:36px;height:36px;border-radius:8px;background:${pc}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icons.check}</div>
                <div>
                  <h3 style="font-size:0.9rem;font-weight:600;color:${textMain};margin-bottom:4px;">${f}</h3>
                  <p style="font-size:0.8rem;color:${textMuted};line-height:1.5;">We pride ourselves on delivering the best experience.</p>
                </div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      pricing: (s) => `
        <section style="padding:64px 24px;background:${cardBg};">
          <div style="max-width:900px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Pricing</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
              ${[{n:'Basic',p:'$29',f:['3 items','Email support']},{n:'Pro',p:'$59',f:['10 items','Priority support','Custom branding']},{n:'Enterprise',p:'$99',f:['Unlimited','24/7 support','API access','Custom integrations']}].map((plan,i) => `
              <div style="background:${i===1?`linear-gradient(135deg,${pc},${sc})`:bg};border-radius:14px;padding:28px 20px;border:1px solid ${i===1?'transparent':borderCol};color:${i===1?'#fff':textMain};${i===1?'transform:scale(1.04);box-shadow:0 8px 30px '+pc+'40;':''}">
                <h3 style="font-size:0.9rem;font-weight:600;margin-bottom:4px;">${plan.n}</h3>
                <p style="font-size:2rem;font-weight:800;margin-bottom:16px;">${plan.p}<span style="font-size:0.85rem;font-weight:400;opacity:0.7;">/mo</span></p>
                ${plan.f.map(f => `<p style="font-size:0.8rem;padding:6px 0;opacity:0.85;">✓ ${f}</p>`).join('')}
                <div style="margin-top:18px;padding:10px;border-radius:8px;background:${i===1?'rgba(255,255,255,0.2)':pc+'15'};color:${i===1?'#fff':pc};font-weight:600;font-size:0.85rem;text-align:center;">Choose Plan</div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      cta: (s) => `
        <section style="padding:56px 24px;background:linear-gradient(135deg,${pc},${sc});text-align:center;color:#fff;">
          <div style="max-width:600px;margin:0 auto;">
            <h2 style="font-size:1.8rem;font-weight:700;margin-bottom:12px;">${s.title}</h2>
            <p style="opacity:0.9;margin-bottom:24px;font-size:0.95rem;">${s.content}</p>
            <a href="#" style="display:inline-block;padding:13px 36px;background:#fff;color:${pc};border-radius:8px;font-weight:600;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,0.15);">Get Started Today</a>
          </div>
        </section>`,

      events: (s) => `
        <section style="padding:64px 24px;background:${bg};">
          <div style="max-width:800px;margin:0 auto;text-align:center;">
            <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Events</p>
            <h2 style="font-size:1.8rem;font-weight:700;color:${textMain};margin-bottom:32px;">${s.title}</h2>
            <div style="display:flex;flex-direction:column;gap:14px;text-align:left;">
              ${['Grand Opening Celebration','Monthly Tasting Event','Holiday Special'].map((e,i) => `
              <div style="display:flex;gap:16px;padding:18px;background:${cardBg};border-radius:12px;border:1px solid ${borderCol};align-items:center;">
                <div style="width:52px;text-align:center;flex-shrink:0;"><span style="font-size:1.5rem;font-weight:800;color:${pc};">${15+i*7}</span><br><span style="font-size:0.7rem;color:${textMuted};text-transform:uppercase;">Jan</span></div>
                <div><h3 style="font-size:0.9rem;font-weight:600;color:${textMain};">${e}</h3><p style="font-size:0.8rem;color:${textMuted};">Join us for a special experience</p></div>
              </div>`).join('')}
            </div>
          </div>
        </section>`,

      map: (s) => `
        <section style="padding:48px 24px;background:${cardBg};">
          <div style="max-width:800px;margin:0 auto;text-align:center;">
            <h2 style="font-size:1.5rem;font-weight:700;color:${textMain};margin-bottom:20px;">${s.title}</h2>
            <div style="height:200px;border-radius:12px;background:linear-gradient(135deg,${pc}10,${sc}15);border:1px solid ${borderCol};display:flex;align-items:center;justify-content:center;">
              <div style="text-align:center;"><div style="font-size:2rem;margin-bottom:8px;">📍</div><p style="color:${textMuted};font-size:0.85rem;">${s.content}</p></div>
            </div>
          </div>
        </section>`,

      footer: (s) => `
        <footer style="padding:40px 24px 24px;background:${isDark ? '#080808' : '#111827'};color:rgba(255,255,255,0.7);">
          <div style="max-width:800px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;">
            <div><h3 style="color:#fff;font-weight:700;font-size:1.1rem;margin-bottom:10px;">${t.name}</h3><p style="font-size:0.8rem;max-width:200px;line-height:1.5;">${s.content}</p></div>
            <div><h4 style="color:#fff;font-weight:600;font-size:0.85rem;margin-bottom:10px;">Quick Links</h4>${['Home','About','Contact'].map(l => `<p style="font-size:0.8rem;margin-bottom:6px;">${l}</p>`).join('')}</div>
            <div><h4 style="color:#fff;font-weight:600;font-size:0.85rem;margin-bottom:10px;">Contact</h4><p style="font-size:0.8rem;margin-bottom:4px;">hello@example.com</p><p style="font-size:0.8rem;">+1 (555) 000-0000</p></div>
          </div>
          <div style="max-width:800px;margin:20px auto 0;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;font-size:0.75rem;">© ${new Date().getFullYear()} ${t.name}. All rights reserved.</div>
        </footer>`,
    };

    const fallback = (s: typeof t.sections[0]) => `
      <section style="padding:56px 24px;background:${bg};">
        <div style="max-width:800px;margin:0 auto;">
          <p style="color:${pc};font-weight:600;font-size:0.85rem;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">${s.type}</p>
          <h2 style="font-size:1.5rem;font-weight:700;color:${textMain};margin-bottom:12px;">${s.title}</h2>
          <p style="color:${textMuted};line-height:1.7;">${s.content}</p>
        </div>
      </section>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(ff)}:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: '${ff}', system-ui, -apple-system, sans-serif; color: ${textMain}; background: ${bg}; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; }
img { max-width: 100%; }
</style>
</head>
<body>
${t.sections.filter(s => s.visible !== false).map(s => (sectionRenderers[s.type] || fallback)(s)).join('\n')}
</body>
</html>`;
  }, [selectedTemplate]);

  // Fix 6: Similar templates recommendation
  const similarTemplates = useMemo(() => {
    if (!selectedTemplate || templates.length === 0) return [];
    return templates
      .filter(
        (t) =>
          t.id !== selectedTemplate.id &&
          (t.category === selectedTemplate.category ||
            t.style.mood === selectedTemplate.style.mood ||
            t.sections.some((s) => selectedTemplate.sections.some((ss) => ss.type === s.type)))
      )
      .slice(0, 4);
  }, [selectedTemplate, templates]);

  const handleUseTemplate = useCallback((template: Template) => {
    setSelectedTemplate(null);
    // Store the selected template so the builder can use its data
    setStoreTemplate(template);
    setCurrentView('builder');
  }, [setStoreTemplate, setCurrentView]);

  return (
    <div className="space-y-6">
      {/* Template Count */}
      {!loading && templates.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{Math.min(visibleCount, filteredTemplates.length)}</span> of{' '}
          <span className="font-medium text-foreground">{filteredTemplates.length}</span> templates
          {hasActiveFilters && <span className="ml-1">(filtered from {templates.length} total)</span>}
        </div>
      )}

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
              <SelectItem value="sections">Most Sections</SelectItem>
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

        {/* Fix 4: Mood Filter Chips */}
        {!loading && uniqueMoods.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="size-3" />
              Mood
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveMood('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  activeMood === 'all'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                All
              </button>
              {uniqueMoods.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(mood)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    activeMood === mood
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fix 4: Section Type Filter Chips */}
        {!loading && uniqueSectionTypes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers className="size-3" />
              Section Type
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSectionType('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                  activeSectionType === 'all'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                All
              </button>
              {uniqueSectionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveSectionType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize',
                    activeSectionType === type
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/25'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                  )}
                >
                  {sectionLabels[type] || type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fix 4: Reset Filters Button */}
        {hasActiveFilters && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5 mr-1.5" />
              Reset Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Featured Templates / Skeleton */}
      {loading ? (
        <FeaturedSkeleton />
      ) : featuredTemplates.length > 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="size-4 text-violet-400" />
          <h3 className="text-sm font-semibold">Featured Templates</h3>
          <Badge className="bg-violet-600/20 text-violet-400 border-violet-500/30 text-[10px]">
            {featuredTemplates.length} picks
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {featuredTemplates.map((ft) => (
            <div
              key={ft.id}
              className="relative overflow-hidden rounded-xl border border-border/50 hover:border-violet-500/30 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedTemplate(ft)}
            >
              <div className="h-28 sm:h-32 overflow-hidden">
                <Image
                  src={ft.preview}
                  alt={`${ft.name} template preview`}
                  width={300}
                  height={160}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Badge className="absolute top-2 left-2 bg-violet-600/90 text-white border-0 text-[10px]">
                  <Star className="size-2.5 mr-0.5" />
                  Featured
                </Badge>
              </div>
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{ft.name}</h4>
                <p className="text-muted-foreground text-[11px] mt-0.5 line-clamp-1">{ft.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {ft.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{ft.sections.length} sections</span>
                </div>
              </div>
            </div>
          ))}
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
          {filteredTemplates.slice(0, visibleCount).map((template) => (
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
                    {/* Fix 2: Show section count badge instead of download count */}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Layers className="size-3" />
                      {template.sections.length} sections
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

      {/* Load More Button */}
      {!loading && filteredTemplates.length > visibleCount && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <span className="text-xs text-muted-foreground">
            {filteredTemplates.length - visibleCount} more templates available
          </span>
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            className="min-w-[200px]"
          >
            Load More Templates
          </Button>
        </div>
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
            <Tabs defaultValue="preview" className="w-full">
              {/* Fix 5: Tab Switcher */}
              <TabsList className="mb-4">
                <TabsTrigger value="overview">
                  <ScrollText className="size-4 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Monitor className="size-4 mr-1.5" />
                  Live Preview
                </TabsTrigger>
              </TabsList>

              {/* Fix 5: Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Large Preview */}
                <div className="h-56 sm:h-72 rounded-xl relative overflow-hidden -mx-6 -mt-2 mb-4">
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

                {/* Fix 2: Stats - show section count only */}
                <div className="flex items-center gap-4 py-3">
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

                {/* Fix 6: Similar Templates */}
                {similarTemplates.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-400" />
                      Similar Templates
                    </h4>
                    <div className="flex overflow-x-auto gap-3 pb-2">
                      {similarTemplates.map((sim) => (
                        <button
                          key={sim.id}
                          onClick={() => setSelectedTemplate(sim)}
                          className="flex-shrink-0 flex flex-col gap-2 p-2 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors w-36"
                        >
                          <div className="w-full h-9 rounded overflow-hidden">
                            <Image
                              src={sim.preview}
                              alt={sim.name}
                              width={144}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs font-medium truncate">{sim.name}</p>
                          <Badge variant="secondary" className="text-[10px] w-fit capitalize">
                            {sim.category}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Fix 5: Live Preview Tab */}
              <TabsContent value="preview">
                <div className="rounded-lg overflow-hidden border border-border/50">
                  <iframe
                    srcDoc={previewHtml}
                    sandbox="allow-scripts"
                    title={`${selectedTemplate.name} live preview`}
                    className="w-full h-[600px] border-0 bg-white"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* CTA Buttons (outside tabs so they persist) */}
          {selectedTemplate && (
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
