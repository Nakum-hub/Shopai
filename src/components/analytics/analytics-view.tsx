'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Eye,
  Users,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Monitor,
  Smartphone,
  Tablet,
  Search,
  Zap,
  Gauge,
  Accessibility,
  TrendingUp,
  Globe,
  AlertCircle,
  Loader2,
  Heart,
  PenTool,
  FileText,
  Lightbulb,
  Target,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// =============================================================================
// Types
// =============================================================================

interface AnalyticsApiResponse {
  totalViews: number;
  uniqueVisitors: number;
  viewsChange: string;
  visitorsChange: string;
  avgSessionDuration: string;
  bounceRate: string;
  bounceRateChange: string;
  topPages: { page: string; views: number; percentage: number }[];
  dailyViews: { date: string; views: number; visitors: number }[];
  deviceBreakdown: { device: string; percentage: number; sessions: number }[];
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  generationMetrics?: {
    totalExecutions: number;
    successRate: string;
    avgValidationScore: number;
    avgGenTimeSeconds: string;
  };
}

interface HealthScore {
  overall: number;
  content: number;
  seo: number;
  performance: number;
  accessibility: number;
  engagement: number;
  generation: number;
}

interface Insight {
  type: 'strength' | 'warning' | 'opportunity' | 'critical';
  category: string;
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
}

interface BIHealthResponse {
  healthScore: HealthScore;
  generatedAt: string;
}

interface BIInsightsResponse {
  insights: Insight[];
  recommendations: string[];
  summary: string;
  generatedAt: string;
}

// =============================================================================
// Constants
// =============================================================================

const deviceMeta: Record<string, { icon: React.ElementType; color: string }> = {
  Mobile: { icon: Smartphone, color: '#8b5cf6' },
  Desktop: { icon: Monitor, color: '#06b6d4' },
  Tablet: { icon: Tablet, color: '#a78bfa' },
};

const viewsChartConfig: ChartConfig = {
  views: { label: 'Page Views', color: '#8b5cf6' },
  visitors: { label: 'Unique Visitors', color: '#06b6d4' },
};

const HEALTH_DIMENSIONS: Array<{
  key: keyof Omit<HealthScore, 'overall'>;
  label: string;
  icon: React.ElementType;
  color: string;
}> = [
  { key: 'content', label: 'Content', icon: FileText, color: '#8b5cf6' },
  { key: 'seo', label: 'SEO', icon: Search, color: '#06b6d4' },
  { key: 'performance', label: 'Performance', icon: Gauge, color: '#f59e0b' },
  { key: 'accessibility', label: 'Accessibility', icon: Accessibility, color: '#22c55e' },
  { key: 'engagement', label: 'Engagement', icon: TrendingUp, color: '#ec4899' },
  { key: 'generation', label: 'Generation', icon: Sparkles, color: '#f97316' },
];

