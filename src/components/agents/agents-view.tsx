'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
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
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Zap,
  FileText,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PipelineExecution {
  id: string;
  storefrontId: string | null;
  sessionId: string;
  status: string;
  currentStage: string;
  totalStages: number;
  progress: number;
  validationScore: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  _count: { logs: number };
}

interface PipelineLog {
  id: string;
  stage: string;
  level: string;
  agent: string;
  message: string;
  detail: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number | null;
  timestamp: string;
}

interface PipelineStats {
  total: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
  avgValidationScore: number;
}

interface PipelineApiResponse {
  executions: PipelineExecution[];
  pagination: { total: number; limit: number; offset: number };
  stats: PipelineStats;
}

interface ExecutionDetailResponse {
  execution: PipelineExecution;
  logs: PipelineLog[];
}

type AgentType =
  | 'branding'
  | 'ui'
  | 'content'
  | 'product'
  | 'seo'
  | 'deployment'
  | 'debug'
  | 'repair';

interface AgentCapability {
  type: AgentType;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  capabilities: string[];
  stageNames: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    type: 'branding',
    name: 'Branding',
    icon: <Palette className="h-4 w-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    description: 'Creates brand identities — color palettes, typography, visual language',
    capabilities: ['Color Palettes', 'Typography', 'Logo Concepts', 'Brand Guidelines'],
    stageNames: ['generating_branding'],
  },
  {
    type: 'ui',
    name: 'UI',
    icon: <Monitor className="h-4 w-4" />,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/20',
    description: 'Designs responsive layouts, component systems, and page architectures',
    capabilities: ['Responsive Layouts', 'Components', 'Page Architecture', 'Accessibility'],
    stageNames: ['planning_structure', 'generating_sections'],
  },
  {
    type: 'content',
    name: 'Content',
    icon: <PenTool className="h-4 w-4" />,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    description: 'Writes compelling copy, headlines, product descriptions, and CTAs',
    capabilities: ['Copywriting', 'Headlines', 'Product Descriptions', 'CTA Optimization'],
    stageNames: ['generating_content'],
  },
  {
    type: 'product',
    name: 'Product',
    icon: <Package className="h-4 w-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    description: 'Structures product catalogs, pricing, and category hierarchies',
    capabilities: ['Product Catalogs', 'Pricing Structure', 'Categories', 'Image Prompts'],
    stageNames: ['understanding_business'],
  },
  {
    type: 'seo',
    name: 'SEO',
    icon: <Search className="h-4 w-4" />,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    description: 'Optimizes for search engines — meta tags, structured data, keywords',
    capabilities: ['Meta Tags', 'Structured Data', 'Keywords', 'Sitemaps'],
    stageNames: ['assembling_pages'],
  },
  {
    type: 'deployment',
    name: 'Deployment',
    icon: <Rocket className="h-4 w-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    description: 'Publishes storefronts to production with domains and SSL',
    capabilities: ['Vercel', 'Cloudflare Pages', 'Custom Domains', 'SSL'],
    stageNames: [],
  },
  {
    type: 'debug',
    name: 'Debug',
    icon: <Bug className="h-4 w-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: 'Validates HTML5, lints CSS, audits accessibility and performance',
    capabilities: ['HTML Validation', 'CSS Linting', 'A11y Audit', 'Perf Analysis'],
    stageNames: ['validating'],
  },
  {
    type: 'repair',
    name: 'Repair',
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    description: 'Auto-fixes HTML, CSS, accessibility violations, and performance issues',
    capabilities: ['Auto-Fix HTML', 'CSS Corrections', 'A11y Remediation', 'Perf Optimization'],
    stageNames: ['repairing'],
  },
];

