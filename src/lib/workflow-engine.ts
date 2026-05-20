// =============================================================================
// Deterministic Workflow Engine (DAG-based Pipeline Orchestration)
// =============================================================================
// Provides a Directed Acyclic Graph workflow execution engine with:
// - Topological sort for correct execution order
// - Conditional branching based on runtime context
// - Parallel execution of independent nodes within layers
// - State machine with abort/cancel support
// - Bounded retry with exponential backoff
// - Timeout enforcement per node
// - Event-driven progress tracking
// - Checkpoint snapshots for recovery
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowNode {
  id: string;
  name: string;
  agent: string;
  description: string;
  dependsOn: string[];
  condition?: (context: WorkflowContext) => boolean;
  execute: (context: WorkflowContext) => Promise<NodeResult>;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  parallel?: boolean;
}

export interface NodeResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  tokens?: { input: number; output: number };
}

export interface WorkflowContext {
  executionId: string;
  sessionId: string;
  storefrontId: string;
  businessProfile: Record<string, unknown>;
  voiceTranscript?: string;
  artifacts: Record<string, unknown>;
  status: WorkflowStatus;
  startedAt: number;
  nodeResults: Map<string, NodeResult>;
  nodeStatuses: Map<string, NodeStatus>;
  onProgress?: (event: WorkflowEvent) => void;
  onLog?: (log: WorkflowLog) => void;
}

export interface WorkflowEvent {
  executionId: string;
  type: 'node_started' | 'node_completed' | 'node_failed' | 'node_skipped' | 'workflow_completed' | 'workflow_failed';
  nodeId?: string;
  nodeName?: string;
  agent?: string;
  status?: NodeStatus | WorkflowStatus;
  progress?: number;
  message?: string;
  data?: Record<string, unknown>;
}

export interface WorkflowLog {
  id: string;
  timestamp: number;
  executionId: string;
  nodeId?: string;
  agent: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  detail?: string;
  durationMs?: number;
  tokens?: { input: number; output: number };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
}

