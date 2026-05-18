'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

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
}

// =============================================================================
// Device Icon & Color Mapping
// =============================================================================

const deviceMeta: Record<string, { icon: React.ElementType; color: string }> = {
  Mobile: { icon: Smartphone, color: '#8b5cf6' },
  Desktop: { icon: Monitor, color: '#06b6d4' },
  Tablet: { icon: Tablet, color: '#a78bfa' },
};

// =============================================================================
// Chart Config
// =============================================================================

const viewsChartConfig: ChartConfig = {
  views: { label: 'Page Views', color: '#8b5cf6' },
  visitors: { label: 'Unique Visitors', color: '#06b6d4' },
};

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// =============================================================================
// Change Badge
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

// =============================================================================
// Circular Score Component
// =============================================================================

function CircularScore({
  score,
  label,
  icon: Icon,
  color,
}: {
  score: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="relative size-28">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/50"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="size-4 mb-0.5" style={{ color }} />
          <span className="text-xl font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
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
      {/* Scores skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-4">
                <div className="size-28 bg-muted/50 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// AnalyticsView
// =============================================================================

export function AnalyticsView() {
  const { currentStorefront } = useAppStore();
  const [dateRange, setDateRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (storeId: string, days: number) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/analytics?storefrontId=${encodeURIComponent(storeId)}&days=${days}`
      );
      if (!res.ok) throw new Error(`Failed to fetch analytics (status ${res.status})`);
      const data = await res.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      console.error('[ANALYTICS_VIEW] Failed to fetch analytics:', err);
      setFetchError(err instanceof Error ? err.message : 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentStorefront) return;
    const days = dateRange === '7' ? 7 : dateRange === '30' ? 30 : 90;
    fetchAnalytics(currentStorefront.id, days);
  }, [currentStorefront, dateRange, fetchAnalytics]);

  // Derived data from API response
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

  // Empty state when no storefront selected
  if (!currentStorefront) {
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
              Select a published storefront from your projects to view its analytics, performance metrics, and visitor insights.
            </p>
          </div>
        </motion.div>
      </div>
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance insights for{' '}
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
          <span className="flex-1">Failed to load analytics data.</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => fetchAnalytics(currentStorefront.id, dateRange === '7' ? 7 : dateRange === '30' ? 30 : 90)}
          >
            Retry
          </Button>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <AnalyticsLoadingSkeleton />}

      {/* Analytics Content */}
      {!loading && analytics && (
        <>
          {/* KPI Cards */}
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
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                      <ArrowUpRight className="size-3 mr-0.5" />
                      +3.1%
                    </Badge>
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

          {/* Views Chart */}
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

          {/* Bottom Row: Top Pages + Device Breakdown */}
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

          {/* Scores Section */}
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

      {/* No Data State (not loading, no error, no analytics) */}
      {!loading && !fetchError && !analytics && (
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
