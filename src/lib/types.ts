// =============================================================================
// Voice-to-Website Platform Types
// =============================================================================

// Navigation
export type ViewType = 'builder' | 'preview' | 'projects' | 'templates' | 'design-library' | 'agents' | 'analytics' | 'settings';

// Storefront
export type StorefrontStatus = 'draft' | 'generating' | 'ready' | 'published' | 'error';
export type BusinessCategory =
  | 'bakery'
  | 'restaurant'
  | 'clothing'
  | 'electronics'
  | 'salon'
  | 'grocery'
  | 'hardware'
  | 'medical'
  | 'boutique'
  | 'service'
  | 'other';

export interface BusinessProfile {
  name: string;
  category: BusinessCategory;
  description: string;
  location: string;
  phone: string;
  email: string;
  hours: string;
  products: BusinessProduct[];
  services: BusinessService[];
  style: BrandStyle;
  features: string[];
}

export interface BusinessProduct {
  name: string;
  description: string;
  price: string;
  category: string;
  imagePrompt?: string;
}

export interface BusinessService {
  name: string;
  description: string;
  duration?: string;
  price?: string;
}

export interface BrandStyle {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  theme: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant';
  mood: string;
}

// Storefront (Generated Website)
export interface Storefront {
  id: string;
  name: string;
  businessName: string;
  category: BusinessCategory;
  status: StorefrontStatus;
  description: string;
  url: string;
  sections: StorefrontSection[];
  html: string;
  businessProfile: BusinessProfile | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  deploymentStatus: 'none' | 'deploying' | 'deployed' | 'failed';
  deploymentUrl: string | null;
}

export interface StorefrontSection {
  id: string;
  type: 'hero' | 'about' | 'products' | 'services' | 'testimonials' | 'contact' | 'gallery' | 'hours' | 'map' | 'footer' | 'cta' | 'team' | 'faq';
  title: string;
  content: string;
  order: number;
  visible: boolean;
  config: Record<string, unknown>;
}

// Generation
export type GenerationStatus = 'idle' | 'processing_voice' | 'understanding_business' | 'planning_structure' | 'generating_branding' | 'generating_content' | 'generating_sections' | 'assembling_pages' | 'validating' | 'repairing' | 'complete' | 'error';

export interface GenerationJob {
  id: string;
  storefrontId: string;
  status: GenerationStatus;
  currentStep: number;
  totalSteps: number;
  progress: number;
  message: string;
  startedAt: string;
  completedAt: string | null;
  voiceTranscript: string | null;
  businessProfile: BusinessProfile | null;
  logs: GenerationLog[];
}

export interface GenerationLog {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  agent: string;
  message: string;
  detail?: string;
}

// Templates
export interface Template {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  preview: string;
  sections: StorefrontSection[];
  style: BrandStyle;
  popular: boolean;
  featured: boolean;
  downloadCount: number;
}

// Analytics
export interface StorefrontAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  topPages: PageView[];
  dailyViews: DailyView[];
  deviceBreakdown: DeviceStat[];
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
}

export interface PageView {
  page: string;
  views: number;
  percentage: number;
}

export interface DailyView {
  date: string;
  views: number;
  visitors: number;
}

export interface DeviceStat {
  device: string;
  percentage: number;
  sessions: number;
}

// Agent System
export type AgentType = 'planner' | 'branding' | 'ui' | 'content' | 'product' | 'seo' | 'deployment' | 'debug' | 'repair';
export type AgentStatus = 'idle' | 'working' | 'error' | 'completed';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  icon: string;
  color: string;
  description: string;
  capabilities: string[];
}

// Chat / Conversational AI
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// Settings
export interface PlatformSettings {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  theme: 'light' | 'dark' | 'system';
  defaultStyle: BrandStyle;
  deploymentTarget: 'preview' | 'vercel' | 'cloudflare' | 'custom';
  customDomain: string | null;
  aiModel: string;
  language: string;
  notifications: boolean;
  analyticsEnabled: boolean;
  seoAutoGenerate: boolean;
}

// Voice
export interface VoiceSession {
  id: string;
  status: 'idle' | 'recording' | 'processing' | 'complete' | 'error';
  transcript: string;
  confidence: number;
  duration: number;
  language: string;
}

// Design Library
export type DesignComponentCategory =
  | 'hero'
  | 'navigation'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'about'
  | 'footer'
  | 'contact'
  | 'gallery'
  | 'themes';

export type DesignStyle = 'minimal' | 'bold' | 'dark' | 'gradient' | 'glass' | 'retro' | 'neomorphic' | 'brutalist';

export interface DesignComponent {
  id: string;
  name: string;
  description: string;
  category: DesignComponentCategory;
  style: DesignStyle;
  preview: string;
  html: string;
  css: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popular: boolean;
  featured: boolean;
  useCount: number;
}

export interface DesignTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
  };
  fontFamily: string;
  mood: string;
  style: DesignStyle;
  popular: boolean;
  useCount: number;
}
