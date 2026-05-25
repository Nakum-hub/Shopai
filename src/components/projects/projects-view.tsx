'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Eye,
  Pencil,
  Rocket,
  Trash2,
  Globe,
  Clock,
  BarChart3,
  Layers,
  Sparkles,
  ExternalLink,
  Monitor,
  ArrowRight,
  Store,
  Briefcase,
  Shirt,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileEdit,
  MoreHorizontal,
  ChevronRight,
  Activity,
  TrendingUp,
  Users,
  Search,
  Copy,
  Download,
  Share2,
  Phone,
  Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { Storefront, StorefrontStatus, BusinessCategory, BusinessProfile } from '@/lib/types';

// =============================================================================
// Mock Storefront Data (used as fallback / example data)
// =============================================================================

const MOCK_STOREFRONTS: Storefront[] = [
  {
    id: 'sf-1',
    name: 'Sweet Dreams Bakery',
    businessName: 'Sweet Dreams Bakery',
    category: 'bakery',
    status: 'published',
    description: 'Artisan bakery with custom cakes, pastries, and breads made from scratch daily.',
    url: 'https://sweetdreams.storecraft.ai',
    sections: [
      { id: 's1', type: 'hero', title: 'Hero Banner', content: '', order: 0, visible: true, config: {} },
      { id: 's2', type: 'about', title: 'About Us', content: '', order: 1, visible: true, config: {} },
      { id: 's3', type: 'products', title: 'Products', content: '', order: 2, visible: true, config: {} },
      { id: 's4', type: 'testimonials', title: 'Testimonials', content: '', order: 3, visible: true, config: {} },
      { id: 's5', type: 'contact', title: 'Contact', content: '', order: 4, visible: true, config: {} },
      { id: 's6', type: 'footer', title: 'Footer', content: '', order: 5, visible: true, config: {} },
    ],
    html: '',
    businessProfile: {
      name: 'Sweet Dreams Bakery',
      category: 'bakery',
      description: 'Artisan bakery with custom cakes, pastries, and breads.',
      location: '123 Baker Street, Sweetville, CA 90210',
      phone: '(555) 123-4567',
      email: 'hello@sweetdreamsbakery.com',
      hours: 'Mon-Fri 7AM-7PM, Sat 8AM-6PM, Sun 9AM-4PM',
      products: [],
      services: [],
      style: { primaryColor: '#8B4513', secondaryColor: '#D2691E', fontFamily: 'Playfair Display', theme: 'elegant', mood: 'warm' },
      features: ['Online Ordering', 'Custom Cakes', 'Delivery'],
    },
    createdAt: '2024-11-15T10:30:00Z',
    updatedAt: '2024-12-20T14:22:00Z',
    publishedAt: '2024-12-01T09:00:00Z',
    viewCount: 847,
    deploymentStatus: 'deployed',
    deploymentUrl: 'https://sweetdreams.storecraft.ai',
  },
  {
    id: 'sf-2',
    name: 'TechZone Electronics',
    businessName: 'TechZone Electronics',
    category: 'electronics',
    status: 'ready',
    description: 'Premium electronics store featuring the latest gadgets, computers, and smart home devices.',
    url: '',
    sections: [
      { id: 't1', type: 'hero', title: 'Hero Banner', content: '', order: 0, visible: true, config: {} },
      { id: 't2', type: 'products', title: 'Products', content: '', order: 1, visible: true, config: {} },
      { id: 't3', type: 'about', title: 'About Us', content: '', order: 2, visible: true, config: {} },
      { id: 't4', type: 'services', title: 'Services', content: '', order: 3, visible: true, config: {} },
      { id: 't5', type: 'contact', title: 'Contact', content: '', order: 4, visible: true, config: {} },
    ],
    html: '',
    businessProfile: {
      name: 'TechZone Electronics',
      category: 'electronics',
      description: 'Premium electronics store featuring the latest gadgets and smart home devices.',
      location: '456 Tech Boulevard, Silicon City, CA 94025',
      phone: '(555) 987-6543',
      email: 'info@techzone.com',
      hours: 'Mon-Sat 9AM-8PM, Sun 10AM-6PM',
      products: [],
      services: [],
      style: { primaryColor: '#0f172a', secondaryColor: '#06b6d4', fontFamily: 'Inter', theme: 'modern', mood: 'tech' },
      features: ['Product Catalog', 'Repair Service', 'Financing'],
    },
    createdAt: '2024-12-05T16:45:00Z',
    updatedAt: '2024-12-18T11:30:00Z',
    publishedAt: null,
    viewCount: 312,
    deploymentStatus: 'none',
    deploymentUrl: null,
  },
  {
    id: 'sf-3',
    name: 'Style Hub Clothing',
    businessName: 'Style Hub Clothing',
    category: 'clothing',
    status: 'generating',
    description: 'Trendy fashion boutique offering curated collections of clothing and accessories.',
    url: '',
    sections: [
      { id: 'c1', type: 'hero', title: 'Hero Banner', content: '', order: 0, visible: true, config: {} },
      { id: 'c2', type: 'products', title: 'Collections', content: '', order: 1, visible: true, config: {} },
    ],
    html: '',
    businessProfile: {
      name: 'Style Hub Clothing',
      category: 'clothing',
      description: 'Trendy fashion boutique with curated clothing and accessories.',
      location: '789 Fashion Ave, Style City, NY 10001',
      phone: '(555) 456-7890',
      email: 'hello@stylehub.com',
      hours: 'Mon-Sat 10AM-9PM, Sun 11AM-7PM',
      products: [],
      services: [],
      style: { primaryColor: '#be185d', secondaryColor: '#f59e0b', fontFamily: 'Montserrat', theme: 'bold', mood: 'trendy' },
      features: ['Lookbook', 'Size Guide', 'Gift Cards'],
    },
    createdAt: '2024-12-19T08:15:00Z',
    updatedAt: '2024-12-19T08:15:00Z',
    publishedAt: null,
    viewCount: 88,
    deploymentStatus: 'none',
    deploymentUrl: null,
  },
];