export interface WorkflowCheckpoint {
  executionId: string;
  workflowId: string;
  status: WorkflowStatus;
  startedAt: number;
  completedAt?: number;
  nodeStatuses: Record<string, NodeStatus>;
  nodeResults: Record<string, NodeResult>;
  artifacts: Record<string, unknown>;
  currentStage: string;
  progress: number;
  totalNodes: number;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

function generateId(): string {
  return `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Detect execution layers: groups of nodes whose dependencies are all satisfied.
 * Nodes within a layer can run in parallel.
 */
function detectLayers(nodes: WorkflowNode[]): WorkflowNode[][] {
  const nodeIds = new Set(nodes.map(n => n.id));
  const completed = new Set<string>();
  const layers: WorkflowNode[][] = [];

  while (completed.size < nodes.length) {
    const layer = nodes.filter(node =>
      !completed.has(node.id) &&
      node.dependsOn.every(dep => completed.has(dep))
    );

    if (layer.length === 0) {
      throw new Error('Unresolvable workflow dependencies — possible cycle detected');
    }

    layers.push(layer);
    for (const node of layer) completed.add(node.id);
  }

  return layers;
}

// -----------------------------------------------------------------------------
// Workflow Engine
// -----------------------------------------------------------------------------

export class WorkflowEngine {
  private definitions = new Map<string, WorkflowDefinition>();
  private activeWorkflows = new Map<string, AbortController>();

  registerDefinition(definition: WorkflowDefinition): void {
    // Validate by detecting layers (throws on cycles)
    detectLayers(definition.nodes);
    this.definitions.set(definition.id, definition);
  }

  getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return this.definitions.get(workflowId);
  }

  async execute(
    workflowId: string,
    params: {
      sessionId: string;
      storefrontId: string;
      businessProfile: Record<string, unknown>;
      voiceTranscript?: string;
      onProgress?: (event: WorkflowEvent) => void;
      onLog?: (log: WorkflowLog) => void;
    },
  ): Promise<WorkflowCheckpoint> {
    const definition = this.definitions.get(workflowId);
    if (!definition) throw new Error(`Workflow not found: ${workflowId}`);

    const executionId = generateId();
    const abortController = new AbortController();
    this.activeWorkflows.set(executionId, abortController);

    const context: WorkflowContext = {
      executionId,
      sessionId: params.sessionId,
      storefrontId: params.storefrontId,
      businessProfile: params.businessProfile,
      voiceTranscript: params.voiceTranscript,
      artifacts: {},
      status: 'running',
      startedAt: Date.now(),
      nodeResults: new Map(),
      nodeStatuses: new Map(),
      onProgress: params.onProgress,
      onLog: params.onLog,
    };

    for (const node of definition.nodes) {
      context.nodeStatuses.set(node.id, 'pending');
    }

    const emit = (event: WorkflowEvent) => context.onProgress?.(event);

    const log = (
      level: WorkflowLog['level'], agent: string, message: string,
      detail?: string, durationMs?: number, tokens?: { input: number; output: number },
    ) => {
      context.onLog?.({
        id: generateLogId(), timestamp: Date.now(), executionId, agent, level, message, detail, durationMs, tokens,
      });
    };

    log('info', 'System', `Workflow "${definition.name}" started`, `Execution: ${executionId}`);

    try {
      const layers = detectLayers(definition.nodes);
      const totalNodes = definition.nodes.length;
      let completedNodes = 0;

      for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
        if (abortController.signal.aborted) {
          context.status = 'cancelled';
          break;
        }

        const layer = layers[layerIdx];

        // Execute nodes within a layer in parallel
        const results = await Promise.allSettled(
          layer.map(async (node) => {
            if (abortController.signal.aborted) {
              context.nodeStatuses.set(node.id, 'skipped');
              return null;
            }

            // Check condition guard
            if (node.condition && !node.condition(context)) {
              context.nodeStatuses.set(node.id, 'skipped');
              log('info', node.agent, `${node.name} skipped (condition not met)`);
              emit({
                executionId, type: 'node_skipped', nodeId: node.id, nodeName: node.name,
                agent: node.agent, status: 'skipped',
                progress: Math.round(((completedNodes + 1) / totalNodes) * 100),
              });
              return null;
            }

            return this.executeNode(node, context, abortController.signal);
          }),
        );

        for (let i = 0; i < results.length; i++) {
          const node = layer[i];
          const result = results[i];
          completedNodes++;

          if (result.status === 'fulfilled' && result.value !== null) {
            const nodeResult = result.value;
            context.nodeResults.set(node.id, nodeResult);
            context.nodeStatuses.set(node.id, nodeResult.success ? 'success' : 'failed');

            if (nodeResult.data) {
              for (const [key, value] of Object.entries(nodeResult.data)) {
                context.artifacts[node.id + '_' + key] = value;
              }
            }

            emit({
              executionId,
              type: nodeResult.success ? 'node_completed' : 'node_failed',
              nodeId: node.id, nodeName: node.name, agent: node.agent,
              status: nodeResult.success ? 'success' : 'failed',
              progress: Math.round((completedNodes / totalNodes) * 100),
              message: nodeResult.success ? `${node.name} completed` : `${node.name} failed: ${nodeResult.error}`,
              data: nodeResult.data,
            });

            if (!nodeResult.success) {
              context.status = 'failed';
              log('error', 'System', `Workflow failed at "${node.name}"`, nodeResult.error);
              return this.buildCheckpoint(context, definition);
            }
          } else if (result.status === 'fulfilled' && result.value === null) {
            // Node was skipped (condition not met)
          } else {
            // Promise rejected
            context.nodeStatuses.set(node.id, 'failed');
            context.nodeResults.set(node.id, {
              success: false, error: result.reason?.message || 'Unknown error', durationMs: 0,
            });
            emit({
              executionId, type: 'node_failed', nodeId: node.id, nodeName: node.name,
              agent: node.agent, status: 'failed',
              progress: Math.round((completedNodes / totalNodes) * 100),
              message: `${node.name} crashed: ${result.reason?.message}`,
            });
          }
        }
      }

      context.status = abortController.signal.aborted ? 'cancelled' : 'completed';
      log('success', 'System', `Workflow ${context.status}`, `Duration: ${((Date.now() - context.startedAt) / 1000).toFixed(1)}s`);
      emit({
        executionId, type: context.status === 'completed' ? 'workflow_completed' : 'workflow_failed',
        status: context.status, progress: 100,
        message: context.status === 'completed' ? 'Workflow completed successfully' : 'Workflow failed',
      });
    } catch (error) {
      context.status = 'failed';
      log('error', 'System', `Workflow crashed: ${String(error)}`);
    } finally {
      this.activeWorkflows.delete(executionId);
    }

    return this.buildCheckpoint(context, definition);
  }

  private async executeNode(
    node: WorkflowNode, context: WorkflowContext, signal: AbortSignal,
  ): Promise<NodeResult> {
    const maxRetries = node.maxRetries ?? 2;
    const baseDelay = node.retryDelayMs ?? 1000;
    const timeoutMs = node.timeoutMs ?? 60_000;

    context.nodeStatuses.set(node.id, 'running');
    context.onProgress?.({
      executionId: context.executionId, type: 'node_started', nodeId: node.id,
      nodeName: node.name, agent: node.agent, status: 'running', message: `Starting ${node.name}...`,
    });
    context.onLog?.({
      id: generateLogId(), timestamp: Date.now(), executionId: context.executionId,
      nodeId: node.id, agent: node.agent, level: 'info', message: `${node.name} started`,
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal.aborted) return { success: false, error: 'Workflow cancelled', durationMs: 0 };

      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        context.onLog?.({
          id: generateLogId(), timestamp: Date.now(), executionId: context.executionId,
          nodeId: node.id, agent: node.agent, level: 'warning',
          message: `Retrying ${node.name} (${attempt}/${maxRetries})`, detail: `Waiting ${delay}ms`,
        });
        await sleep(delay);
      }

      try {
        const startTime = Date.now();
        const result = await Promise.race([
          node.execute(context),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${node.name} timed out (${timeoutMs}ms)`)), timeoutMs),
          ),
        ]);
        const durationMs = Date.now() - startTime;

        context.onLog?.({
          id: generateLogId(), timestamp: Date.now(), executionId: context.executionId,
          nodeId: node.id, agent: node.agent, level: 'success',
          message: `${node.name} completed`, durationMs, tokens: result.tokens,
        });
        return { ...result, durationMs };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    context.onLog?.({
      id: generateLogId(), timestamp: Date.now(), executionId: context.executionId,
      nodeId: node.id, agent: node.agent, level: 'error',
      message: `${node.name} failed after ${maxRetries + 1} attempts`, detail: lastError?.message,
    });
    return { success: false, error: lastError?.message || 'Unknown error', durationMs: 0 };
  }

  cancel(executionId: string): boolean {
    const controller = this.activeWorkflows.get(executionId);
    if (controller) { controller.abort(); this.activeWorkflows.delete(executionId); return true; }
    return false;
  }

  private buildCheckpoint(context: WorkflowContext, definition: WorkflowDefinition): WorkflowCheckpoint {
    const nodeStatuses: Record<string, NodeStatus> = {};
    const nodeResults: Record<string, NodeResult> = {};
    context.nodeStatuses.forEach((s, id) => { nodeStatuses[id] = s; });
    context.nodeResults.forEach((r, id) => { nodeResults[id] = r; });

    const completedCount = Object.values(nodeStatuses).filter(s => s === 'success' || s === 'skipped').length;
    const currentStage = [...definition.nodes].reverse().find(n => context.nodeStatuses.get(n.id) === 'running')?.id || 'complete';

    return {
      executionId: context.executionId, workflowId: definition.id, status: context.status,
      startedAt: context.startedAt, completedAt: context.status !== 'running' ? Date.now() : undefined,
      nodeStatuses, nodeResults, artifacts: { ...context.artifacts },
      currentStage, progress: Math.round((completedCount / definition.nodes.length) * 100),
      totalNodes: definition.nodes.length,
    };
  }
}