const STAGE_LABELS: Record<string, string> = {
  processing_voice: 'Processing Voice',
  understanding_business: 'Understanding Business',
  planning_structure: 'Planning Structure',
  generating_branding: 'Generating Branding',
  generating_content: 'Generating Content',
  generating_sections: 'Generating Sections',
  assembling_pages: 'Assembling Pages',
  validating: 'Validating',
  repairing: 'Repairing',
};

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBgColor(score: number | null): string {
  if (score == null) return 'bg-muted';
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    completed: {
      label: 'Completed',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-500/15 text-red-400 border-red-500/25',
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
    running: {
      label: 'Running',
      className: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
      icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />,
    },
    pending: {
      label: 'Pending',
      className: 'bg-muted/50 text-muted-foreground border-muted-foreground/20',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-muted/50 text-muted-foreground border-muted-foreground/20',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
    },
  };

  const c = config[status] || config.pending;

  return (
    <Badge variant="outline" className={cn('text-[10px] border gap-0.5', c.className)}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Log Level Icon
// ---------------------------------------------------------------------------

function LogLevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
    case 'error':
      return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
    default:
      return <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function PipelineLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-7 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40 rounded" />
        </CardHeader>
        <CardContent className="pt-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Agent cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-3 w-12 rounded mt-1" />
                </div>
              </div>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentsView() {
  const { toast } = useToast();
  const [executions, setExecutions] = useState<PipelineExecution[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<PipelineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch pipeline executions (stable callback for reuse in buttons)
  const fetchPipeline = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pipeline?limit=20', signal ? { signal } : undefined);
      if (!res.ok) throw new Error(`Failed to fetch pipeline (status ${res.status})`);
      const data: PipelineApiResponse = await res.json();
      setExecutions(data.executions);
      setStats(data.stats);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[AGENTS_VIEW] Failed to fetch pipeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
      toast({
        title: 'Failed to load pipeline data',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch on mount with AbortController
  useEffect(() => {
    const controller = new AbortController();
    fetchPipeline(controller.signal);
    return () => controller.abort();
  }, [fetchPipeline]);

  // Fetch execution logs on expand
  const fetchExecutionLogs = useCallback(async (executionId: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/pipeline?executionId=${encodeURIComponent(executionId)}`);
      if (!res.ok) throw new Error('Failed to fetch execution logs');
      const data: ExecutionDetailResponse = await res.json();
      setExpandedLogs(data.logs);
    } catch (err) {
      console.error('[AGENTS_VIEW] Failed to fetch logs:', err);
      setExpandedLogs([]);
      toast({
        title: 'Failed to load logs',
        variant: 'destructive',
      });
    } finally {
      setLogsLoading(false);
    }
  }, [toast]);

  const toggleExpand = useCallback(
    (executionId: string) => {
      if (expandedId === executionId) {
        setExpandedId(null);
        setExpandedLogs([]);
      } else {
        setExpandedId(executionId);
        fetchExecutionLogs(executionId);
      }
    },
    [expandedId, fetchExecutionLogs]
  );

  // Determine the currently active stage across all running executions
  const runningExecutions = executions.filter((e) => e.status === 'running');
  const activeStageName = runningExecutions.length > 0 ? runningExecutions[0].currentStage : null;

  // Success rate from stats
  const successRate =
    stats && stats.total > 0
      ? ((stats.completed / stats.total) * 100).toFixed(1)
      : '0.0';

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
            Pipeline execution history and AI agent fleet status
          </p>
        </div>
        {runningExecutions.length > 0 && (
          <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/25">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            {runningExecutions.length} Running
          </Badge>
        )}
      </motion.div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => fetchPipeline()}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* Loading Skeleton */}
      {loading && <PipelineLoadingSkeleton />}

      {/* ================================================================ */}
      {/* Content (when loaded)                                            */}
      {/* ================================================================ */}
      {!loading && (
        <>
          {/* ============================================================ */}
          {/* Section 3: System Status Dashboard                            */}
          {/* ============================================================ */}
          {stats && (
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Total Executions</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Success Rate</span>
                    </div>
                    <p className={cn('text-2xl font-bold tabular-nums', parseFloat(successRate) >= 80 ? 'text-emerald-400' : parseFloat(successRate) >= 50 ? 'text-amber-400' : 'text-red-400')}>
                      {successRate}%
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-sky-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Avg Validation</span>
                    </div>
                    <p className={cn('text-2xl font-bold tabular-nums', scoreColor(stats.avgValidationScore))}>
                      {stats.avgValidationScore}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 hover:border-amber-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Avg Gen Time</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatDuration(stats.avgDurationMs)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ============================================================ */}
          {/* Section 1: Pipeline Execution History                          */}
          {/* ============================================================ */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary/70" />
                      Pipeline Execution History
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {executions.length} recent pipeline runs
                      {stats && ` · ${stats.completed} completed · ${stats.failed} failed`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => fetchPipeline()}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {executions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="size-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                      <Bot className="size-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No pipeline executions yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Pipeline executions will appear here once you generate a website. Use the Builder to start your first generation.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Status</TableHead>
                          <TableHead>Current Stage</TableHead>
                          <TableHead className="w-[120px]">Progress</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Validation</TableHead>
                          <TableHead>Started</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executions.map((exec) => {
                          const isExpanded = expandedId === exec.id;
                          return (
                            <React.Fragment key={exec.id}>
                              <TableRow
                                className={cn(
                                  'cursor-pointer hover:bg-muted/30 transition-colors',
                                  isExpanded && 'bg-muted/20'
                                )}
                                onClick={() => toggleExpand(exec.id)}
                              >
                                <TableCell className="w-8 p-2">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={exec.status} />
                                </TableCell>
                                <TableCell className="text-sm font-medium max-w-[200px] truncate">
                                  {exec.status === 'completed'
                                    ? 'Pipeline Complete'
                                    : exec.status === 'failed'
                                      ? 'Failed'
                                      : getStageLabel(exec.currentStage)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={exec.progress} className="h-1.5 w-16" />
                                    <span className="text-xs text-muted-foreground tabular-nums w-8">
                                      {exec.progress}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm tabular-nums text-muted-foreground">
                                  {formatDuration(exec.durationMs)}
                                </TableCell>
                                <TableCell>
                                  {exec.validationScore != null ? (
                                    <span className={cn('text-sm font-semibold tabular-nums', scoreColor(exec.validationScore))}>
                                      {exec.validationScore}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                  {formatTimestamp(exec.startedAt)}
                                </TableCell>
                              </TableRow>

                              {/* Expanded Logs */}
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={7} className="p-0">
                                    <div className="bg-muted/30 border-t border-border/50">
                                      <div className="max-w-4xl mx-auto p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Execution Logs
                                          </span>
                                          {exec.errorMessage && (
                                            <Badge variant="outline" className="ml-2 text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
                                              {exec.errorMessage}
                                            </Badge>
                                          )}
                                        </div>

                                        {logsLoading ? (
                                          <div className="space-y-2">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                              <div key={i} className="flex items-center gap-3">
                                                <Skeleton className="h-4 w-4 rounded" />
                                                <Skeleton className="h-4 w-32 rounded" />
                                                <Skeleton className="h-4 flex-1 rounded" />
                                              </div>
                                            ))}
                                          </div>
                                        ) : expandedLogs.length === 0 ? (
                                          <p className="text-sm text-muted-foreground">No logs recorded for this execution.</p>
                                        ) : (
                                          <ScrollArea className="max-h-64">
                                            <div className="space-y-1">
                                              {expandedLogs.map((log) => (
                                                <div
                                                  key={log.id}
                                                  className="flex items-start gap-3 rounded-md px-2.5 py-2 hover:bg-muted/50 transition-colors"
                                                >
                                                  <LogLevelIcon level={log.level} />
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs font-medium text-foreground">
                                                        {getStageLabel(log.stage)}
                                                      </span>
                                                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {log.agent}
                                                      </span>
                                                      {log.durationMs != null && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                          {formatDuration(log.durationMs)}
                                                        </span>
                                                      )}
                                                      {(log.inputTokens != null || log.outputTokens != null) && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                          {log.inputTokens ?? 0}in / {log.outputTokens ?? 0}out tokens
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{log.message}</p>
                                                    {log.detail && (
                                                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
                                                        {log.detail}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </ScrollArea>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ============================================================ */}
          {/* Section 2: Real Agent Capability Cards                        */}
          {/* ============================================================ */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary/70" />
                      AI Agent Fleet
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {AGENT_CAPABILITIES.length} specialized agents in the generation pipeline
                    </CardDescription>
                  </div>
                  {activeStageName && (
                    <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/25">
                      <Activity className="h-3 w-3 mr-1" />
                      Stage: {getStageLabel(activeStageName)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <AnimatePresence>
                    {AGENT_CAPABILITIES.map((agent, index) => {
                      // Determine if this agent is currently active based on running executions
                      const isActive =
                        activeStageName != null &&
                        agent.stageNames.includes(activeStageName);

                      return (
                        <motion.div
                          key={agent.type}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.04 }}
                        >
                          <div
                            className={cn(
                              'rounded-xl border p-4 transition-all relative overflow-hidden',
                              isActive
                                ? cn(agent.borderColor, agent.bgColor, 'shadow-sm ring-1 ring-current')
                                : 'border-border/50 hover:border-border'
                            )}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute top-2 right-2">
                                <span className="relative flex h-2 w-2">
                                  <span
                                    className={cn(
                                      'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                                      agent.color.replace('text-', 'bg-')
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      'relative inline-flex h-2 w-2 rounded-full',
                                      agent.color.replace('text-', 'bg-')
                                    )}
                                  />
                                </span>
                              </div>
                            )}

                            {/* Agent header */}
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div
                                className={cn(
                                  'size-8 rounded-lg flex items-center justify-center shrink-0',
                                  agent.bgColor,
                                  agent.color
                                )}
                              >
                                {agent.icon}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{agent.name}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">{agent.type} Agent</p>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2">
                              {agent.description}
                            </p>

                            {/* Capability tags */}
                            <div className="flex flex-wrap gap-1">
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
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