const INSIGHT_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; badgeClass: string; sortOrder: number }> = {
  critical: { icon: XCircle, label: 'Critical', badgeClass: 'bg-red-500/15 text-red-400 border-red-500/25', sortOrder: 0 },
  warning: { icon: AlertTriangle, label: 'Warning', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/25', sortOrder: 1 },
  opportunity: { icon: Lightbulb, label: 'Opportunity', badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/25', sortOrder: 2 },
  strength: { icon: CheckCircle2, label: 'Strength', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', sortOrder: 3 },
};

const IMPACT_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-500/10 text-red-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-400' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

// =============================================================================
// Animation
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// =============================================================================
// Helpers
// =============================================================================

function healthColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function healthTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

// =============================================================================
// Sub-components
// =============================================================================

function ChangeBadge({ value, invertColor = false }: { value: string | number; invertColor?: boolean }) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isPositive = invertColor ? numValue <= 0 : numValue >= 0;
  const displayValue = numValue >= 0 ? `+${numValue.toFixed(1)}%` : `${numValue.toFixed(1)}%`;

  return (
    <Badge className={cn(
      'text-xs',
      isPositive
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    )}>
      {isPositive ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
      {displayValue}
    </Badge>
  );
}

function CircularScore({
  score,
  label,
  icon: Icon,
  color,
  size = 'md',
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const radius = size === 'lg' ? 52 : size === 'md' ? 40 : 28;
  const svgSize = size === 'lg' ? 36 : size === 'md' ? 28 : 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize * 2, height: svgSize * 2 }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={size === 'lg' ? '7' : '6'}
            className="text-muted/50"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={size === 'lg' ? '7' : '6'}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color }}>
          <Icon className={cn('mb-0.5', size === 'lg' ? 'size-5' : size === 'md' ? 'size-4' : 'size-3')} />
          <span className={cn('font-bold', size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-base')}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function MiniProgressScore({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn('text-sm font-bold tabular-nums', healthTextColor(score))}>{score}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Health score skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border/50 h-full">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="size-36 bg-muted/50 rounded-full animate-pulse" />
            <Skeleton className="h-4 w-32 rounded mt-4" />
          </CardContent>
        </Card>
        <Card className="border-border/50 lg:col-span-2 h-full">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-8 rounded" />
                  </div>
                  <Skeleton className="h-2 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* KPI skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Chart skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="h-5 w-36 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-72 bg-muted/50 rounded animate-pulse" />
        </CardContent>
      </Card>
      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 h-full">
          <CardHeader className="pb-2">
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
                <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/50 h-full">
          <CardHeader className="pb-2">
            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="size-44 bg-muted/50 rounded-full animate-pulse shrink-0" />
              <div className="flex-1 w-full space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Insights skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div className="size-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center mx-auto">
          <BarChart3 className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">No Storefront Selected</h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Select a storefront from your projects to view its analytics, health scores, business intelligence, and visitor insights.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// AnalyticsView
// =============================================================================

export function AnalyticsView() {
  const { currentStorefront } = useAppStore();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsApiResponse | null>(null);
  const [healthData, setHealthData] = useState<BIHealthResponse | null>(null);
  const [insightsData, setInsightsData] = useState<BIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const storefrontId = currentStorefront?.id;
  const days = dateRange === '7' ? 7 : dateRange === '30' ? 30 : 90;

  // Fetch all data in parallel (stable callback for reuse in retry buttons)
  const fetchAllData = useCallback(async (signal?: AbortSignal) => {
    if (!storefrontId) return;
    setLoading(true);
    setFetchError(null);
    try {
      const [analyticsRes, healthRes, insightsRes] = await Promise.all([
        fetch(`/api/analytics?storefrontId=${encodeURIComponent(storefrontId)}&days=${days}`, signal ? { signal } : undefined),
        fetch(`/api/bi?storefrontId=${encodeURIComponent(storefrontId)}&mode=health`, signal ? { signal } : undefined),
        fetch(`/api/bi?storefrontId=${encodeURIComponent(storefrontId)}&mode=insights`, signal ? { signal } : undefined),
      ]);

      if (!analyticsRes.ok) throw new Error(`Analytics failed (status ${analyticsRes.status})`);
      if (!healthRes.ok) throw new Error(`Health score failed (status ${healthRes.status})`);
      if (!insightsRes.ok) throw new Error(`Insights failed (status ${insightsRes.status})`);

      const analyticsJson = await analyticsRes.json();
      const healthJson: BIHealthResponse = await healthRes.json();
      const insightsJson: BIInsightsResponse = await insightsRes.json();

      if (analyticsJson.analytics) {
        setAnalytics(analyticsJson.analytics);
      }
      setHealthData(healthJson);
      setInsightsData(insightsJson);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[ANALYTICS_VIEW] Failed to fetch data:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to load analytics data');
      toast({
        title: 'Failed to load data',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storefrontId, days, toast]);

  // Fetch on mount with AbortController
  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, [fetchAllData]);

  // Derived data
  const dailyData = analytics?.dailyViews ?? [];
  const totalViews = analytics?.totalViews ?? 0;
  const uniqueVisitors = analytics?.uniqueVisitors ?? 0;
  const avgSessionDuration = analytics?.avgSessionDuration ?? '--';
  const bounceRate = analytics?.bounceRate ? parseFloat(analytics.bounceRate) : 0;
  const viewsChange = analytics?.viewsChange ? parseFloat(analytics.viewsChange) : 0;
  const visitorsChange = analytics?.visitorsChange ? parseFloat(analytics.visitorsChange) : 0;
  const bounceRateChange = analytics?.bounceRateChange ? parseFloat(analytics.bounceRateChange) : 0;
  const topPages = analytics?.topPages ?? [];
  const deviceBreakdown = (analytics?.deviceBreakdown ?? []).map((d) => ({
    ...d,
    icon: deviceMeta[d.device]?.icon || Monitor,
    color: deviceMeta[d.device]?.color || '#6b7280',
  }));
  const totalSessions = deviceBreakdown.reduce((sum, d) => sum + d.sessions, 0);
  const seoScore = analytics?.seoScore ?? 0;
  const performanceScore = analytics?.performanceScore ?? 0;
  const accessibilityScore = analytics?.accessibilityScore ?? 0;
  const healthScore = healthData?.healthScore ?? null;
  const insights = insightsData?.insights ?? [];
  const recommendations = insightsData?.recommendations ?? [];
  const biSummary = insightsData?.summary ?? '';

  // Empty state when no storefront
  if (!currentStorefront) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Health, insights, and performance for{' '}
            <span className="text-foreground font-medium">{currentStorefront.businessName}</span>
          </p>
        </div>

        {/* Date Range Selector */}
        <Tabs value={dateRange} onValueChange={setDateRange}>
          <TabsList>
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Error Banner */}
      {fetchError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{fetchError}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => fetchAllData()}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <AnalyticsLoadingSkeleton />}

      {/* Content */}
      {!loading && analytics && (
        <>
          {/* ================================================================ */}
          {/* Section 1: Health Score Dashboard                                 */}
          {/* ================================================================ */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {/* Overall Health Score */}
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  {healthScore ? (
                    <>
                      <CircularScore
                        score={healthScore.overall}
                        label=""
                        icon={Heart}
                        color={healthColor(healthScore.overall)}
                        size="lg"
                      />
                      <p className="text-sm font-semibold mt-2">
                        Overall Health
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 text-center max-w-[200px]">
                        {healthScore.overall >= 80
                          ? 'Your storefront is performing well'
                          : healthScore.overall >= 60
                            ? 'Some areas need improvement'
                            : 'Needs attention — review insights below'}
                      </p>
                    </>
                  ) : (
                    <>
                      <Skeleton className="size-36 rounded-full" />
                      <Skeleton className="h-4 w-32 rounded mt-4" />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Sub-scores Grid */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gauge className="size-4 text-amber-400" />
                    Health Score Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {healthScore ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {HEALTH_DIMENSIONS.map((dim) => (
                        <MiniProgressScore
                          key={dim.key}
                          score={healthScore[dim.key]}
                          label={dim.label}
                          color={dim.color}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20 rounded" />
                            <Skeleton className="h-4 w-8 rounded" />
                          </div>
                          <Skeleton className="h-2 rounded-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* ================================================================ */}
          {/* Section 2: Insights Panel                                         */}
          {/* ================================================================ */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="size-4 text-sky-400" />
                        Business Intelligence
                      </CardTitle>
                      <CardDescription className="mt-1">{biSummary}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Object.entries(INSIGHT_TYPE_CONFIG).map(([type, cfg]) => {
                        const count = insights.filter((i) => i.type === type).length;
                        if (count === 0) return null;
                        return (
                          <Badge
                            key={type}
                            variant="outline"
                            className={cn('text-[10px] gap-0.5 border', cfg.badgeClass)}
                          >
                            <cfg.icon className="h-2.5 w-2.5" />
                            {count}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {insights.slice(0, 8).map((insight, idx) => {
                      const typeCfg = INSIGHT_TYPE_CONFIG[insight.type] || INSIGHT_TYPE_CONFIG.strength;
                      const impactCfg = IMPACT_CONFIG[insight.impact] || IMPACT_CONFIG.medium;
                      return (
                        <motion.div
                          key={`${insight.type}-${insight.category}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="flex items-start gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors"
                        >
                          <div className="mt-0.5 shrink-0">
                            <typeCfg.icon className={cn('h-4 w-4', insight.type === 'critical' ? 'text-red-400' : insight.type === 'warning' ? 'text-amber-400' : insight.type === 'strength' ? 'text-emerald-400' : 'text-sky-400')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className={cn('text-[10px] gap-0.5 border', typeCfg.badgeClass)}>
                                {typeCfg.label}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground capitalize bg-muted px-1.5 py-0.5 rounded">
                                {insight.category}
                              </span>
                              <Badge variant="outline" className={cn('text-[10px] gap-0', impactCfg.className)}>
                                {impactCfg.label}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                              <span className="text-primary/70 shrink-0 mt-px">→</span>
                              {insight.action}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Section 3: Recommendations                                        */}
          {/* ================================================================ */}
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-400" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {recommendations.slice(0, 5).map((rec, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                      >
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ================================================================ */}
          {/* Section 4: KPI Cards                                              */}
          {/* ================================================================ */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-border/50 hover:border-violet-500/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Eye className="size-5 text-violet-400" />
                    </div>
                    <ChangeBadge value={viewsChange} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Views</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 hover:border-cyan-500/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Users className="size-5 text-cyan-400" />
                    </div>
                    <ChangeBadge value={visitorsChange} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{uniqueVisitors.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Unique Visitors</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 hover:border-amber-500/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Clock className="size-5 text-amber-400" />
                    </div>
                    <ChangeBadge value={3.1} />
                  </div>
                  <p className="text-2xl font-bold">{avgSessionDuration}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Avg. Session Duration</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 hover:border-rose-500/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <TrendingUp className="size-5 text-rose-400" />
                    </div>
                    <ChangeBadge value={bounceRateChange} invertColor />
                  </div>
                  <p className="text-2xl font-bold">{bounceRate}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Bounce Rate</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* ================================================================ */}
          {/* Section 4: Traffic Chart                                          */}
          {/* ================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="size-4 text-violet-400" />
                  Traffic Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-72">
                  <ChartContainer config={viewsChartConfig} className="h-full w-full">
                    <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const d = new Date(value);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                        className="text-[10px]"
                        interval={dateRange === '90' ? 14 : dateRange === '30' ? 4 : 1}
                      />
                      <YAxis tickLine={false} axisLine={false} className="text-[10px]" />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => {
                              const d = new Date(value as string);
                              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            }}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#fillViews)"
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#fillVisitors)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ================================================================ */}
          {/* Bottom Row: Top Pages + Device Breakdown                          */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Pages */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Globe className="size-4 text-cyan-400" />
                    Top Pages
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPages.map((page, idx) => (
                        <TableRow key={page.page}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <span className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {idx + 1}
                              </span>
                              <span className="font-mono text-sm">{page.page}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {page.views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
                                  style={{ width: `${page.percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                                {page.percentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>

            {/* Device Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border/50 h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Monitor className="size-4 text-violet-400" />
                    Device Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative size-44 shrink-0">
                      <ChartContainer
                        config={{
                          Mobile: { label: 'Mobile', color: '#8b5cf6' },
                          Desktop: { label: 'Desktop', color: '#06b6d4' },
                          Tablet: { label: 'Tablet', color: '#a78bfa' },
                        }}
                        className="h-full w-full"
                      >
                        <PieChart>
                          <Pie
                            data={deviceBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="percentage"
                            nameKey="device"
                            stroke="none"
                          >
                            {deviceBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">{totalSessions.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">sessions</span>
                      </div>
                    </div>

                    {/* Legend Bars */}
                    <div className="flex-1 w-full space-y-4">
                      {deviceBreakdown.map((item) => (
                        <div key={item.device} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <item.icon className="size-4" style={{ color: item.color }} />
                              <span className="font-medium">{item.device}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-xs">{item.sessions.toLocaleString()} sessions</span>
                              <span className="font-semibold text-foreground tabular-nums w-10 text-right">
                                {item.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ================================================================ */}
          {/* Section 4: Performance Scores                                     */}
          {/* ================================================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="size-4 text-amber-400" />
                  Performance Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <CircularScore score={seoScore} label="SEO" icon={Search} color="#8b5cf6" />
                  <CircularScore score={performanceScore} label="Performance" icon={Gauge} color="#06b6d4" />
                  <CircularScore score={accessibilityScore} label="Accessibility" icon={Accessibility} color="#22c55e" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* No Data State */}
      {!loading && !fetchError && !analytics && storefrontId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No analytics data available</h3>
          <p className="text-sm text-muted-foreground">
            Analytics will appear once your storefront starts receiving traffic.
          </p>
        </motion.div>
      )}
    </div>
  );
}