// -----------------------------------------------------------------------------
// Default Website Generation Workflow Definition
// -----------------------------------------------------------------------------

export function createWebsiteGenerationWorkflow(): WorkflowDefinition {
  return {
    id: 'website-generation',
    name: 'StoreCraft Website Generation',
    description: '9-stage pipeline: voice → business understanding → planning → branding → content → sections → assembly → validation → repair',
    nodes: [
      {
        id: 'voice_analysis', name: 'Processing Voice', agent: 'Voice Processor',
        description: 'Transcribe and analyze voice input',
        dependsOn: [],
        condition: (ctx) => !!ctx.voiceTranscript && ctx.voiceTranscript.trim().length > 0,
        parallel: false, timeoutMs: 30_000, maxRetries: 1,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'business_understanding', name: 'Understanding Business', agent: 'Business Analyzer',
        description: 'Analyze business profile and extract entities',
        dependsOn: ['voice_analysis'],
        parallel: false, timeoutMs: 30_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'structure_planning', name: 'Planning Structure', agent: 'Planner',
        description: 'Plan optimal website page structure',
        dependsOn: ['business_understanding'],
        parallel: false, timeoutMs: 30_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'branding_generation', name: 'Generating Branding', agent: 'Branding Agent',
        description: 'Create brand identity, colors, typography',
        dependsOn: ['business_understanding'],
        parallel: true, timeoutMs: 30_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'content_generation', name: 'Writing Content', agent: 'Content Agent',
        description: 'Generate website copy, headlines, descriptions',
        dependsOn: ['structure_planning', 'branding_generation'],
        parallel: false, timeoutMs: 30_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'section_generation', name: 'Building Sections', agent: 'UI Agent',
        description: 'Generate responsive HTML sections',
        dependsOn: ['content_generation', 'branding_generation'],
        parallel: false, timeoutMs: 60_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'page_assembly', name: 'Assembling Pages', agent: 'Assembler',
        description: 'Compile sections into a complete storefront',
        dependsOn: ['section_generation'],
        parallel: false, timeoutMs: 90_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'validation', name: 'Validating', agent: 'Debug Agent',
        description: 'Check HTML validity, SEO, responsiveness, accessibility',
        dependsOn: ['page_assembly'],
        parallel: false, timeoutMs: 30_000,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
      {
        id: 'repair', name: 'Auto-Repair', agent: 'Repair Agent',
        description: 'Fix validation issues and regenerate problematic sections',
        dependsOn: ['validation'],
        condition: (ctx) => { const r = ctx.nodeResults.get('validation'); return !r?.success; },
        parallel: false, timeoutMs: 60_000, maxRetries: 2,
        execute: async () => ({ success: true, data: {}, durationMs: 0 }),
      },
    ],
  };
}

let _engine: WorkflowEngine | null = null;
export function getWorkflowEngine(): WorkflowEngine {
  if (!_engine) {
    _engine = new WorkflowEngine();
    _engine.registerDefinition(createWebsiteGenerationWorkflow());
  }
  return _engine;
}
