import { create } from 'zustand';
import type { ViewType, Agent, Project, Task, Execution, Activity, TerminalLine, WorkspaceFile } from '@/lib/types';

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Projects
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;

  // Agents
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  // Executions
  executions: Execution[];
  setExecutions: (executions: Execution[]) => void;
  currentExecution: Execution | null;
  setCurrentExecution: (execution: Execution | null) => void;

  // Activity
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  setActivities: (activities: Activity[]) => void;

  // Workspace
  workspaceFiles: WorkspaceFile[];
  setWorkspaceFiles: (files: WorkspaceFile[]) => void;
  openFiles: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  openFile: (file: WorkspaceFile) => void;
  closeFile: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;

  // Terminal
  terminalLines: TerminalLine[];
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  terminalInput: string;
  setTerminalInput: (input: string) => void;

  // Memory
  memoryItems: number;
  setMemoryItems: (count: number) => void;

  // System
  systemStatus: {
    cpu: number;
    memory: number;
    disk: number;
    agents: number;
    tasks: number;
    uptime: number;
  };
  setSystemStatus: (status: Partial<AppState['systemStatus']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Projects
  projects: [],
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),

  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),
  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),

  // Executions
  executions: [],
  setExecutions: (executions) => set({ executions }),
  currentExecution: null,
  setCurrentExecution: (execution) => set({ currentExecution: execution }),

  // Activity
  activities: [],
  addActivity: (activity) =>
    set((state) => ({ activities: [activity, ...state.activities].slice(0, 100) })),
  setActivities: (activities) => set({ activities }),

  // Workspace
  workspaceFiles: [],
  setWorkspaceFiles: (files) => set({ workspaceFiles: files }),
  openFiles: [],
  activeFile: null,
  openFile: (file) =>
    set((state) => {
      const exists = state.openFiles.find((f) => f.path === file.path);
      const newOpenFiles = exists ? state.openFiles : [...state.openFiles, file];
      return { openFiles: newOpenFiles, activeFile: file };
    }),
  closeFile: (path) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
      const newActiveFile =
        state.activeFile?.path === path
          ? newOpenFiles[newOpenFiles.length - 1] || null
          : state.activeFile;
      return { openFiles: newOpenFiles, activeFile: newActiveFile };
    }),
  fileContents: {},
  setFileContent: (path, content) =>
    set((state) => ({
      fileContents: { ...state.fileContents, [path]: content },
    })),

  // Terminal
  terminalLines: [],
  addTerminalLine: (line) =>
    set((state) => ({ terminalLines: [...state.terminalLines, line] })),
  clearTerminal: () => set({ terminalLines: [] }),
  terminalInput: '',
  setTerminalInput: (input) => set({ terminalInput: input }),

  // Memory
  memoryItems: 0,
  setMemoryItems: (count) => set({ memoryItems: count }),

  // System
  systemStatus: {
    cpu: 0,
    memory: 0,
    disk: 0,
    agents: 0,
    tasks: 0,
    uptime: 0,
  },
  setSystemStatus: (status) =>
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...status },
    })),
}));
