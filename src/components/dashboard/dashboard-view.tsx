'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  Cpu,
  HardDrive,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Play,
  Zap,
  Container,
  Shield,
  Wrench,
  FileText,
  Search,
  GitBranch,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import type { AgentType, AgentStatus, AgentModel } from '@/lib/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

interface AgentCardData {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  model: AgentModel;
  icon: React.ReactNode;
  color: string;
  bgClass: string;
  currentTask: string | null;
  description: string;
}

const AGENTS: AgentCardData[] = [
  {
    id: 'agent-1',
    name: 'Planner',
    type: 'planner',
    status: 'working',
    model: 'claude-4-opus',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-amber-500',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    currentTask: 'Decomposing user stories for Sprint 14',
    description: 'Orchestrates task breakdown and agent delegation',
  },
  {
    id: 'agent-2',
    name: 'Frontend',
    type: 'frontend',
    status: 'working',
    model: 'claude-4-sonnet',
    icon: <Activity className="h-4 w-4" />,
    color: 'text-sky-500',
    bgClass: 'bg-sky-500/10 border-sky-500/20',
    currentTask: 'Building responsive dashboard layout',
    description: 'UI component development and styling',
  },
  {
    id: 'agent-3',
    name: 'Backend',
    type: 'backend',
    status: 'idle',
    model: 'gpt-5',
    icon: <Cpu className="h-4 w-4" />,
    color: 'text-violet-500',
    bgClass: 'bg-violet-500/10 border-violet-500/20',
    currentTask: null,
    description: 'API routes, business logic, server-side code',
  },
  {
    id: 'agent-4',
    name: 'Database',
    type: 'database',
    status: 'completed',
    model: 'claude-4-sonnet',
    icon: <HardDrive className="h-4 w-4" />,
    color: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    currentTask: null,
    description: 'Schema design, migrations, query optimization',
  },
  {
    id: 'agent-5',
    name: 'DevOps',
    type: 'devops',
    status: 'working',
    model: 'deepseek-v3',
    icon: <Container className="h-4 w-4" />,
    color: 'text-orange-500',
    bgClass: 'bg-orange-500/10 border-orange-500/20',
    currentTask: 'Configuring CI/CD pipeline for staging',
    description: 'Infrastructure, deployment, and monitoring',
  },
  {
    id: 'agent-6',
    name: 'Security',
    type: 'security',
    status: 'error',
    model: 'claude-4-opus',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-red-500',
    bgClass: 'bg-red-500/10 border-red-500/20',
    currentTask: 'CVE scan detected 2 vulnerabilities',
    description: 'Code audits, vulnerability scanning, auth flows',
  },
  {
    id: 'agent-7',
    name: 'Testing',
    type: 'testing',
    status: 'working',
    model: 'gemini-2.5-flash',
    icon: <Search className="h-4 w-4" />,
    color: 'text-teal-500',
    bgClass: 'bg-teal-500/10 border-teal-500/20',
    currentTask: 'Running integration tests (34/61 passed)',
    description: 'Unit tests, integration tests, E2E coverage',
  },
  {
    id: 'agent-8',
    name: 'Refactor',
    type: 'refactor',
    status: 'idle',
    model: 'llama-4',
    icon: <Wrench className="h-4 w-4" />,
    color: 'text-pink-500',
    bgClass: 'bg-pink-500/10 border-pink-500/20',
    currentTask: null,
    description: 'Code quality improvements and technical debt',
  },
  {
    id: 'agent-9',
    name: 'Documentation',
    type: 'documentation',
    status: 'idle',
    model: 'claude-4-sonnet',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-cyan-500',
    bgClass: 'bg-cyan-500/10 border-cyan-500/20',
    currentTask: null,
    description: 'Auto-generated docs, README, API references',
  },
];

