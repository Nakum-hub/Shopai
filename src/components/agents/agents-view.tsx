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
  Zap,
  Code,
  Cpu,
  Database,
  Container,
  Shield,
  Search,
  Wrench,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Settings,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Workflow,
  Layers,
  Plus,
  MoreVertical,
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
  | 'planner'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'devops'
  | 'security'
  | 'testing'
  | 'refactor'
  | 'documentation';

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
  planner: {
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  frontend: {
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  backend: {
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  database: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  devops: {
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  security: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  testing: {
    color: 'text-teal-500',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  refactor: {
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  documentation: {
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
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
    name: 'Planner',
    type: 'planner',
    status: 'working',
    model: 'claude-4-opus',
    icon: <Zap className="h-4 w-4" />,
    color: AGENT_COLORS.planner.color,
    bgColor: AGENT_COLORS.planner.bg,
    borderColor: AGENT_COLORS.planner.border,
    capabilities: ['Task Decomposition', 'Dependency Analysis', 'Agent Routing', 'Priority Assignment'],
    description:
      'Orchestrates task decomposition and intelligent agent delegation. Analyzes user requirements, breaks them into actionable tasks, identifies dependencies, and routes work to the most suitable agents. Maintains a global view of project progress.',
    tasksCompleted: 247,
    tasksFailed: 12,
    successRate: 95.3,
    avgResponseTime: '1.2s',
    temperature: 0.3,
    maxTokens: 8192,
    recentExecutions: [
      { id: 'e1', status: 'success', command: 'decompose --story "Auth module redesign"', duration: '3.4s', timestamp: '2 min ago' },
      { id: 'e2', status: 'success', command: 'route --task "API schema migration"', duration: '1.1s', timestamp: '15 min ago' },
      { id: 'e3', status: 'failed', command: 'analyze --deps "Sprint 14"', duration: '8.2s', timestamp: '32 min ago' },
      { id: 'e4', status: 'success', command: 'plan --feature "Dark mode support"', duration: '4.7s', timestamp: '1 hr ago' },
      { id: 'e5', status: 'success', command: 'prioritize --backlog --weight', duration: '2.0s', timestamp: '2 hr ago' },
    ],
  },
  {
    id: 'agent-2',
    name: 'Frontend',
    type: 'frontend',
    status: 'working',
    model: 'claude-4-sonnet',
    icon: <Code className="h-4 w-4" />,
    color: AGENT_COLORS.frontend.color,
    bgColor: AGENT_COLORS.frontend.bg,
    borderColor: AGENT_COLORS.frontend.border,
    capabilities: ['React/Next.js', 'Component Design', 'Tailwind CSS', 'Responsive Layout'],
    description:
      'Specializes in building performant, accessible UI components and pages. Expert in React patterns, Tailwind CSS styling, responsive design, and component architecture. Follows shadcn/ui conventions and accessibility best practices.',
    tasksCompleted: 389,
    tasksFailed: 18,
    successRate: 95.6,
    avgResponseTime: '2.8s',
    temperature: 0.2,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e6', status: 'running', command: 'build --component DashboardLayout', duration: '12.3s', timestamp: 'Just now' },
      { id: 'e7', status: 'success', command: 'style --refactor UserCard dark-mode', duration: '5.1s', timestamp: '8 min ago' },
      { id: 'e8', status: 'success', command: 'create --page /settings/profile', duration: '18.4s', timestamp: '25 min ago' },
      { id: 'e9', status: 'failed', command: 'fix --animation sidebar-transition', duration: '6.7s', timestamp: '1 hr ago' },
      { id: 'e10', status: 'success', command: 'test --visual regression home', duration: '22.0s', timestamp: '1.5 hr ago' },
    ],
  },
  {
    id: 'agent-3',
    name: 'Backend',
    type: 'backend',
    status: 'idle',
    model: 'gpt-5',
    icon: <Cpu className="h-4 w-4" />,
    color: AGENT_COLORS.backend.color,
    bgColor: AGENT_COLORS.backend.bg,
    borderColor: AGENT_COLORS.backend.border,
    capabilities: ['API Routes', 'Business Logic', 'Authentication', 'Data Validation'],
    description:
      'Handles server-side development including API route implementation, middleware, authentication flows, and complex business logic. Optimizes for performance, type safety, and maintainability using modern TypeScript patterns.',
    tasksCompleted: 312,
    tasksFailed: 22,
    successRate: 93.4,
    avgResponseTime: '3.1s',
    temperature: 0.2,
    maxTokens: 6144,
    recentExecutions: [
      { id: 'e11', status: 'success', command: 'create --route POST /api/projects', duration: '8.9s', timestamp: '20 min ago' },
      { id: 'e12', status: 'success', command: 'implement --auth JWT-refresh-flow', duration: '14.2s', timestamp: '45 min ago' },
      { id: 'e13', status: 'success', command: 'optimize --query agent-executions', duration: '6.3s', timestamp: '1.5 hr ago' },
      { id: 'e14', status: 'failed', command: 'fix --race-condition /api/tasks', duration: '11.0s', timestamp: '2 hr ago' },
      { id: 'e15', status: 'success', command: 'validate --schema user-input', duration: '3.4s', timestamp: '3 hr ago' },
    ],
  },
  {
    id: 'agent-4',
    name: 'Database',
    type: 'database',
    status: 'completed',
    model: 'claude-4-sonnet',
    icon: <Database className="h-4 w-4" />,
    color: AGENT_COLORS.database.color,
    bgColor: AGENT_COLORS.database.bg,
    borderColor: AGENT_COLORS.database.border,
    capabilities: ['Schema Design', 'Migrations', 'Query Optimization', 'Seeding'],
    description:
      'Expert in database schema design, migration management, and query performance optimization. Works with Prisma ORM and SQLite to ensure data integrity, proper indexing, and efficient queries across all data operations.',
    tasksCompleted: 156,
    tasksFailed: 5,
    successRate: 96.9,
    avgResponseTime: '2.1s',
    temperature: 0.1,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e16', status: 'success', command: 'migrate --apply #47 user_preferences', duration: '4.2s', timestamp: '5 min ago' },
      { id: 'e17', status: 'success', command: 'seed --fixtures development', duration: '7.8s', timestamp: '30 min ago' },
      { id: 'e18', status: 'success', command: 'optimize --index executions-table', duration: '2.9s', timestamp: '1 hr ago' },
      { id: 'e19', status: 'success', command: 'design --schema agent-config', duration: '5.5s', timestamp: '2 hr ago' },
      { id: 'e20', status: 'failed', command: 'rollback --migration #46', duration: '1.1s', timestamp: '3 hr ago' },
    ],
  },
  {
    id: 'agent-5',
    name: 'DevOps',
    type: 'devops',
    status: 'working',
    model: 'deepseek-v3',
    icon: <Container className="h-4 w-4" />,
    color: AGENT_COLORS.devops.color,
    bgColor: AGENT_COLORS.devops.bg,
    borderColor: AGENT_COLORS.devops.border,
    capabilities: ['CI/CD', 'Docker', 'Monitoring', 'Deployment'],
    description:
      'Manages infrastructure, deployment pipelines, and system monitoring. Configures Docker containers, CI/CD workflows, environment variables, and ensures smooth deployments across staging and production environments.',
    tasksCompleted: 198,
    tasksFailed: 14,
    successRate: 93.4,
    avgResponseTime: '4.2s',
    temperature: 0.2,
    maxTokens: 6144,
    recentExecutions: [
      { id: 'e21', status: 'running', command: 'deploy --env staging --build', duration: '45.0s', timestamp: 'Just now' },
      { id: 'e22', status: 'success', command: 'configure --docker compose staging', duration: '12.3s', timestamp: '10 min ago' },
      { id: 'e23', status: 'success', command: 'setup --ci github-actions', duration: '18.7s', timestamp: '1 hr ago' },
      { id: 'e24', status: 'failed', command: 'monitor --alert cpu-threshold', duration: '2.1s', timestamp: '2 hr ago' },
      { id: 'e25', status: 'success', command: 'scale --service sandbox +2', duration: '8.4s', timestamp: '3 hr ago' },
    ],
  },
  {
    id: 'agent-6',
    name: 'Security',
    type: 'security',
    status: 'error',
    model: 'claude-4-opus',
    icon: <Shield className="h-4 w-4" />,
    color: AGENT_COLORS.security.color,
    bgColor: AGENT_COLORS.security.bg,
    borderColor: AGENT_COLORS.security.border,
    capabilities: ['Code Audit', 'Vulnerability Scan', 'Auth Flows', 'Compliance'],
    description:
      'Performs comprehensive security audits, vulnerability scanning, and implements secure authentication flows. Ensures code compliance with OWASP standards and reviews dependency chains for known CVEs.',
    tasksCompleted: 134,
    tasksFailed: 8,
    successRate: 94.4,
    avgResponseTime: '5.6s',
    temperature: 0.1,
    maxTokens: 8192,
    recentExecutions: [
      { id: 'e26', status: 'failed', command: 'scan --cve --fix lodash@4.17.20', duration: '15.3s', timestamp: '3 min ago' },
      { id: 'e27', status: 'success', command: 'audit --auth-flow JWT-refresh', duration: '8.9s', timestamp: '20 min ago' },
      { id: 'e28', status: 'success', command: 'check --headers CSP-CORS', duration: '2.1s', timestamp: '45 min ago' },
      { id: 'e29', status: 'success', command: 'review --pr #312 security-patch', duration: '11.4s', timestamp: '1.5 hr ago' },
      { id: 'e30', status: 'failed', command: 'scan --dependency full-tree', duration: '22.1s', timestamp: '2 hr ago' },
    ],
  },
  {
    id: 'agent-7',
    name: 'Testing',
    type: 'testing',
    status: 'working',
    model: 'gemini-2.5-flash',
    icon: <Search className="h-4 w-4" />,
    color: AGENT_COLORS.testing.color,
    bgColor: AGENT_COLORS.testing.bg,
    borderColor: AGENT_COLORS.testing.border,
    capabilities: ['Unit Tests', 'Integration', 'E2E Coverage', 'Visual Regression'],
    description:
      'Generates and executes comprehensive test suites including unit tests, integration tests, E2E tests, and visual regression tests. Analyzes code coverage reports and suggests improvements to reach target thresholds.',
    tasksCompleted: 421,
    tasksFailed: 27,
    successRate: 93.9,
    avgResponseTime: '6.8s',
    temperature: 0.15,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e31', status: 'running', command: 'test --integration auth-module', duration: '34.0s', timestamp: 'Just now' },
      { id: 'e32', status: 'success', command: 'test --unit utils/format', duration: '4.2s', timestamp: '5 min ago' },
      { id: 'e33', status: 'success', command: 'coverage --report --target 90%', duration: '18.9s', timestamp: '15 min ago' },
      { id: 'e34', status: 'failed', command: 'test --e2e login-flow', duration: '42.3s', timestamp: '30 min ago' },
      { id: 'e35', status: 'success', command: 'generate --unit AgentService', duration: '7.6s', timestamp: '1 hr ago' },
    ],
  },
  {
    id: 'agent-8',
    name: 'Refactor',
    type: 'refactor',
    status: 'idle',
    model: 'llama-4',
    icon: <Wrench className="h-4 w-4" />,
    color: AGENT_COLORS.refactor.color,
    bgColor: AGENT_COLORS.refactor.bg,
    borderColor: AGENT_COLORS.refactor.border,
    capabilities: ['Code Quality', 'Tech Debt', 'Performance', 'Patterns'],
    description:
      'Identifies and resolves technical debt, improves code quality, and applies modern design patterns. Refactors legacy code, optimizes performance bottlenecks, and ensures adherence to project coding standards.',
    tasksCompleted: 89,
    tasksFailed: 6,
    successRate: 93.7,
    avgResponseTime: '3.4s',
    temperature: 0.2,
    maxTokens: 6144,
    recentExecutions: [
      { id: 'e36', status: 'success', command: 'refactor --pattern extract-component DashboardGrid', duration: '12.3s', timestamp: '25 min ago' },
      { id: 'e37', status: 'success', command: 'optimize --perf render-loop AgentCard', duration: '8.7s', timestamp: '1 hr ago' },
      { id: 'e38', status: 'success', command: 'clean --unused-imports src/', duration: '2.1s', timestamp: '2 hr ago' },
      { id: 'e39', status: 'failed', command: 'refactor --extract-hook useAgentState', duration: '15.4s', timestamp: '3 hr ago' },
      { id: 'e40', status: 'success', command: 'analyze --complexity src/services/', duration: '5.2s', timestamp: '4 hr ago' },
    ],
  },
  {
    id: 'agent-9',
    name: 'Documentation',
    type: 'documentation',
    status: 'idle',
    model: 'claude-4-sonnet',
    icon: <FileText className="h-4 w-4" />,
    color: AGENT_COLORS.documentation.color,
    bgColor: AGENT_COLORS.documentation.bg,
    borderColor: AGENT_COLORS.documentation.border,
    capabilities: ['README', 'API Docs', 'Code Comments', 'Guides'],
    description:
      'Auto-generates comprehensive documentation including READMEs, API references, inline code comments, and developer guides. Maintains consistency across documentation and ensures all public APIs are well-documented.',
    tasksCompleted: 167,
    tasksFailed: 3,
    successRate: 98.2,
    avgResponseTime: '2.5s',
    temperature: 0.3,
    maxTokens: 4096,
    recentExecutions: [
      { id: 'e41', status: 'success', command: 'generate --api-docs /api/routes', duration: '8.9s', timestamp: '40 min ago' },
      { id: 'e42', status: 'success', command: 'update --readme installation-guide', duration: '4.3s', timestamp: '1.5 hr ago' },
      { id: 'e43', status: 'success', command: 'comment --src/components/ dashboard', duration: '6.7s', timestamp: '2 hr ago' },
      { id: 'e44', status: 'success', command: 'create --guide getting-started', duration: '11.2s', timestamp: '4 hr ago' },
      { id: 'e45', status: 'failed', command: 'validate --docs --strict', duration: '3.1s', timestamp: '5 hr ago' },
    ],
  },
];

const ORCHESTRATION_GRAPH = [
  { id: 'frontend', name: 'Frontend', icon: <Code className="h-3.5 w-3.5" />, active: true },
  { id: 'backend', name: 'Backend', icon: <Cpu className="h-3.5 w-3.5" />, active: false },
  { id: 'database', name: 'Database', icon: <Database className="h-3.5 w-3.5" />, active: true },
  { id: 'devops', name: 'DevOps', icon: <Container className="h-3.5 w-3.5" />, active: true },
  { id: 'security', name: 'Security', icon: <Shield className="h-3.5 w-3.5" />, active: true },
  { id: 'testing', name: 'Testing', icon: <Search className="h-3.5 w-3.5" />, active: true },
  { id: 'refactor', name: 'Refactor', icon: <Wrench className="h-3.5 w-3.5" />, active: false },
  { id: 'documentation', name: 'Docs', icon: <FileText className="h-3.5 w-3.5" />, active: false },
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
            Manage and monitor your autonomous AI agent fleet
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-3.5 w-3.5" />
          Add Agent
        </Button>
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
                  &middot; {summaryStats.totalCompleted.toLocaleString()} tasks completed
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                Tasks
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
                  Visual representation of agent interaction flow and data routing
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
              <div className="min-w-[700px] mx-auto">
                {/* Row 1: User → Planner */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  {/* User Request */}
                  <div className="flex items-center justify-center w-28 h-14 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        User Request
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-24 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={0} />
                  </div>

                  {/* Planner */}
                  <div className="flex items-center justify-center w-32 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                    <div className="flex flex-col items-center gap-0.5">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-500">
                        Planner
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-24 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={0.5} />
                  </div>

                  {/* Agent Cluster */}
                  <div className="flex items-center justify-center w-32 h-14 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        Agent Fleet
                      </span>
                    </div>
                  </div>

                  {/* Connector with animated dot */}
                  <div className="relative w-24 h-0.5 bg-primary/20 overflow-hidden">
                    <DataFlowDot delay={1.0} />
                  </div>

                  {/* Validated Output */}
                  <div className="flex items-center justify-center w-28 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-500">
                        Validated Output
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
                <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
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
                      <Cpu className="h-2.5 w-2.5 mr-1" />
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
                        Tasks Completed
                      </p>
                      <p className="text-2xl font-bold mt-1 text-emerald-500">
                        {selectedAgent.tasksCompleted}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Tasks Failed
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
                      Task Outcomes
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
                          AI model used for inference
                        </p>
                      </div>
                      <Select defaultValue={selectedAgent.model}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-4-opus">claude-4-opus</SelectItem>
                          <SelectItem value="claude-4-sonnet">claude-4-sonnet</SelectItem>
                          <SelectItem value="gpt-5">gpt-5</SelectItem>
                          <SelectItem value="deepseek-v3">deepseek-v3</SelectItem>
                          <SelectItem value="gemini-2.5-flash">gemini-2.5-flash</SelectItem>
                          <SelectItem value="llama-4">llama-4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Temperature */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Temperature</p>
                        <p className="text-[10px] text-muted-foreground">
                          Controls randomness in generation
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
                          Maximum response length
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
