'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Bot,
  Palette,
  Monitor,
  PenTool,
  Package,
  Search,
  Rocket,
  Bug,
  Wrench,
  Mic,
  Brain,
  Globe,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  ChevronRight,
  BarChart3,
  Workflow,
  Layers,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type AgentType =
  | 'branding'
  | 'ui'
  | 'content'
  | 'product'
  | 'seo'
  | 'deployment'
  | 'debug'
  | 'repair';

type AgentStatus = 'idle' | 'working' | 'error' | 'completed';

interface ExecutionRecord {
  id: string;
  status: 'success' | 'failed' | 'running';
  command: string;
  duration: string;
  timestamp: string;
}

interface AgentData {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  model: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  capabilities: string[];
  description: string;
  tasksCompleted: number;
  tasksFailed: number;
  successRate: number;
  avgResponseTime: string;
  temperature: number;
  maxTokens: number;
  recentExecutions: ExecutionRecord[];
}

// ---------------------------------------------------------------------------
// Color mapping
// ---------------------------------------------------------------------------

const AGENT_COLORS: Record<
  AgentType,
  { color: string; bg: string; border: string }
> = {
  branding: {
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  ui: {
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  content: {
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  product: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  seo: {
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  deployment: {
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  debug: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  repair: {
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
};

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dot: string; pulse: string; badgeClass: string }
> = {
  idle: {
    label: 'Idle',
    dot: 'bg-muted-foreground/40',
    pulse: '',
    badgeClass: 'bg-muted/50 text-muted-foreground border-muted-foreground/20',
  },
  working: {
    label: 'Working',
    dot: 'bg-emerald-500',
    pulse: 'animate-pulse',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  error: {
    label: 'Error',
    dot: 'bg-red-500',
    pulse: '',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-blue-500',
    pulse: '',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  },
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const AGENTS: AgentData[] = [
  {
    id: 'agent-1',
    name: 'Branding',
    type: 'branding',
    status: 'working',
    model: 'claude-4-sonnet',
    icon: <Palette className="h-4 w-4" />,
    color: AGENT_COLORS.branding.color,
    bgColor: AGENT_COLORS.branding.bg,
    borderColor: AGENT_COLORS.branding.border,
    capabilities: ['Color Palettes', 'Typography Selection', 'Logo Concepts', 'Brand Guidelines'],
    description:
      'Creates distinctive brand identities from voice descriptions. Analyzes business tone, industry, and target audience to generate color palettes, typography pairings, logo concepts, and comprehensive brand guidelines that give each storefront a unique personality.',
    tasksCompleted: 312,
    tasksFailed: 8,
    successRate: 97.5,
    avgResponseTime: '2.4s',
    temperature: 0.6,
    maxTokens: 8192,
    recentExecutions: [
      { id: 'e1', status: 'running', command: 'generate --brand-palette "artisan bakery"', duration: '4.8s', timestamp: 'Just now' },
      { id: 'e2', status: 'success', command: 'select --typography "luxury jewelry store"', duration: '2.1s', timestamp: '12 min ago' },
      { id: 'e3', status: 'success', command: 'concept --logo "Mountain Trail Outfitters"', duration: '6.3s', timestamp: '28 min ago' },
      { id: 'e4', status: 'success', command: 'guide --brand "Sweet Dreams Bakery"', duration: '8.7s', timestamp: '1 hr ago' },
      { id: 'e5', status: 'failed', command: 'generate --palette --mood "industrial plumbing"', duration: '3.2s', timestamp: '2 hr ago' },
    ],
  },
  {
    id: 'agent-2',
    name: 'UI',
    type: 'ui',
    status: 'working',
    model: 'gpt-4o',
    icon: <Monitor className="h-4 w-4" />,
    color: AGENT_COLORS.ui.color,
    bgColor: AGENT_COLORS.ui.bg,
    borderColor: AGENT_COLORS.ui.border,
    capabilities: ['Responsive Layouts', 'Component Design', 'Page Architecture', 'Accessibility'],
    description:
      'Designs responsive storefront layouts and component systems optimized for conversions. Creates page architectures with hero sections, product grids, navigation patterns, and mobile-first designs that adapt beautifully across all screen sizes while maintaining accessibility standards.',
    tasksCompleted: 428,
    tasksFailed: 15,
    successRate: 96.6,
    avgResponseTime: '3.1s',
    temperature: 0.2,
    maxTokens: 6144,
    recentExecutions: [
      { id: 'e6', status: 'running', command: 'layout --responsive "organic skincare homepage"', duration: '14.2s', timestamp: 'Just now' },
      { id: 'e7', status: 'success', command: 'design --component "product-card grid"', duration: '5.6s', timestamp: '18 min ago' },
      { id: 'e8', status: 'success', command: 'architect --page "checkout flow"', duration: '11.3s', timestamp: '35 min ago' },
      { id: 'e9', status: 'success', command: 'audit --a11y "pet supplies mobile nav"', duration: '7.8s', timestamp: '1 hr ago' },
      { id: 'e10', status: 'failed', command: 'layout --hero "auto parts landing"', duration: '9.1s', timestamp: '2 hr ago' },
    ],
  },
  {
    id: 'agent-3',
    name: 'Content',
    type: 'content',
    status: 'working',
    model: 'claude-4-sonnet',
    icon: <PenTool className="h-4 w-4" />,
    color: AGENT_COLORS.content.color,
    bgColor: AGENT_COLORS.content.bg,
    borderColor: AGENT_COLORS.content.border,
    capabilities: ['Copywriting', 'Headlines', 'Product Descriptions', 'CTA Optimization'],
    description:
      'Writes compelling storefront copy that converts visitors into customers. Crafts attention-grabbing headlines, persuasive product descriptions, trust-building about pages, and optimized call-to-action buttons tailored to each business\'s unique voice and audience.',
    tasksCompleted: 567,
    tasksFailed: 11,
    successRate: 98.1,
    avgResponseTime: '1.8s',
    temperature: 0.7,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e11', status: 'success', command: 'write --hero-copy "Sweet Dreams Bakery"', duration: '3.2s', timestamp: '5 min ago' },
      { id: 'e12', status: 'running', command: 'describe --product "hand-poured soy candles"', duration: '6.1s', timestamp: 'Just now' },
      { id: 'e13', status: 'success', command: 'headline --optimize "fitness coaching signup"', duration: '2.4s', timestamp: '22 min ago' },
      { id: 'e14', status: 'success', command: 'cta --buttons "subscription box checkout"', duration: '1.9s', timestamp: '45 min ago' },
      { id: 'e15', status: 'success', command: 'copy --about-page "family-owned nursery"', duration: '8.5s', timestamp: '1.5 hr ago' },
    ],
  },
  {
    id: 'agent-4',
    name: 'Product',
    type: 'product',
    status: 'completed',
    model: 'gemini-2.5-flash',
    icon: <Package className="h-4 w-4" />,
    color: AGENT_COLORS.product.color,
    bgColor: AGENT_COLORS.product.bg,
    borderColor: AGENT_COLORS.product.border,
    capabilities: ['Product Catalogs', 'Pricing Structure', 'Category Organization', 'Image Generation Prompts'],
    description:
      'Structures product and service catalogs with intelligent categorization and pricing. Organizes inventory into logical hierarchies, generates product image prompts for AI-generated visuals, and creates clear pricing displays that help customers find and purchase with confidence.',
    tasksCompleted: 389,
    tasksFailed: 6,
    successRate: 98.5,
    avgResponseTime: '2.6s',
    temperature: 0.3,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e16', status: 'success', command: 'catalog --structure "coffee roastery 12 SKUs"', duration: '5.4s', timestamp: '8 min ago' },
      { id: 'e17', status: 'success', command: 'pricing --display "tiered subscription plans"', duration: '3.1s', timestamp: '25 min ago' },
      { id: 'e18', status: 'success', command: 'category --organize "home decor 50+ items"', duration: '4.7s', timestamp: '50 min ago' },
      { id: 'e19', status: 'success', command: 'prompt --image "artisan leather wallet hero"', duration: '2.8s', timestamp: '1 hr ago' },
      { id: 'e20', status: 'failed', command: 'catalog --import "csv wholesale feed"', duration: '12.3s', timestamp: '2.5 hr ago' },
    ],
  },
  {
    id: 'agent-5',
    name: 'SEO',
    type: 'seo',
    status: 'idle',
    model: 'claude-4-sonnet',
    icon: <Search className="h-4 w-4" />,
    color: AGENT_COLORS.seo.color,
    bgColor: AGENT_COLORS.seo.bg,
    borderColor: AGENT_COLORS.seo.border,
    capabilities: ['Meta Tags', 'Structured Data', 'Keyword Research', 'Sitemap Generation'],
    description:
      'Optimizes storefronts for search engine visibility from day one. Generates optimized meta titles and descriptions, implements JSON-LD structured data for products and local business, researches target keywords, and produces sitemaps to ensure rapid indexing by search engines.',
    tasksCompleted: 245,
    tasksFailed: 4,
    successRate: 98.4,
    avgResponseTime: '2.0s',
    temperature: 0.2,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e21', status: 'success', command: 'optimize --meta-tags "vintage clothing boutique"', duration: '3.5s', timestamp: '15 min ago' },
      { id: 'e22', status: 'success', command: 'schema --structured-data "local bakery products"', duration: '4.2s', timestamp: '40 min ago' },
      { id: 'e23', status: 'success', command: 'research --keywords "organic baby products"', duration: '6.8s', timestamp: '1 hr ago' },
      { id: 'e24', status: 'success', command: 'generate --sitemap "multi-page storefront"', duration: '1.4s', timestamp: '2 hr ago' },
      { id: 'e25', status: 'success', command: 'optimize --alt-text "product image gallery"', duration: '2.9s', timestamp: '3 hr ago' },
    ],
  },
  {
    id: 'agent-6',
    name: 'Deployment',
    type: 'deployment',
    status: 'working',
    model: 'deepseek-v3',
    icon: <Rocket className="h-4 w-4" />,
    color: AGENT_COLORS.deployment.color,
    bgColor: AGENT_COLORS.deployment.bg,
    borderColor: AGENT_COLORS.deployment.border,
    capabilities: ['Vercel Deploy', 'Cloudflare Pages', 'Custom Domains', 'SSL Certificates'],
    description:
      'Handles end-to-end publishing of generated storefronts to production. Deploys to Vercel or Cloudflare Pages with one click, configures custom domains, provisions SSL certificates, and ensures the published site is live and accessible within minutes of generation.',
    tasksCompleted: 198,
    tasksFailed: 12,
    successRate: 94.3,
    avgResponseTime: '45.2s',
    temperature: 0.1,
    maxTokens: 2048,
    recentExecutions: [
      { id: 'e26', status: 'running', command: 'deploy --vercel "Sweet Dreams Bakery production"', duration: '38.0s', timestamp: 'Just now' },
      { id: 'e27', status: 'success', command: 'publish --cloudflare "fitness coaching site"', duration: '42.1s', timestamp: '20 min ago' },
      { id: 'e28', status: 'success', command: 'domain --configure "shop.example.com CNAME"', duration: '8.3s', timestamp: '1 hr ago' },
      { id: 'e29', status: 'success', command: 'ssl --provision "checkout.shop.example.com"', duration: '12.5s', timestamp: '2 hr ago' },
      { id: 'e30', status: 'failed', command: 'deploy --vercel "auto parts mega-store"', duration: '60.0s', timestamp: '3 hr ago' },
    ],
  },
  {
    id: 'agent-7',
    name: 'Debug',
    type: 'debug',
    status: 'error',
    model: 'claude-4-opus',
    icon: <Bug className="h-4 w-4" />,
    color: AGENT_COLORS.debug.color,
    bgColor: AGENT_COLORS.debug.bg,
    borderColor: AGENT_COLORS.debug.border,
    capabilities: ['HTML Validation', 'CSS Linting', 'Accessibility Audit', 'Performance Analysis'],
    description:
      'Rigorously validates every generated storefront before publication. Checks HTML5 compliance, lints CSS for inconsistencies, runs WCAG accessibility audits, and analyzes page performance scores to ensure every site meets professional quality standards.',
    tasksCompleted: 534,
    tasksFailed: 18,
    successRate: 96.7,
    avgResponseTime: '5.3s',
    temperature: 0.1,
    maxTokens: 8192,
    recentExecutions: [
      { id: 'e31', status: 'failed', command: 'validate --html "checkout form structure"', duration: '4.1s', timestamp: '3 min ago' },
      { id: 'e32', status: 'success', command: 'lint --css "product page responsive breakpoints"', duration: '3.6s', timestamp: '18 min ago' },
      { id: 'e33', status: 'success', command: 'audit --a11y "navigation keyboard focus traps"', duration: '8.9s', timestamp: '30 min ago' },
      { id: 'e34', status: 'success', command: 'analyze --performance "image-heavy hero section"', duration: '6.2s', timestamp: '1 hr ago' },
      { id: 'e35', status: 'success', command: 'validate --schema "product JSON-LD markup"', duration: '2.8s', timestamp: '2 hr ago' },
    ],
  },
  {
    id: 'agent-8',
    name: 'Repair',
    type: 'repair',
    status: 'idle',
    model: 'claude-4-sonnet',
    icon: <Wrench className="h-4 w-4" />,
    color: AGENT_COLORS.repair.color,
    bgColor: AGENT_COLORS.repair.bg,
    borderColor: AGENT_COLORS.repair.border,
    capabilities: ['Auto-Fix HTML', 'CSS Corrections', 'A11y Remediation', 'Performance Optimization'],
    description:
      'Automatically fixes issues discovered by the Debug agent. Applies HTML corrections, resolves CSS conflicts, remediates accessibility violations, and optimizes performance bottlenecks — ensuring every storefront ships clean, fast, and fully accessible without manual intervention.',
    tasksCompleted: 178,
    tasksFailed: 3,
    successRate: 98.3,
    avgResponseTime: '3.8s',
    temperature: 0.15,
    maxTokens: 6144,
    recentExecutions: [
      { id: 'e36', status: 'success', command: 'fix --html "missing alt attributes on product images"', duration: '5.1s', timestamp: '25 min ago' },
      { id: 'e37', status: 'success', command: 'correct --css "z-index stacking context checkout modal"', duration: '4.4s', timestamp: '1 hr ago' },
      { id: 'e38', status: 'success', command: 'remediate --a11y "focus order on multi-step form"', duration: '7.2s', timestamp: '2 hr ago' },
      { id: 'e39', status: 'success', command: 'optimize --performance "lazy-load below-fold images"', duration: '3.3s', timestamp: '3 hr ago' },
      { id: 'e40', status: 'failed', command: 'fix --html "nested interactive element button"', duration: '6.8s', timestamp: '4 hr ago' },
    ],
  },
];

const ORCHESTRATION_GRAPH = [
  { id: 'branding', name: 'Branding', icon: <Palette className="h-3.5 w-3.5" />, active: true },
  { id: 'ui', name: 'UI', icon: <Monitor className="h-3.5 w-3.5" />, active: true },
  { id: 'content', name: 'Content', icon: <PenTool className="h-3.5 w-3.5" />, active: false },
  { id: 'product', name: 'Product', icon: <Package className="h-3.5 w-3.5" />, active: true },
  { id: 'seo', name: 'SEO', icon: <Search className="h-3.5 w-3.5" />, active: true },
  { id: 'debug', name: 'Debug', icon: <Bug className="h-3.5 w-3.5" />, active: false },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const cardHoverVariants = {
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// ---------------------------------------------------------------------------
// Chart tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; fill: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-foreground" style={{ color: entry.fill }}>
          {entry.dataKey === 'tasksCompleted'
            ? 'Completed'
            : entry.dataKey === 'tasksFailed'
              ? 'Failed'
              : 'Success Rate'}
          : {entry.dataKey === 'successRate' ? `${entry.value}%` : entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: animated dot for orchestration graph
// ---------------------------------------------------------------------------

function DataFlowDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
      initial={{ left: '0%', opacity: 0 }}
      animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 2.5,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: 'linear',
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Execution status icon
// ---------------------------------------------------------------------------

function ExecutionStatusIcon({ status }: { status: ExecutionRecord['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    case 'running':
      return (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
          <Activity className="relative h-3.5 w-3.5 text-sky-500" />
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentsView() {
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const summaryStats = useMemo(() => {
    const totalCompleted = AGENTS.reduce((s, a) => s + a.tasksCompleted, 0);
    const totalFailed = AGENTS.reduce((s, a) => s + a.tasksFailed, 0);
    const avgSuccess =
      AGENTS.reduce((s, a) => s + a.successRate, 0) / AGENTS.length;
    const activeCount = AGENTS.filter((a) => a.status === 'working').length;
    return { totalCompleted, totalFailed, avgSuccess, activeCount };
  }, []);

  function openAgentDetail(agent: AgentData) {
    setSelectedAgent(agent);
    setDetailOpen(true);
  }

  function handleOpenChange(open: boolean) {
    setDetailOpen(open);
    if (!open) setSelectedAgent(null);
  }

  // Performance chart data for selected agent
  const performanceChartData = selectedAgent
    ? [
        { name: 'Completed', tasksCompleted: selectedAgent.tasksCompleted, fill: '#10b981' },
        { name: 'Failed', tasksFailed: selectedAgent.tasksFailed, fill: '#ef4444' },
      ]
    : [];

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ================================================================ */}
      {/* Header                                                          */}
      {/* ================================================================ */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-primary/70" />
            Agent Orchestrator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Voice-to-Website AI agent fleet — describe your business, get a storefront
          </p>
        </div>
      </motion.div>

      {/* ================================================================ */}
      {/* Agent Registry Grid                                             */}
      {/* ================================================================ */}
      <motion.div variants={itemVariants}>
        <Card className="gap-0">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary/70" />
                  Agent Registry
                </CardTitle>
                <CardDescription className="mt-1">
                  {AGENTS.length} agents registered &middot; {summaryStats.activeCount} active
                  &middot; {summaryStats.totalCompleted.toLocaleString()} storefronts generated
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = AGENTS.filter((a) => a.status === key).length;
                  return (
                    <Badge
                      key={key}
                      variant="outline"
                      className={cn(
                        'text-[10px] capitalize border',
                        cfg.badgeClass
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full mr-1',
                          cfg.dot,
                          cfg.pulse
                        )}
                      />
                      {count} {cfg.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {AGENTS.map((agent, index) => {
                  const statusCfg = STATUS_CONFIG[agent.status];
                  return (
                    <motion.div
                      key={agent.id}
                      variants={cardHoverVariants}
                      whileHover="hover"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.04,
                        ease: 'easeOut',
                      }}
                    >
                      <Card
                        className={cn(
                          'group relative cursor-pointer overflow-hidden transition-colors hover:border-primary/30',
                          agent.borderColor
                        )}
                        onClick={() => openAgentDetail(agent)}
                      >
                        {/* Colored top accent line */}
                        <div
                          className={cn(
                            'absolute top-0 left-0 right-0 h-0.5',
                            agent.color.replace('text-', 'bg-')
                          )}
                        />

                        <CardContent className="p-4">
                          {/* Agent header row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback
                                  className={cn(
                                    'text-xs font-bold',
                                    agent.bgColor,
                                    agent.color
                                  )}
                                >
                                  {agent.icon}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">
                                  {agent.name}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {agent.type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    {agent.model}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] shrink-0 border',
                                statusCfg.badgeClass
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full mr-1',
                                  statusCfg.dot,
                                  statusCfg.pulse
                                )}
                              />
                              {statusCfg.label}
                            </Badge>
                          </div>

                          {/* Capabilities */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {agent.capabilities.slice(0, 3).map((cap) => (
                              <span
                                key={cap}
                                className={cn(
                                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                                  agent.bgColor,
                                  agent.color
                                )}
                              >
                                {cap}
                              </span>
                            ))}
                            {agent.capabilities.length > 3 && (
                              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                +{agent.capabilities.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Stats row */}
                          <Separator className="my-3" />
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Sites
                              </p>
                              <p className="text-sm font-bold mt-0.5">
                                {agent.tasksCompleted}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Success
                              </p>
                              <p className="text-sm font-bold mt-0.5">
                                {agent.successRate}%
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Avg Time
                              </p>
                              <p className="text-sm font-bold mt-0.5">
                                {agent.avgResponseTime}
                              </p>
                            </div>
                          </div>

                          {/* Expand button */}
                          <div className="mt-3 flex justify-end">
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/70 transition-colors group-hover:translate-x-0.5 transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================ */}
      {/* Orchestration Graph                                             */}
      {/* ================================================================ */}
      <motion.div variants={itemVariants}>
        <Card className="gap-0">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-primary/70" />
                  Orchestration Graph
                </CardTitle>
                <CardDescription className="mt-1">
                  Voice-to-Website pipeline — from spoken description to published storefront
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-normal"
              >
                <Activity className="h-3 w-3 mr-1" />
                Live Flow
                <span className="relative flex h-2 w-2 ml-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="relative overflow-x-auto">
              {/* Flow diagram */}
              <div className="min-w-[780px] mx-auto">
                {/* Row 1: Voice Input → Published Storefront */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {/* Voice Input */}
                  <div className="flex items-center justify-center w-32 h-14 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <Mic className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Voice Input
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-20 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={0} />
                  </div>

                  {/* Business Understanding */}
                  <div className="flex items-center justify-center w-36 h-14 rounded-xl bg-violet-500/10 border border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    <div className="flex flex-col items-center gap-0.5">
                      <Brain className="h-4 w-4 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-500">
                        Business Understanding
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-20 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={0.5} />
                  </div>

                  {/* Agent Fleet */}
                  <div className="flex items-center justify-center w-32 h-14 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Agent Fleet
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-20 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={1.0} />
                  </div>

                  {/* Sandbox Validation */}
                  <div className="flex items-center justify-center w-36 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                    <div className="flex flex-col items-center gap-0.5">
                      <Bug className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-500">
                        Sandbox Validation
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-20 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={1.5} />
                  </div>

                  {/* Published Storefront */}
                  <div className="flex items-center justify-center w-36 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <div className="flex flex-col items-center gap-0.5">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-500">
                        Published Storefront
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical connector from Agent Fleet down to sub-agents */}
                <div className="flex justify-center mb-4">
                  <div className="relative w-0.5 h-8 bg-primary/20 overflow-hidden">
                    <motion.span
                      className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                      initial={{ top: '0%', opacity: 0 }}
                      animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        ease: 'linear',
                      }}
                    />
                  </div>
                </div>

                {/* Row 2: Sub-agent nodes */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-3xl mx-auto">
                  {ORCHESTRATION_GRAPH.map((node, idx) => {
                    const colors = AGENT_COLORS[node.id as AgentType];
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: idx * 0.06,
                          ease: 'easeOut',
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all',
                          node.active
                            ? cn(colors.bg, colors.border, 'shadow-sm')
                            : 'bg-muted/30 border-muted-foreground/10'
                        )}
                      >
                        <span
                          className={cn(
                            node.active ? colors.color : 'text-muted-foreground/50'
                          )}
                        >
                          {node.icon}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            node.active ? 'text-foreground' : 'text-muted-foreground/50'
                          )}
                        >
                          {node.name}
                        </span>
                        {node.active && (
                          <span className="relative flex h-1.5 w-1.5 ml-auto shrink-0">
                            <span
                              className={cn(
                                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                                colors.color.replace('text-', 'bg-')
                              )}
                            />
                            <span
                              className={cn(
                                'relative inline-flex h-1.5 w-1.5 rounded-full',
                                colors.color.replace('text-', 'bg-')
                              )}
                            />
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================================================================ */}
      {/* Agent Detail Dialog                                             */}
      {/* ================================================================ */}
      <Dialog open={detailOpen} onOpenChange={handleOpenChange}>
        {selectedAgent && (
          <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 gap-0">
            {/* Dialog header with agent color accent */}
            <div
              className={cn(
                'h-1.5 w-full rounded-t-lg',
                selectedAgent.color.replace('text-', 'bg-')
              )}
            />
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarFallback
                    className={cn(
                      'text-lg font-bold',
                      selectedAgent.bgColor,
                      selectedAgent.color
                    )}
                  >
                    {selectedAgent.icon}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-xl">
                      {selectedAgent.name} Agent
                    </DialogTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] border',
                        STATUS_CONFIG[selectedAgent.status].badgeClass
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full mr-1',
                          STATUS_CONFIG[selectedAgent.status].dot,
                          STATUS_CONFIG[selectedAgent.status].pulse
                        )}
                      />
                      {STATUS_CONFIG[selectedAgent.status].label}
                    </Badge>
                  </div>
                  <DialogDescription className="mt-1.5 text-sm leading-relaxed">
                    {selectedAgent.description}
                  </DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {selectedAgent.type}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <Bot className="h-2.5 w-2.5 mr-1" />
                      {selectedAgent.model}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {selectedAgent.avgResponseTime} avg
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="performance" className="px-6 pt-4">
              <TabsList className="w-full">
                <TabsTrigger value="performance" className="flex-1 gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  History
                </TabsTrigger>
                <TabsTrigger value="config" className="flex-1 gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Configuration
                </TabsTrigger>
              </TabsList>

              {/* Performance Tab */}
              <TabsContent value="performance" className="mt-4">
                <div className="space-y-4">
                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Sites Generated
                      </p>
                      <p className="text-2xl font-bold mt-1 text-emerald-500">
                        {selectedAgent.tasksCompleted}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Sites Failed
                      </p>
                      <p className="text-2xl font-bold mt-1 text-red-500">
                        {selectedAgent.tasksFailed}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold mt-1 text-sky-500">
                        {selectedAgent.successRate}%
                      </p>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      Generation Outcomes
                    </p>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={performanceChartData}
                          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="tasksCompleted" radius={[4, 4, 0, 0]}>
                            <Cell fill="#10b981" />
                          </Bar>
                          <Bar dataKey="tasksFailed" radius={[4, 4, 0, 0]}>
                            <Cell fill="#ef4444" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Success rate progress */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Overall Success Rate
                      </p>
                      <span className="text-sm font-bold text-emerald-500">
                        {selectedAgent.successRate}%
                      </span>
                    </div>
                    <Progress
                      value={selectedAgent.successRate}
                      className={cn('h-2 [&>div]:bg-emerald-500')}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4">
                <div className="space-y-0">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    Recent Executions
                  </p>
                  <ScrollArea className="max-h-[340px] pr-2">
                    <div className="flex flex-col gap-2">
                      {selectedAgent.recentExecutions.map((exec, idx) => (
                        <motion.div
                          key={exec.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: idx * 0.05,
                          }}
                          className={cn(
                            'rounded-lg border p-3 transition-colors hover:bg-accent/30',
                            exec.status === 'failed'
                              ? 'border-red-500/20'
                              : exec.status === 'running'
                                ? 'border-sky-500/20'
                                : ''
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <ExecutionStatusIcon status={exec.status} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono font-medium truncate">
                                {exec.command}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {exec.duration}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {exec.timestamp}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] shrink-0 border capitalize',
                                exec.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : exec.status === 'failed'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              )}
                            >
                              {exec.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Configuration Tab */}
              <TabsContent value="config" className="mt-4 pb-6">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Model Configuration
                    </p>

                    {/* Model Selection */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Model</p>
                        <p className="text-[10px] text-muted-foreground">
                          AI model used for storefront generation
                        </p>
                      </div>
                      <Select defaultValue={selectedAgent.model}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-4-opus">claude-4-opus</SelectItem>
                          <SelectItem value="claude-4-sonnet">claude-4-sonnet</SelectItem>
                          <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                          <SelectItem value="deepseek-v3">deepseek-v3</SelectItem>
                          <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Temperature */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p className="text-[10px] text-muted-foreground">
                          Controls creativity in generation
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={selectedAgent.temperature * 200}
                          className={cn(
                            'h-1.5 w-24 [&>div]:bg-primary',
                          )}
                        />
                        <span className="text-sm font-mono font-medium w-8 text-right">
                          {selectedAgent.temperature}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Max Tokens */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Max Tokens</p>
                        <p className="text-[10px] text-muted-foreground">
                          Maximum storefront output length
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={(selectedAgent.maxTokens / 8192) * 100}
                          className={cn(
                            'h-1.5 w-24 [&>div]:bg-violet-500',
                          )}
                        />
                        <span className="text-sm font-mono font-medium w-12 text-right">
                          {selectedAgent.maxTokens}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">
                      Capabilities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className={cn(
                            'inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium',
                            selectedAgent.bgColor,
                            selectedAgent.color
                          )}
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Play className="h-3.5 w-3.5" />
                      Test Agent
                    </Button>
                    <Button size="sm" className="gap-1.5">
                      <Settings className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
