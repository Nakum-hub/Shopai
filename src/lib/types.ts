// Agent Types
export type AgentType = 'planner' | 'frontend' | 'backend' | 'database' | 'devops' | 'security' | 'testing' | 'refactor' | 'documentation';
export type AgentStatus = 'idle' | 'working' | 'error' | 'completed';
export type AgentModel = 'claude-4-opus' | 'claude-4-sonnet' | 'gpt-5' | 'deepseek-v3' | 'gemini-2.5-flash' | 'llama-4';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  model: AgentModel;
  description: string | null;
  capabilities: string[];
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  executions?: Execution[];
}

export interface AgentConfig {
  id?: string;
  name: string;
  type: AgentType;
  model: AgentModel;
  description: string;
  capabilities: string[];
}

// Task Types
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'test' | 'deploy' | 'documentation';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  agentId: string | null;
  projectId: string;
  parentId: string | null;
  order: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
  children?: Task[];
  executions?: Execution[];
}

// Execution Types
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout';
export type ExecutionType = 'build' | 'test' | 'deploy' | 'lint' | 'custom';

export interface Execution {
  id: string;
  status: ExecutionStatus;
  type: ExecutionType;
  command: string | null;
  output: string | null;
  error: string | null;
  duration: number | null;
  sandbox: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  agentId: string | null;
  projectId: string;
  taskId: string | null;
  agent?: Agent;
  task?: Task;
}

// Project Types
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  framework: string;
  stack: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  executions?: Execution[];
  memories?: Memory[];
}

// Memory Types
export type MemoryType = 'file' | 'vector' | 'graph' | 'session';

export interface Memory {
  id: string;
  type: MemoryType;
  key: string;
  value: string;
  projectId: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

// Activity Types
export type ActivityType = 'agent_start' | 'agent_complete' | 'task_created' | 'execution_start' | 'execution_complete' | 'error' | 'info';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// Navigation
export type ViewType = 'dashboard' | 'workspace' | 'agents' | 'projects' | 'sandbox' | 'memory' | 'settings';

// Workspace
export interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: WorkspaceFile[];
}

export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  timestamp: number;
}

// Socket Events
export interface SocketEvents {
  'agent:update': (data: { agentId: string; status: AgentStatus; progress?: number }) => void;
  'task:update': (data: { taskId: string; status: TaskStatus }) => void;
  'execution:log': (data: { executionId: string; line: string; type: 'stdout' | 'stderr' }) => void;
  'execution:complete': (data: { executionId: string; status: ExecutionStatus; duration: number }) => void;
  'activity:new': (data: Activity) => void;
  'system:status': (data: { cpu: number; memory: number; agents: number }) => void;
}