interface ActivityItem {
  id: string;
  type: 'agent_start' | 'agent_complete' | 'task_created' | 'execution_start' | 'execution_complete' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'agent_start',
    title: 'Frontend agent started',
    description: 'Working on dashboard layout component',
    timestamp: '2 min ago',
    icon: <Bot className="h-3.5 w-3.5" />,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
  },
  {
    id: 'act-2',
    type: 'execution_complete',
    title: 'Test suite passed',
    description: '61/61 tests passed in 4.2s — auth module',
    timestamp: '5 min ago',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'act-3',
    type: 'error',
    title: 'Security scan failed',
    description: '2 critical CVEs found in lodash@4.17.20',
    timestamp: '8 min ago',
    icon: <XCircle className="h-3.5 w-3.5" />,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
  },
  {
    id: 'act-4',
    type: 'agent_start',
    title: 'Planner agent started',
    description: 'Decomposing Sprint 14 user stories',
    timestamp: '12 min ago',
    icon: <Bot className="h-3.5 w-3.5" />,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  {
    id: 'act-5',
    type: 'execution_start',
    title: 'Build pipeline triggered',
    description: 'Running bun run build for staging deployment',
    timestamp: '15 min ago',
    icon: <Play className="h-3.5 w-3.5" />,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
  },
  {
    id: 'act-6',
    type: 'task_created',
    title: 'New task: API rate limiting',
    description: 'High priority — added to Sprint 14 backlog',
    timestamp: '18 min ago',
    icon: <GitBranch className="h-3.5 w-3.5" />,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
  },
  {
    id: 'act-7',
    type: 'agent_complete',
    title: 'Database agent completed',
    description: 'Migration #47 applied — added user_preferences table',
    timestamp: '25 min ago',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'act-8',
    type: 'info',
    title: 'System auto-scaled',
    description: 'Increased sandbox memory to 4GB for heavy workloads',
    timestamp: '32 min ago',
    icon: <Activity className="h-3.5 w-3.5" />,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/10',
  },
  {
    id: 'act-9',
    type: 'execution_complete',
    title: 'Lint passed with 0 errors',
    description: 'ESLint completed in 1.8s — 142 files checked',
    timestamp: '40 min ago',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    id: 'act-10',
    type: 'agent_start',
    title: 'DevOps agent started',
    description: 'Configuring Docker Compose for staging',
    timestamp: '45 min ago',
    icon: <Bot className="h-3.5 w-3.5" />,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
  },
  {
    id: 'act-11',
    type: 'task_created',
    title: 'New task: Dark mode support',
    description: 'Medium priority — assigned to Frontend agent',
    timestamp: '1 hr ago',
    icon: <GitBranch className="h-3.5 w-3.5" />,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-500/10',
  },
  {
    id: 'act-12',
    type: 'error',
    title: 'Sandbox timeout',
    description: 'Execution #208 timed out after 300s — auto-retrying',
    timestamp: '1 hr ago',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
];

const CHART_DATA = [
  { time: '00:00', success: 92, total: 100 },
  { time: '02:00', success: 88, total: 105 },
  { time: '04:00', success: 95, total: 98 },
  { time: '06:00', success: 91, total: 110 },
  { time: '08:00', success: 97, total: 120 },
  { time: '10:00', success: 94, total: 135 },
  { time: '12:00', success: 89, total: 128 },
  { time: '14:00', success: 96, total: 142 },
  { time: '16:00', success: 93, total: 130 },
  { time: '18:00', success: 98, total: 115 },
  { time: '20:00', success: 95, total: 108 },
  { time: '22:00', success: 97, total: 102 },
];

interface PipelineData {
  id: string;
  name: string;
  stages: string[];
  currentStage: number;
  progress: number;
  triggeredBy: string;
  startTime: string;
  status: 'running' | 'success' | 'failed';
}

const PIPELINES: PipelineData[] = [
  {
    id: 'pipe-1',
    name: 'Sprint 14 Full Deploy',
    stages: ['Plan', 'Build', 'Test', 'Lint', 'Security', 'Deploy'],
    currentStage: 3,
    progress: 55,
    triggeredBy: 'Planner Agent',
    startTime: '12 min ago',
    status: 'running',
  },
  {
    id: 'pipe-2',
    name: 'Auth Module Hotfix',
    stages: ['Build', 'Test', 'Deploy'],
    currentStage: 2,
    progress: 82,
    triggeredBy: 'Manual',
    startTime: '5 min ago',
    status: 'running',
  },
  {
    id: 'pipe-3',
    name: 'Database Migration #47',
    stages: ['Backup', 'Migrate', 'Verify', 'Seed'],
    currentStage: 4,
    progress: 100,
    triggeredBy: 'Database Agent',
    startTime: '28 min ago',
    status: 'success',
  },
  {
    id: 'pipe-4',
    name: 'Security Patch v2.1.3',
    stages: ['Scan', 'Patch', 'Test', 'Deploy'],
    currentStage: 2,
    progress: 38,
    triggeredBy: 'Security Agent',
    startTime: '8 min ago',
    status: 'failed',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getStatusConfig(status: AgentStatus) {
  switch (status) {
    case 'working':
      return {
        label: 'Working',
        dotClass: 'bg-emerald-500',
        pulseClass: 'animate-pulse',
        badgeVariant: 'default' as const,
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      };
    case 'completed':
      return {
        label: 'Completed',
        dotClass: 'bg-blue-500',
        pulseClass: '',
        badgeVariant: 'default' as const,
        badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
      };
    case 'error':
      return {
        label: 'Error',
        dotClass: 'bg-red-500',
        pulseClass: '',
        badgeVariant: 'destructive' as const,
        badgeClass: 'bg-red-500/15 text-red-400 border-red-500/25',
      };
    case 'idle':
    default:
      return {
        label: 'Idle',
        dotClass: 'bg-muted-foreground/40',
        pulseClass: '',
        badgeVariant: 'secondary' as const,
        badgeClass: 'bg-muted/50 text-muted-foreground border-muted-foreground/20',
      };
  }
}

function getPipelineStatusColor(status: PipelineData['status']) {
  switch (status) {
    case 'running':
      return 'bg-violet-500/15 text-violet-400 border-violet-500/25';
    case 'success':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case 'failed':
      return 'bg-red-500/15 text-red-400 border-red-500/25';
  }
}

function getPipelineProgressColor(status: PipelineData['status']) {
  switch (status) {
    case 'running':
      return '[&>div]:bg-violet-500';
    case 'success':
      return '[&>div]:bg-emerald-500';
    case 'failed':
      return '[&>div]:bg-red-500';
  }
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const statusCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ---------------------------------------------------------------------------
// Custom tooltip for chart
// ---------------------------------------------------------------------------

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-foreground" style={{ color: entry.color }}>
          {entry.dataKey === 'success' ? 'Success' : 'Total'}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardView() {
  const { systemStatus } = useAppStore();

  const activeAgents = AGENTS.filter((a) => a.status !== 'idle').length;
  const totalAgents = AGENTS.length;
  const runningTasks = AGENTS.filter((a) => a.status === 'working').length;

  const uptimeSeconds = systemStatus.uptime > 0 ? systemStatus.uptime : 86400 + 7384;

  const stats = useMemo(() => {
    const errors = AGENTS.filter((a) => a.status === 'error').length;
    const completed = AGENTS.filter((a) => a.status === 'completed').length;
    return { errors, completed };
  }, []);

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time overview of your autonomous engineering platform
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Activity className="h-3.5 w-3.5" />
          Live
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </Button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Section 1: System Status Cards Row                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Agents */}
        <motion.div variants={statusCardVariants}>
          <Card className="gap-4 py-5">
            <CardContent className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <Bot className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Active Agents
                </p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">
                  {activeAgents}
                  <span className="text-muted-foreground text-base font-normal">/{totalAgents}</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-emerald-500 text-xs font-medium">Online</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Running Tasks */}
        <motion.div variants={statusCardVariants}>
          <Card className="gap-4 py-5">
            <CardContent className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <Cpu className="h-5 w-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Running Tasks
                </p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">
                  {runningTasks}
                  <span className="text-muted-foreground text-base font-normal"> active</span>
                </p>
              </div>
              <div className="w-20">
                <Progress value={(runningTasks / totalAgents) * 100} className={cn('h-1.5 [&>div]:bg-violet-500')} />
                <p className="text-muted-foreground text-[10px] mt-1 text-right">
                  {Math.round((runningTasks / totalAgents) * 100)}% capacity
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sandbox Health */}
        <motion.div variants={statusCardVariants}>
          <Card className="gap-4 py-5">
            <CardContent className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <HardDrive className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Sandbox Health
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    stats.errors === 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  )}>
                    <span className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      stats.errors === 0 ? 'bg-emerald-500' : 'bg-amber-500'
                    )} />
                    {stats.errors === 0 ? 'Healthy' : `${stats.errors} Issues`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">4GB</p>
                <p className="text-xs text-muted-foreground">allocated</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Uptime */}
        <motion.div variants={statusCardVariants}>
          <Card className="gap-4 py-5">
            <CardContent className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                <Clock className="h-5 w-5 text-sky-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  System Uptime
                </p>
                <p className="text-2xl font-bold tracking-tight mt-0.5">
                  {formatUptime(uptimeSeconds)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-400 font-medium">99.8%</p>
                <p className="text-muted-foreground text-[10px]">availability</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Middle section: Agent Grid + Activity Feed + Chart               */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Agent Status Grid (spans 2 cols on xl) */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="gap-0">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Agent Status Grid</CardTitle>
                  <CardDescription>
                    {activeAgents} agents active &middot; {stats.completed} completed &middot; {stats.errors} with errors
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  <Bot className="h-3 w-3 mr-1" />
                  {totalAgents} registered
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {AGENTS.map((agent) => {
                    const statusCfg = getStatusConfig(agent.status);
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={cn(
                          'group relative rounded-xl border p-3.5 transition-colors hover:bg-accent/50',
                          agent.bgClass
                        )}
                      >
                        {/* Agent header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn('text-white text-xs font-bold', agent.bgClass, agent.color)}>
                                {agent.icon}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">{agent.name}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">
                                {agent.model}
                              </Badge>
                            </div>
                          </div>
                          <Badge variant={statusCfg.badgeVariant} className={cn('text-[10px] shrink-0 border', statusCfg.badgeClass)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full mr-1', statusCfg.dotClass, statusCfg.pulseClass)} />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* Current task */}
                        {agent.currentTask && (
                          <div className="mt-3 flex items-start gap-1.5">
                            <ArrowRight className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {agent.currentTask}
                            </p>
                          </div>
                        )}

                        {/* Description */}
                        <p className="text-[11px] text-muted-foreground/60 mt-2 truncate">
                          {agent.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants}>
          <Card className="gap-0 h-full flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Activity Feed</CardTitle>
                  <CardDescription>Real-time system events</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  {ACTIVITIES.length} events
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-1 min-h-0">
              <ScrollArea className="h-[420px] pr-3">
                <div className="relative flex flex-col">
                  {ACTIVITIES.map((activity, index) => (
                    <div key={activity.id} className="relative flex gap-3 pb-4">
                      {/* Timeline line */}
                      {index < ACTIVITIES.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                      )}
                      {/* Icon */}
                      <div className={cn('relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full', activity.iconBg)}>
                        <span className={activity.iconColor}>{activity.icon}</span>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-medium leading-tight">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bottom section: Quick Stats Chart + Active Pipelines             */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Quick Stats Chart (spans 3 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="gap-0">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Execution Success Rate</CardTitle>
                  <CardDescription>Successful executions vs total over 24h</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Success</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      dy={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      dx={-4}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#totalGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#successGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Pipelines (spans 2 cols) */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="gap-0 h-full flex flex-col">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Active Pipelines</CardTitle>
                  <CardDescription>Execution pipeline status</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  {PIPELINES.filter((p) => p.status === 'running').length} running
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
              {PIPELINES.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="rounded-lg border p-3.5 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold truncate">{pipeline.name}</p>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] shrink-0 border', getPipelineStatusColor(pipeline.status))}
                    >
                      {pipeline.status === 'running' && (
                        <span className="relative flex h-1.5 w-1.5 mr-1">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
                        </span>
                      )}
                      {pipeline.status}
                    </Badge>
                  </div>

                  {/* Stage indicators */}
                  <div className="flex items-center gap-1 mb-2.5">
                    {pipeline.stages.map((stage, idx) => {
                      const isComplete = idx < pipeline.currentStage;
                      const isCurrent = idx === pipeline.currentStage - 1;
                      const isFailed = pipeline.status === 'failed' && isCurrent;
                      return (
                        <React.Fragment key={stage}>
                          <div className="flex items-center gap-1">
                            <div className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                              isFailed
                                ? 'bg-red-500/20 text-red-400'
                                : isCurrent
                                  ? 'bg-violet-500/20 text-violet-400'
                                  : isComplete
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
                            )}>
                              {isComplete && !isFailed ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : isFailed ? (
                                <XCircle className="h-3 w-3" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span className={cn(
                              'text-[10px] hidden sm:inline',
                              isFailed
                                ? 'text-red-400 font-medium'
                                : isComplete
                                  ? 'text-emerald-400'
                                  : isCurrent
                                    ? 'text-violet-400 font-medium'
                                    : 'text-muted-foreground'
                            )}>
                              {stage}
                            </span>
                          </div>
                          {idx < pipeline.stages.length - 1 && (
                            <div className={cn(
                              'h-px flex-1 min-w-[8px]',
                              idx < pipeline.currentStage - 1
                                ? 'bg-emerald-500/40'
                                : 'bg-border'
                            )} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Progress bar + meta */}
                  <div className="flex items-center justify-between gap-3">
                    <Progress
                      value={pipeline.progress}
                      className={cn('h-1 flex-1', getPipelineProgressColor(pipeline.status))}
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {pipeline.progress}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-muted-foreground">
                      by {pipeline.triggeredBy}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{pipeline.startTime}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
