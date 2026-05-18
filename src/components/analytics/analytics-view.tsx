'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

// =============================================================================
// Mock Data Generators
// =============================================================================

function generateDailyViews(days: number) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 60) + 20,
      visitors: Math.floor(Math.random() * 40) + 10,
    });
  }
  return data;
}

const topPages = [
  { page: '/', views: 487, percentage: 39.0, icon: Globe },
  { page: '/menu', views: 312, percentage: 25.0, icon: BarChart3 },
  { page: '/about', views: 198, percentage: 15.9, icon: Users },
  { page: '/contact', views: 137, percentage: 11.0, icon: Search },
  { page: '/gallery', views: 113, percentage: 9.1, icon: Eye },
];

const deviceBreakdown = [
  { device: 'Mobile', percentage: 62, sessions: 553, icon: Smartphone, color: '#8b5cf6' },
  { device: 'Desktop', percentage: 28, sessions: 250, icon: Monitor, color: '#06b6d4' },
  { device: 'Tablet', percentage: 10, sessions: 89, icon: Tablet, color: '#a78bfa' },
];

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
// AnalyticsView
// =============================================================================

export function AnalyticsView() {
  const { currentStorefront } = useAppStore();
  const [dateRange, setDateRange] = useState('30');

  const dailyData = useMemo(() => {
    const days = dateRange === '7' ? 7 : dateRange === '30' ? 30 : 90;
    return generateDailyViews(days);
  }, [dateRange]);

  // KPI calculations
  const totalViews = useMemo(
    () => dailyData.reduce((sum, d) => sum + d.views, 0),
    [dailyData]
  );
  const uniqueVisitors = useMemo(
    () => dailyData.reduce((sum, d) => sum + d.visitors, 0),
    [dailyData]
  );
  const avgSessionDuration = '2m 34s';
  const bounceRate = 34.2;

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
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ArrowUpRight className="size-3 mr-0.5" />
                  +12.5%
                </Badge>
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
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ArrowUpRight className="size-3 mr-0.5" />
                  +8.3%
                </Badge>
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
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                  <ArrowDownRight className="size-3 mr-0.5" />
                  -5.1%
                </Badge>
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
                    <span className="text-2xl font-bold">892</span>
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
                          <span className="text-xs">{item.sessions} sessions</span>
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
              <CircularScore score={92} label="SEO" icon={Search} color="#8b5cf6" />
              <CircularScore score={88} label="Performance" icon={Gauge} color="#06b6d4" />
              <CircularScore score={95} label="Accessibility" icon={Accessibility} color="#22c55e" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