// =============================================================================
// Helpers
// =============================================================================

const categoryIcons: Record<BusinessCategory, React.ElementType> = {
  bakery: Store,
  restaurant: Briefcase,
  clothing: Shirt,
  electronics: Cpu,
  salon: Sparkles,
  grocery: Store,
  hardware: Cpu,
  medical: Activity,
  boutique: Shirt,
  service: Briefcase,
  other: Globe,
};

const categoryGradients: Record<BusinessCategory, string> = {
  bakery: 'from-amber-500 to-orange-600',
  restaurant: 'from-red-500 to-rose-600',
  clothing: 'from-pink-500 to-fuchsia-600',
  electronics: 'from-cyan-500 to-teal-600',
  salon: 'from-violet-500 to-purple-600',
  grocery: 'from-emerald-500 to-green-600',
  hardware: 'from-slate-500 to-zinc-600',
  medical: 'from-sky-500 to-blue-600',
  boutique: 'from-rose-500 to-pink-600',
  service: 'from-indigo-500 to-violet-600',
  other: 'from-gray-500 to-slate-600',
};

const statusConfig: Record<StorefrontStatus, { label: string; color: string; icon: React.ElementType; pulse?: boolean }> = {
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: FileEdit },
  generating: { label: 'Generating', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Loader2, pulse: true },
  ready: { label: 'Ready', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: CheckCircle2 },
  published: { label: 'Published', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  error: { label: 'Error', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: AlertCircle },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getPreviewGradient(category: BusinessCategory): string {
  return categoryGradients[category] || 'from-gray-500 to-slate-600';
}

/**
 * Map a raw storefront record from the API to the frontend Storefront type.
 * Handles JSON parsing for businessProfile, default values for missing fields,
 * and date conversion.
 */
function mapApiStorefront(raw: Record<string, unknown>): Storefront {
  let businessProfile: BusinessProfile | null = null;
  if (raw.businessProfile && typeof raw.businessProfile === 'string') {
    try {
      businessProfile = JSON.parse(raw.businessProfile) as BusinessProfile;
    } catch {
      businessProfile = null;
    }
  } else if (raw.businessProfile && typeof raw.businessProfile === 'object') {
    businessProfile = raw.businessProfile as BusinessProfile;
  }

  const createdAt = raw.createdAt
    ? new Date(raw.createdAt as string).toISOString()
    : new Date().toISOString();
  const updatedAt = raw.updatedAt
    ? new Date(raw.updatedAt as string).toISOString()
    : new Date().toISOString();
  const publishedAt = raw.publishedAt
    ? new Date(raw.publishedAt as string).toISOString()
    : null;

  return {
    id: raw.id as string,
    name: (raw.name as string) || 'Untitled',
    businessName: (raw.businessName as string) || 'Untitled Business',
    category: (raw.category as BusinessCategory) || 'other',
    status: (raw.status as StorefrontStatus) || 'draft',
    description: (raw.description as string) || '',
    url: (raw.url as string) || '',
    sections: [], // API doesn't store sections separately
    html: (raw.html as string) || '',
    businessProfile,
    createdAt,
    updatedAt,
    publishedAt,
    viewCount: (raw.viewCount as number) || 0,
    deploymentStatus: (raw.deploymentStatus as Storefront['deploymentStatus']) || 'none',
    deploymentUrl: (raw.deploymentUrl as string) || null,
  };
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="py-4">
            <CardContent className="flex items-center gap-3 px-4 py-0">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="min-w-0 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Card skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-40 w-full" />
            <CardContent className="p-4 pt-3 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              <Separator />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Stats Cards
// =============================================================================

function StatsCards({ storefronts }: { storefronts: Storefront[] }) {
  const stats = [
    {
      label: 'Total Storefronts',
      value: storefronts.length,
      icon: Layers,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Published',
      value: storefronts.filter((s) => s.status === 'published').length,
      icon: Globe,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Draft',
      value: storefronts.filter((s) => s.status === 'ready' || s.status === 'draft').length,
      icon: FileEdit,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Total Views',
      value: storefronts.reduce((sum, s) => sum + s.viewCount, 0).toLocaleString(),
      icon: BarChart3,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="py-4">
              <CardContent className="flex items-center gap-3 px-4 py-0">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', stat.bg)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Storefront Card
// =============================================================================

function StorefrontCard({
  storefront,
  onPreview,
  onEdit,
  onDeploy,
  onShare,
  onDownload,
  onDelete,
  onClick,
}: {
  storefront: Storefront;
  onPreview: () => void;
  onEdit: () => void;
  onDeploy: () => void;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClick: () => void;
}) {
  const statusCfg = statusConfig[storefront.status];
  const StatusIcon = statusCfg.icon;
  const CategoryIcon = categoryIcons[storefront.category];
  const gradient = getPreviewGradient(storefront.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden group cursor-pointer hover:border-border/80 transition-colors" onClick={onClick}>
        {/* Preview Thumbnail */}
        <div className={cn(
          'relative h-40 bg-gradient-to-br',
          gradient,
          'overflow-hidden'
        )}>
          {/* Mock browser chrome */}
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-5 rounded bg-white/15 max-w-[200px]" />
            </div>
          </div>
          {/* Mock content lines */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-6">
            <div className="w-48 h-4 rounded bg-white/20 mb-2" />
            <div className="w-32 h-3 rounded bg-white/15" />
          </div>
          {/* Category Badge */}
          <div className="absolute top-12 right-3">
            <Badge className="bg-black/30 backdrop-blur-sm text-white border-0 text-[10px] gap-1">
              <CategoryIcon className="h-3 w-3" />
              {storefront.category}
            </Badge>
          </div>
          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className={cn('text-[10px] gap-1', statusCfg.color)}>
              <StatusIcon className={cn('h-3 w-3', statusCfg.pulse && 'animate-spin')} />
              {statusCfg.label}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 pt-3 gap-3">
          {/* Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{storefront.businessName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{storefront.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeploy(); }}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(); }}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDownload(); }}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(storefront.updatedAt)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {storefront.viewCount.toLocaleString()} views
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// Detail Dialog
// =============================================================================

interface DetailAnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
}

function DetailDialog({
  storefront,
  open,
  onOpenChange,
}: {
  storefront: Storefront | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setCurrentView, setCurrentStorefront } = useAppStore();

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<DetailAnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(false);

  // Fetch analytics when dialog opens with a storefront
  useEffect(() => {
    if (!storefront || !open) {
      setAnalyticsData(null);
      setAnalyticsError(false);
      return;
    }

    let cancelled = false;
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      setAnalyticsError(false);
      try {
        const res = await fetch(
          `/api/analytics?storefrontId=${encodeURIComponent(storefront.id)}&days=30`
        );
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        if (!cancelled && data.analytics) {
          setAnalyticsData(data.analytics);
        }
      } catch {
        if (!cancelled) {
          setAnalyticsError(true);
          setAnalyticsData(null);
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      }
    };
    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [storefront?.id, open]);

  if (!storefront) return null;

  const statusCfg = statusConfig[storefront.status];
  const StatusIcon = statusCfg.icon;
  const CategoryIcon = categoryIcons[storefront.category];
  const bp = storefront.businessProfile;

  const handlePreview = () => {
    setCurrentStorefront(storefront);
    setCurrentView('preview');
    onOpenChange(false);
  };

  const handleEdit = () => {
    setCurrentStorefront(storefront);
    setCurrentView('builder');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header with gradient */}
        <div className={cn(
          'relative bg-gradient-to-br px-6 pt-6 pb-4',
          getPreviewGradient(storefront.category)
        )}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-black/30 backdrop-blur-sm text-white border-0 text-xs gap-1">
                <CategoryIcon className="h-3 w-3" />
                {storefront.category}
              </Badge>
              <Badge variant="outline" className="bg-black/20 backdrop-blur-sm text-white border-0 text-xs gap-1">
                <StatusIcon className={cn('h-3 w-3', statusCfg.pulse && 'animate-spin')} />
                {statusCfg.label}
              </Badge>
            </div>
            <DialogTitle className="text-xl text-white">{storefront.businessName}</DialogTitle>
            <DialogDescription className="text-white/70">{storefront.description}</DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Business Profile Summary */}
            {bp && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Business Profile
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoItem icon={Globe} label="Location" value={bp.location} />
                  <InfoItem icon={Phone} label="Phone" value={bp.phone} />
                  <InfoItem icon={Mail} label="Email" value={bp.email} />
                  <InfoItem icon={Clock} label="Hours" value={bp.hours} />
                </div>
                {bp.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {bp.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Sections List */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Sections ({storefront.sections.length})
              </h4>
              {storefront.sections.length > 0 ? (
                <div className="space-y-1.5">
                  {storefront.sections.map((section, i) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-sm"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground font-medium">
                        {i + 1}
                      </span>
                      <span className="flex-1">{section.title}</span>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {section.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sections configured yet. Edit this storefront to add sections.</p>
              )}
            </div>

            <Separator />

            {/* Deployment Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Rocket className="h-4 w-4 text-emerald-400" />
                Deployment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoItem
                  icon={Globe}
                  label="Status"
                  value={storefront.deploymentStatus === 'deployed' ? 'Deployed' : 'Not deployed'}
                />
                <InfoItem
                  icon={ExternalLink}
                  label="URL"
                  value={storefront.deploymentUrl || 'No URL yet'}
                />
                <InfoItem icon={Clock} label="Created" value={formatDate(storefront.createdAt)} />
                <InfoItem icon={Clock} label="Updated" value={formatDate(storefront.updatedAt)} />
              </div>
            </div>

            <Separator />

            {/* Analytics Summary */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                Analytics Summary
              </h4>
              {analyticsLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-card/50 p-3 text-center space-y-2">
                      <Skeleton className="h-6 w-16 mx-auto" />
                      <Skeleton className="h-3 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              ) : analyticsError || !analyticsData ? (
                <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">No analytics data yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                    <p className="text-lg font-bold">{analyticsData.totalViews.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Views</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                    <p className="text-lg font-bold">{analyticsData.uniqueVisitors.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Visitors</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/50 p-3 text-center">
                    <p className="text-lg font-bold">{analyticsData.avgSessionDuration}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Duration</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-card/50 gap-2 sm:gap-2">
          <Button variant="outline" className="gap-2" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4" />
            Preview Storefront
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Info Item
// =============================================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card/50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Projects View
// =============================================================================

export function ProjectsView() {
  const { setCurrentView, setCurrentStorefront } = useAppStore();
  const { toast } = useToast();

  // Data state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingMockOnly, setShowingMockOnly] = useState(false);

  // UI state
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // IDs of mock storefronts (cannot be deleted via API)
  const mockIds = new Set(MOCK_STOREFRONTS.map((s) => s.id));

  // Fetch real storefronts from the API (stable callback for reuse)
  const fetchStorefronts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/storefronts', signal ? { signal } : undefined);
      if (!res.ok) {
        throw new Error(`Failed to fetch storefronts (status ${res.status})`);
      }
      const data = await res.json();
      const rawStorefronts: Storefront[] = (data.storefronts || []).map(mapApiStorefront);

      // If API returns real data, show ONLY real data (no mock)
      if (rawStorefronts.length > 0) {
        setStorefronts(rawStorefronts);
        setShowingMockOnly(false);
      } else {
        // No real data yet — show mock data as examples
        setStorefronts([...MOCK_STOREFRONTS]);
        setShowingMockOnly(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[PROJECTS_VIEW] Failed to fetch storefronts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load storefronts');
      // Fallback to mock data on error
      setStorefronts([...MOCK_STOREFRONTS]);
      setShowingMockOnly(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount with AbortController
  useEffect(() => {
    const controller = new AbortController();
    fetchStorefronts(controller.signal);
    return () => controller.abort();
  }, [fetchStorefronts]);

  // Combined list is already stored in `storefronts` (real + mock)
  const allStorefronts = storefronts;

  // Filter against the combined list
  const filteredStorefronts = allStorefronts.filter(
    (s) =>
      s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePreview = (storefront: Storefront) => {
    setCurrentStorefront(storefront);
    setCurrentView('preview');
  };

  const handleEdit = (storefront: Storefront) => {
    setCurrentStorefront(storefront);
    setCurrentView('builder');
  };

  const handleDeploy = (storefront: Storefront) => {
    // If already deployed, copy embed code
    if (storefront.deploymentStatus === 'deployed' && storefront.deploymentUrl) {
      const embedCode = `<!-- ${storefront.businessName} -->\n<iframe src="${storefront.deploymentUrl}" width="100%" height="600" frameborder="0" title="${storefront.businessName}"></iframe>`;
      navigator.clipboard.writeText(embedCode).then(() => {
        toast({ title: 'Embed Code Copied!', description: 'Paste this iframe code into any website.' });
      }).catch(() => {
        toast({ title: 'Copy Failed', description: 'Could not copy embed code.', variant: 'destructive' });
      });
      return;
    }
    // Otherwise navigate to preview where the Deploy button lives
    setCurrentStorefront(storefront);
    setCurrentView('preview');
  };

  const handleShare = (storefront: Storefront) => {
    const businessName = storefront.businessName || 'My StoreCraft Website';
    const shareText = `Check out ${businessName}, built with StoreCraft AI!`;
    const url = storefront.deploymentUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const snippet = `${businessName}\n${shareText}\n${url}`;
    navigator.clipboard.writeText(snippet).then(() => {
      toast({ title: 'Copied to clipboard!', description: 'Share link copied.' });
    }).catch(() => {
      toast({ title: 'Share Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    });
  };

  const handleDownload = (storefront: Storefront) => {
    if (!storefront.html) {
      toast({ title: 'Nothing to download', description: 'This storefront has no generated HTML yet.', variant: 'destructive' });
      return;
    }
    let downloadHtml = storefront.html;
    if (!downloadHtml.trim().toLowerCase().startsWith('<!doctype')) {
      downloadHtml = `<!DOCTYPE html>\n${downloadHtml}`;
    }
    const businessName = storefront.businessName || 'storecraft-website';
    const blob = new Blob([downloadHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${businessName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast({ title: 'Download Started', description: `${businessName}.html is being downloaded.` });
  };

  const handleDelete = async (storefront: Storefront) => {
    // Mock storefronts cannot be deleted via API
    if (mockIds.has(storefront.id)) {
      toast({
        title: 'Cannot delete',
        description: 'This is an example storefront and cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    setDeletingId(storefront.id);
    try {
      const res = await fetch(`/api/storefronts?id=${encodeURIComponent(storefront.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed (status ${res.status})`);
      }

      // Remove from local state
      setStorefronts((prev) => prev.filter((s) => s.id !== storefront.id));
      toast({
        title: 'Storefront deleted',
        description: `"${storefront.businessName}" has been deleted successfully.`,
      });
    } catch (err) {
      console.error('[PROJECTS_VIEW] Delete failed:', err);
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete storefront. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCardClick = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
    setDetailOpen(true);
  };

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="space-y-6">
          {/* Header Actions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
          >
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search storefronts..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90 gap-2 w-full sm:w-auto"
              onClick={() => setCurrentView('builder')}
            >
              <Plus className="h-4 w-4" />
              Create New Storefront
            </Button>
          </motion.div>
          <LoadingSkeleton />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between"
        >
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search storefronts..."
              className="pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90 gap-2 w-full sm:w-auto"
            onClick={() => setCurrentView('builder')}
          >
            <Plus className="h-4 w-4" />
            Create New Storefront
          </Button>
        </motion.div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">Failed to load storefronts from server. Showing example data below.</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => fetchStorefronts()}
            >
              Retry
            </Button>
          </motion.div>
        )}

        {/* Example Storefronts Info Banner */}
        {showingMockOnly && !error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-sm text-violet-400"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="flex-1">Example storefronts — Generate your first website with AI!</span>
          </motion.div>
        )}

        {/* Stats */}
        <StatsCards storefronts={allStorefronts} />

        {/* Storefront Grid */}
        {filteredStorefronts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStorefronts.map((storefront, i) => (
              <StorefrontCard
                key={storefront.id}
                storefront={storefront}
                onPreview={() => handlePreview(storefront)}
                onEdit={() => handleEdit(storefront)}
                onDeploy={() => handleDeploy(storefront)}
                onShare={() => handleShare(storefront)}
                onDownload={() => handleDownload(storefront)}
                onDelete={() => handleDelete(storefront)}
                onClick={() => handleCardClick(storefront)}
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No storefronts found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'Get started by creating your first storefront'}
            </p>
          </motion.div>
        )}

        {/* Detail Dialog */}
        <DetailDialog
          storefront={selectedStorefront}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </TooltipProvider>
  );
}
