import { create } from 'zustand';
import type {
  ViewType,
  Storefront,
  StorefrontStatus,
  GenerationJob,
  GenerationStatus,
  BusinessProfile,
  Template,
  StorefrontAnalytics,
  ChatMessage,
  Agent,
  PlatformSettings,
  BrandStyle,
  BusinessCategory,
} from '@/lib/types';

// =============================================================================
// App State Interface
// =============================================================================

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Storefronts / Projects
  storefronts: Storefront[];
  setStorefronts: (storefronts: Storefront[]) => void;
  addStorefront: (storefront: Storefront) => void;
  updateStorefront: (id: string, updates: Partial<Storefront>) => void;
  currentStorefront: Storefront | null;
  setCurrentStorefront: (storefront: Storefront | null) => void;

  // Generation
  currentJob: GenerationJob | null;
  setCurrentJob: (job: GenerationJob | null) => void;
  updateGenerationStatus: (status: GenerationStatus, message?: string, progress?: number) => void;
  addGenerationLog: (log: Omit<import('./types').GenerationLog, 'id' | 'timestamp'>) => void;
  isGenerating: boolean;

  // Business Profile (from voice/text input)
  businessProfile: BusinessProfile | null;
  setBusinessProfile: (profile: BusinessProfile | null) => void;

  // Templates
  templates: Template[];
  setTemplates: (templates: Template[]) => void;

  // Chat (conversational builder)
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  isChatLoading: boolean;
  setChatLoading: (loading: boolean) => void;

  // Preview
  previewDevice: 'mobile' | 'tablet' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void;
  previewMode: 'preview' | 'edit';
  setPreviewMode: (mode: 'preview' | 'edit') => void;

  // Analytics
  analytics: StorefrontAnalytics | null;
  setAnalytics: (analytics: StorefrontAnalytics | null) => void;

  // Settings
  settings: PlatformSettings;
  updateSettings: (updates: Partial<PlatformSettings>) => void;

  // Agents (for generation pipeline visualization)
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;

  // Voice
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  voiceTranscript: string;
  setVoiceTranscript: (transcript: string) => void;
}

// =============================================================================
// Default Settings
// =============================================================================

const defaultSettings: PlatformSettings = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  theme: 'system',
  defaultStyle: {
    primaryColor: '#7c3aed',
    secondaryColor: '#06b6d4',
    fontFamily: 'Inter',
    theme: 'modern',
    mood: 'professional',
  },
  deploymentTarget: 'preview',
  customDomain: null,
  aiModel: 'claude-4-sonnet',
  language: 'en',
  notifications: true,
  analyticsEnabled: true,
  seoAutoGenerate: true,
};

// =============================================================================
// Store
// =============================================================================

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: 'builder',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Storefronts
  storefronts: [],
  setStorefronts: (storefronts) => set({ storefronts }),
  addStorefront: (storefront) =>
    set((state) => ({ storefronts: [storefront, ...state.storefronts] })),
  updateStorefront: (id, updates) =>
    set((state) => ({
      storefronts: state.storefronts.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      currentStorefront:
        state.currentStorefront?.id === id
          ? { ...state.currentStorefront, ...updates }
          : state.currentStorefront,
    })),
  currentStorefront: null,
  setCurrentStorefront: (storefront) => set({ currentStorefront: storefront }),

  // Generation
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job, isGenerating: !!job }),
  updateGenerationStatus: (status, message, progress) =>
    set((state) => {
      if (!state.currentJob) return {};
      const updatedJob = {
        ...state.currentJob,
        status,
        ...(message !== undefined && { message }),
        ...(progress !== undefined && { progress }),
      };
      return {
        currentJob: updatedJob,
        isGenerating: status !== 'complete' && status !== 'error' && status !== 'idle',
      };
    }),
  addGenerationLog: (log) =>
    set((state) => {
      if (!state.currentJob) return {};
      return {
        currentJob: {
          ...state.currentJob,
          logs: [
            ...state.currentJob.logs,
            {
              ...log,
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
            },
          ],
        },
      };
    }),
  isGenerating: false,

  // Business Profile
  businessProfile: null,
  setBusinessProfile: (profile) => set({ businessProfile: profile }),

  // Templates
  templates: [],
  setTemplates: (templates) => set({ templates }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message].slice(-50),
    })),
  clearChat: () => set({ chatMessages: [] }),
  isChatLoading: false,
  setChatLoading: (loading) => set({ isChatLoading: loading }),

  // Preview
  previewDevice: 'desktop',
  setPreviewDevice: (device) => set({ previewDevice: device }),
  previewMode: 'preview',
  setPreviewMode: (mode) => set({ previewMode: mode }),

  // Analytics
  analytics: null,
  setAnalytics: (analytics) => set({ analytics }),

  // Settings
  settings: defaultSettings,
  updateSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  // Agents
  agents: [],
  setAgents: (agents) => set({ agents }),

  // Voice
  isRecording: false,
  setIsRecording: (recording) => set({ isRecording: recording }),
  voiceTranscript: '',
  setVoiceTranscript: (transcript) => set({ voiceTranscript: transcript }),
}));
