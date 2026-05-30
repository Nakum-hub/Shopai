'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGenerationWs } from '@/hooks/use-generation-ws';
import { useAppStore } from '@/store/app-store';
import { allTemplates as localTemplates } from '@/data/templates';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import type {
  ChatMessage,
  BusinessProfile,
  GenerationJob,
  GenerationStatus,
  GenerationLog,
  BusinessCategory,
  Storefront,
  BrandStyle,
  DesignBlock,
  Template,
} from '@/lib/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

import {
  Mic,
  Send,
  Sparkles,
  Store,
  MapPin,
  Clock,
  Palette,
  Package,
  Wrench,
  MessageSquare,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  Brain,
  Code2,
  ShieldCheck,
  Rocket,
  Eye,
  FileText,
  LayoutGrid,
  Paintbrush,
  Layers,
  Zap,
  ArrowRight,
  RotateCcw,
  Terminal,
  Volume2,
  StopCircle,
  Lightbulb,
  Star,
  Building2,
  ShoppingBag,
  Scissors,
  Stethoscope,
  Hammer,
  Apple,
  MonitorSmartphone,
} from 'lucide-react';

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_ICONS: Record<BusinessCategory, React.ReactNode> = {
  bakery: <Apple className="h-4 w-4" />,
  restaurant: <ShoppingBag className="h-4 w-4" />,
  clothing: <Scissors className="h-4 w-4" />,
  electronics: <MonitorSmartphone className="h-4 w-4" />,
  salon: <Scissors className="h-4 w-4" />,
  grocery: <ShoppingBag className="h-4 w-4" />,
  hardware: <Hammer className="h-4 w-4" />,
  medical: <Stethoscope className="h-4 w-4" />,
  boutique: <Star className="h-4 w-4" />,
  service: <Wrench className="h-4 w-4" />,
  other: <Building2 className="h-4 w-4" />,
};

const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  bakery: 'Bakery & Café',
  restaurant: 'Restaurant',
  clothing: 'Clothing Store',
  electronics: 'Electronics',
  salon: 'Beauty Salon',
  grocery: 'Grocery Store',
  hardware: 'Hardware Store',
  medical: 'Medical Practice',
  boutique: 'Boutique',
  service: 'Professional Service',
  other: 'Business',
};

const EXAMPLE_PROMPTS = [
  {
    icon: <Apple className="h-5 w-5" />,
    title: 'Artisan Bakery',
    description: '"I own a bakery in Bangalore called The Flour Garden. We specialize in sourdough bread, custom cakes, and artisan pastries. Open 7AM to 9PM, located on Church Street."',
    category: 'bakery' as BusinessCategory,
  },
  {
    icon: <Scissors className="h-5 w-5" />,
    title: 'Fashion Boutique',
    description: '"We run a women\'s clothing boutique in Mumbai called Thread & Needle. Handcrafted ethnic wear and fusion fashion, price range ₹2,000 to ₹15,000."',
    category: 'clothing' as BusinessCategory,
  },
  {
    icon: <Stethoscope className="h-5 w-5" />,
    title: 'Dental Clinic',
    description: '"I\'m Dr. Sharma, I run a dental clinic in Pune. We offer general dentistry, orthodontics, and cosmetic procedures. Open Mon-Sat 9AM to 7PM."',
    category: 'medical' as BusinessCategory,
  },
  {
    icon: <ShoppingBag className="h-5 w-5" />,
    title: 'Cloud Kitchen',
    description: '"We run a cloud kitchen called Spice Route in Delhi NCR. Multi-cuisine delivery, specializing in biryanis and tandoori items. Average order value ₹500."',
    category: 'restaurant' as BusinessCategory,
  },
];

interface PipelineStep {
  id: GenerationStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'processing_voice',
    label: 'Processing Voice',
    icon: <Volume2 className="h-4 w-4" />,
    description: 'Transcribing and analyzing audio input',
  },
  {
    id: 'understanding_business',
    label: 'Understanding Business',
    icon: <Brain className="h-4 w-4" />,
    description: 'Extracting business context and requirements',
  },
  {
    id: 'planning_structure',
    label: 'Planning Structure',
    icon: <LayoutGrid className="h-4 w-4" />,
    description: 'Designing site architecture and sections',
  },
  {
    id: 'generating_branding',
    label: 'Generating Branding',
    icon: <Paintbrush className="h-4 w-4" />,
    description: 'Creating color palette and visual identity',
  },
  {
    id: 'generating_content',
    label: 'Creating Content',
    icon: <FileText className="h-4 w-4" />,
    description: 'Writing copy, headlines, and descriptions',
  },
  {
    id: 'generating_sections',
    label: 'Building Sections',
    icon: <Layers className="h-4 w-4" />,
    description: 'Generating hero, about, products, and more',
  },
  {
    id: 'assembling_pages',
    label: 'Assembling Pages',
    icon: <Code2 className="h-4 w-4" />,
    description: 'Compiling sections into responsive HTML',
  },
  {
    id: 'validating',
    label: 'Validating',
    icon: <ShieldCheck className="h-4 w-4" />,
    description: 'Checking accessibility, SEO, and performance',
  },
  {
    id: 'complete',
    label: 'Deploying Preview',
    icon: <Rocket className="h-4 w-4" />,
    description: 'Launching your live website preview',
  },
];

// =============================================================================
// Sub-Components
// =============================================================================

// --- Waveform Visualization ---
function WaveformVisualization({ isRecording }: { isRecording: boolean }) {
  const bars = 40;
  return (
    <div className="flex items-center justify-center gap-[2px] h-12 px-4">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: isRecording
              ? `linear-gradient(to top, #a855f7, #06b6d4)`
              : 'hsl(var(--muted))',
          }}
          animate={
            isRecording
              ? {
                  height: [4, Math.random() * 36 + 4, 4],
                  opacity: [0.5, 1, 0.5],
                }
              : {
                  height: 4,
                  opacity: 0.3,
                }
          }
          transition={
            isRecording
              ? {
                  duration: 0.8 + Math.random() * 0.6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.03,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// --- Voice Input Section ---
function VoiceInputSection() {
  const {
    isRecording,
    setIsRecording,
    voiceTranscript,
    setVoiceTranscript,
    addChatMessage,
    setChatLoading,
    isChatLoading,
    setBusinessProfile,
    setCurrentJob,
    updateGenerationStatus,
    addGenerationLog,
    isGenerating,
    setCurrentView,
    clearChat,
    chatMessages,
    businessProfile,
    currentJob,
    addStorefront,
    setCurrentStorefront,
    selectedTemplate,
    setSelectedTemplate,
    selectedDesignComponent,
    setSelectedDesignComponent,
    selectedDesignTheme,
    setSelectedDesignTheme,
    selectedBlocks,
    setSelectedBlocks,
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  // --- Hardened WebSocket for generation pipeline ---
  const {
    isConnected: wsConnected,
    disconnect: wsDisconnect,
    startGeneration: wsStartGeneration,
  } = useGenerationWs({
    onProgress: (data) => {
      updateGenerationStatus(data.status, data.message, data.progress);
      if (data.logs && data.logs.length > 0) {
        const currentLogIds = new Set(
          useAppStore.getState().currentJob?.logs.map(l => l.id) || []
        );
        for (const log of data.logs) {
          if (!currentLogIds.has(log.id)) {
            addGenerationLog({
              level: log.level,
              agent: log.agent,
              message: log.message,
              detail: log.detail,
            });
          }
        }
      }
    },
    onHtml: (data) => {
      console.log(`[Builder] HTML received: ${(data.html.length / 1024).toFixed(1)}KB, score: ${data.validationScore}/100, time: ${(data.generationTimeMs / 1000).toFixed(1)}s`);
      if (!generationCompletedRef.current) {
        finalizeGenerationRefRef.current(data.html, data.storefrontId);
      }
    },
    onComplete: (data) => {
      if (data.success) {
        if (data.html && !generationCompletedRef.current) {
          finalizeGenerationRefRef.current(data.html, data.storefrontId);
        }
      } else {
        updateGenerationStatus('error', 'Generation failed on the server', 0);
        setSimStage('ready');
        showToast({
          title: 'Generation Failed',
          description: 'The server reported an error during generation. Please try again.',
          variant: 'destructive',
        });
      }
      wsDisconnect();
    },
    onPipelineResumed: () => {
      console.log('[Builder] Pipeline resumed after reconnection');
      showToast({
        title: 'Pipeline Resumed',
        description: 'Your generation pipeline has been resumed after a brief disconnection.',
      });
    },
    onError: (error) => {
      updateGenerationStatus('error', 'Connection failed', 0);
      setSimStage('ready');
      showToast({
        title: 'Connection Error',
        description: error || 'Could not connect to the generation service. Please try again.',
        variant: 'destructive',
      });
    },
  });
  const [simStage, setSimStage] = useState<
    'idle' | 'transcribing' | 'analyzing' | 'chatting' | 'ready' | 'generating' | 'complete'
  >('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const simTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);
  const generationCompletedRef = useRef(false);
  const finalizeGenerationRefRef = useRef<(html: string, storefrontId: string) => void>(() => {});
  const { toast: showToast } = useToast();
  const sessionIdRef = useRef<string>(`builder-${Date.now()}`);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);
  const processedBlockCompositionRef = useRef<string>('');

  // --- Real voice recording refs & state ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMicSupported, setIsMicSupported] = useState<boolean | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Check mic support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      setIsMicSupported(true);
    } else {
      setIsMicSupported(false);
    }
  }, []);

  // --- Handle incoming selection from Templates / Design Library ---
  useEffect(() => {
    // When a template is selected from the Templates view
    if (selectedTemplate) {
      // Build a business profile from the template's data
      const profile: BusinessProfile = {
        name: selectedTemplate.name,
        category: selectedTemplate.category,
        description: selectedTemplate.description,
        location: '',
        phone: '',
        email: '',
        hours: '',
        products: [],
        services: [],
        style: {
          primaryColor: selectedTemplate.style.primaryColor,
          secondaryColor: selectedTemplate.style.secondaryColor,
          fontFamily: selectedTemplate.style.fontFamily,
          theme: selectedTemplate.style.theme === 'elegant' ? 'elegant' : selectedTemplate.style.theme === 'classic' ? 'classic' : selectedTemplate.style.theme === 'minimal' ? 'minimal' : selectedTemplate.style.theme === 'bold' ? 'bold' : 'modern',
          mood: selectedTemplate.style.mood,
        },
        features: selectedTemplate.sections.map(s => s.type),
      };
      setBusinessProfile(profile);
      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Great choice! I've loaded the **${selectedTemplate.name}** template. It's a ${selectedTemplate.category} template with ${selectedTemplate.sections.length} sections (${selectedTemplate.sections.map(s => s.type).join(', ')}). The style uses ${selectedTemplate.style.fontFamily} font with ${selectedTemplate.style.theme} theme. You can now customize it by describing your business details, or click "Generate Website" to create your site with this template.`,
        timestamp: Date.now(),
      });
      setSimStage('ready');
      setSelectedTemplate(null); // consume
    }
  }, [selectedTemplate, setBusinessProfile, addChatMessage, setSimStage, setSelectedTemplate]);

  // When blocks are selected (from the Design Blocks view), create a business profile from them
  useEffect(() => {
    if (selectedBlocks.length > 0) {
      // Check if we already processed this composition
      const blockIds = selectedBlocks.map(b => b.id).join(',');
      if (processedBlockCompositionRef.current === blockIds) return;
      processedBlockCompositionRef.current = blockIds;

      // Infer category from the first block's recommendations or default to 'other'
      const category = selectedBlocks[0]?.recommendedFor?.[0] || 'other' as BusinessCategory;

      // Infer style from most common block style
      const styleCounts: Record<string, number> = {};
      selectedBlocks.forEach(b => {
        styleCounts[b.style] = (styleCounts[b.style] || 0) + 1;
      });
      const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'modern';

      const styleMap: Record<string, BrandStyle> = {
        modern: { primaryColor: '#7c3aed', secondaryColor: '#06b6d4', fontFamily: 'Inter', theme: 'modern', mood: 'sleek' },
        classic: { primaryColor: '#92400e', secondaryColor: '#d97706', fontFamily: 'Playfair Display', theme: 'classic', mood: 'warm' },
        minimal: { primaryColor: '#18181b', secondaryColor: '#71717a', fontFamily: 'Inter', theme: 'minimal', mood: 'clean' },
        bold: { primaryColor: '#dc2626', secondaryColor: '#f97316', fontFamily: 'Space Grotesk', theme: 'bold', mood: 'energetic' },
        elegant: { primaryColor: '#1c1917', secondaryColor: '#c9a96e', fontFamily: 'Cormorant Garamond', theme: 'elegant', mood: 'refined' },
      };

      const profile: BusinessProfile = {
        name: '',
        category,
        description: '',
        location: '',
        phone: '',
        email: '',
        hours: '',
        products: [],
        services: [],
        style: styleMap[dominantStyle] || styleMap.modern,
        features: selectedBlocks.map(b => b.type),
      };

      setBusinessProfile(profile);
      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've prepared a page composition with ${selectedBlocks.length} design blocks: ${selectedBlocks.map(b => b.name).join(', ')}. Fill in your business details in the chat, or click "Generate Website" to start building!`,
        timestamp: Date.now(),
      });
      setSimStage('ready');
      setSelectedBlocks([]); // consume (one-shot, like selectedTemplate)
    }
  }, [selectedBlocks, setBusinessProfile, addChatMessage, setSimStage, setSelectedBlocks]);

  useEffect(() => {
    // When a design component is selected from the Design Library
    if (selectedDesignComponent) {
      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've added the **${selectedDesignComponent.name}** component (${selectedDesignComponent.category}) to your project. This ${selectedDesignComponent.style}-style component will be included when generating your website. Describe your business and I'll build your site with this component included!`,
        timestamp: Date.now(),
      });
      setSimStage('chatting');
      setShowTextInput(true);
      setSelectedDesignComponent(null); // consume
    }
  }, [selectedDesignComponent, addChatMessage, setSimStage, setShowTextInput, setSelectedDesignComponent]);

  useEffect(() => {
    // When a design theme is selected from the Design Library
    if (selectedDesignTheme) {
      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `The **${selectedDesignTheme.name}** theme has been applied! It features ${selectedDesignTheme.mood.toLowerCase()} mood with ${selectedDesignTheme.fontFamily} font and a ${selectedDesignTheme.style} style. Colors: primary **${selectedDesignTheme.colors.primary}**, secondary **${selectedDesignTheme.colors.secondary}**. Describe your business to generate a website with this theme.`,
        timestamp: Date.now(),
      });
      setSimStage('chatting');
      setShowTextInput(true);
      setSelectedDesignTheme(null); // consume
    }
  }, [selectedDesignTheme, addChatMessage, setSimStage, setShowTextInput, setSelectedDesignTheme]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Cleanup timers, WebSocket, and media recorder on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      simTimerRef.current.forEach(clearTimeout);
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      wsDisconnect();
      // Stop any active media recorder
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const hasStarted = chatMessages.length > 0 || simStage !== 'idle';
  const hasBusinessProfile = businessProfile !== null;

  // Related templates — show alternatives from the same category
  const relatedTemplates = React.useMemo(() => {
    if (!businessProfile?.category) return [];
    const cat = businessProfile.category;
    // Get the name of the template we loaded (if any) to exclude it
    const currentName = chatMessages.find(m => m.role === 'assistant' && m.content.includes('template'))?.content;
    return localTemplates
      .filter(t => t.category === cat)
      .filter(t => !currentName || !currentName.includes(t.name))
      .slice(0, 3);
  }, [businessProfile?.category, chatMessages]);
  const allChatMessages = chatMessages;

  // --- Helper: map API business profile response to BusinessProfile type ---
  const mapApiBusinessProfile = useCallback((apiProfile: Record<string, unknown>): BusinessProfile => {
    const validCategories: BusinessCategory[] = ['bakery', 'restaurant', 'clothing', 'electronics', 'salon', 'grocery', 'hardware', 'medical', 'boutique', 'service', 'other'];
    const validThemes: BusinessProfile['style']['theme'][] = ['modern', 'classic', 'minimal', 'bold', 'elegant'];

    return {
      name: (apiProfile.businessName as string) || (apiProfile.name as string) || 'My Business',
      category: validCategories.includes(apiProfile.category as BusinessCategory) ? (apiProfile.category as BusinessCategory) : 'other',
      description: (apiProfile.description as string) || '',
      location: (apiProfile.location as string) || '',
      phone: (apiProfile.phone as string) || '',
      email: (apiProfile.email as string) || '',
      hours: (apiProfile.hours as string) || '',
      products: Array.isArray(apiProfile.products)
        ? (apiProfile.products as Array<Record<string, string>>).map((p) => ({
            name: p.name || '',
            description: p.description || '',
            price: p.price || '',
            category: p.category || '',
          }))
        : [],
      services: Array.isArray(apiProfile.services)
        ? (apiProfile.services as Array<Record<string, string>>).map((s) => ({
            name: s.name || '',
            description: s.description || '',
            duration: s.duration,
            price: s.price,
          }))
        : [],
      style: {
        primaryColor: (apiProfile.style as Record<string, string>)?.primaryColor || '#7c3aed',
        secondaryColor: (apiProfile.style as Record<string, string>)?.secondaryColor || '#06b6d4',
        fontFamily: (apiProfile.style as Record<string, string>)?.fontFamily || 'Inter',
        theme: validThemes.includes((apiProfile.style as Record<string, string>)?.theme as BusinessProfile['style']['theme'])
          ? ((apiProfile.style as Record<string, string>)?.theme as BusinessProfile['style']['theme'])
          : 'modern',
        mood: (apiProfile.style as Record<string, string>)?.mood || 'professional',
      },
      features: Array.isArray(apiProfile.features) ? (apiProfile.features as string[]) : [],
    };
  }, []);

  // --- Process voice audio via ASR + LLM API ---
  const processVoiceAudio = useCallback(
    async (base64Audio: string) => {
      setIsRecording(false);
      setSimStage('analyzing');

      try {
        const res = await fetch('/api/voice/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: base64Audio }),
        });

        const data = await res.json();
        if (data.success) {
          setVoiceTranscript(data.transcript);
          addChatMessage({
            id: `msg-${Date.now()}`,
            role: 'user',
            content: data.transcript,
            timestamp: Date.now(),
          });
          setSimStage('chatting');

          // Use extracted business profile if available
          if (data.businessProfile) {
            const profile = mapApiBusinessProfile(data.businessProfile);
            setBusinessProfile(profile);
            setSimStage('ready');
          }

          simulateChat(data.transcript);
        } else {
          throw new Error(data.error || 'Voice processing failed');
        }
      } catch (error) {
        console.error('[VoiceProcessing] Error:', error);
        showToast({
          title: 'Voice Processing Error',
          description: 'Could not process audio. Please try again or type your message.',
          variant: 'destructive',
        });
        setSimStage('idle');
      }
    },
    [addChatMessage, setBusinessProfile, showToast, mapApiBusinessProfile]
  );

  // --- Real microphone recording ---
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          processVoiceAudio(base64Audio);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100); // collect in 100ms chunks
      setIsRecording(true);
      setSimStage('transcribing');
      setMicPermissionDenied(false);

      // Auto-stop after 30 seconds
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    } catch (err) {
      console.warn('[VoiceRecording] Mic access denied or unavailable:', err);
      setMicPermissionDenied(true);
      showToast({
        title: 'Microphone Unavailable',
        description: 'Microphone access was denied or is unavailable. Please type your message instead.',
        variant: 'destructive',
      });
    }
  }, [processVoiceAudio, showToast]);

  const stopRecording = useCallback(() => {
    // Clear auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Shared helper to call the real /api/chat endpoint
  const callChatAPI = useCallback(
    async (message: string): Promise<{
      response: string;
      quickReplies: string[];
      messageCount: number;
    } | null> => {
      try {
        setChatLoading(true);
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            sessionId: sessionIdRef.current,
          }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.quickReplies && data.quickReplies.length > 0) {
          setActiveQuickReplies(data.quickReplies);
        }

        return data;
      } catch (error) {
        console.error('[BuilderChat] API error:', error);
        showToast({
          title: 'AI Assistant Error',
          description: 'Failed to get a response. Please try again.',
          variant: 'destructive',
        });
        addChatMessage({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        });
        return null;
      } finally {
        setChatLoading(false);
      }
    },
    [addChatMessage, setChatLoading, showToast]
  );

  const simulateChat = useCallback(
    async (userText: string) => {
      // First AI response via real API
      const result = await callChatAPI(userText);
      if (!result) return;

      addChatMessage({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: Date.now(),
      });

      // Try to extract business profile from conversation after enough messages
      // Only attempt if no profile has been set yet (voice flow sets it directly)
      if (!useAppStore.getState().businessProfile && result.messageCount >= 2 && mountedRef.current) {
        simTimerRef.current.push(
          setTimeout(async () => {
            if (!mountedRef.current) return;
            try {
              const allMessages = useAppStore.getState().chatMessages;
              const profileRes = await fetch('/api/extract-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: allMessages }),
              });
              const profileData = await profileRes.json();
              if (!mountedRef.current) return;
              if (profileData.success && profileData.businessProfile) {
                setBusinessProfile(profileData.businessProfile);
                setSimStage('ready');
              } else {
                throw new Error(profileData.error || 'Extraction failed');
              }
            } catch (err) {
              if (!mountedRef.current) return;
              console.error('[ExtractProfile] Failed:', err);
            }
          }, 1200)
        );
      }

      // NOTE: Auto follow-up removed — the user drives the conversation.
      // The AI should only respond to explicit user input.
    },
    [addChatMessage, callChatAPI, setBusinessProfile]
  );

  // Helper to finalize generation with the generated HTML
  const finalizeGeneration = useCallback(
    async (generatedHtml: string, storefrontId: string, profile: BusinessProfile) => {
      // Keep a ref to a simplified version for WS callbacks
      finalizeGenerationRefRef.current = (html: string, sfId: string) => {
        finalizeGeneration(html, sfId, useAppStore.getState().businessProfile || profile);
      };

      const now = new Date().toISOString();

      // Create a new storefront with the generated HTML
      const newStorefront: Storefront = {
        id: storefrontId,
        name: `${profile.name} Website`,
        businessName: profile.name,
        category: profile.category,
        status: 'ready',
        description: profile.description,
        url: `/preview/${storefrontId}`,
        sections: [],
        html: generatedHtml,
        businessProfile: profile,
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        viewCount: 0,
        deploymentStatus: 'none',
        deploymentUrl: null,
      };

      // Store in Zustand memory immediately (fast UI response)
      addStorefront(newStorefront);
      setCurrentStorefront(newStorefront);
      updateGenerationStatus('complete', 'Website generated successfully!', 100);
      setSimStage('complete');
      generationCompletedRef.current = true;

      showToast({
        title: 'Website Generated!',
        description: 'Your storefront is ready for preview.',
      });

      // Persist to database in the background (non-blocking)
      // If DB save fails, the storefront still works in-memory
      try {
        const res = await fetch('/api/storefronts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newStorefront.name,
            businessName: newStorefront.businessName,
            category: newStorefront.category,
            description: newStorefront.description,
            html: generatedHtml,
            businessProfile: profile,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const dbId = data.storefront?.id;
          if (dbId) {
            // Update Zustand with the real DB ID so future operations use it
            useAppStore.getState().updateStorefront(storefrontId, { id: dbId });
            console.log('[Builder] Storefront persisted to DB with id:', dbId);
          }
        } else {
          console.error('[Builder] Failed to persist storefront to DB:', res.status, await res.text());
        }
      } catch (dbError) {
        // Don't block the UI — the storefront is already in Zustand memory
        console.error('[Builder] DB persistence error (non-fatal):', dbError);
      }
    },
    [addStorefront, setCurrentStorefront, updateGenerationStatus, showToast]
  );

  const handleGenerateWebsite = useCallback(() => {
    if (!businessProfile) {
      showToast({
        title: 'Business Profile Required',
        description: 'Please describe your business first so we can generate a tailored website.',
        variant: 'destructive',
      });
      return;
    }

    const profileToUse = businessProfile;
    const storefrontId = `sf-${Date.now()}`;
    const jobId = `job-${Date.now()}`;

    // Reset refs for this generation
    generationCompletedRef.current = false;

    // Create the generation job in the store
    const newJob: GenerationJob = {
      id: jobId,
      storefrontId,
      status: 'idle',
      currentStep: 0,
      totalSteps: PIPELINE_STEPS.length,
      progress: 0,
      message: 'Starting generation pipeline (hardened WebSocket)...',
      startedAt: new Date().toISOString(),
      completedAt: null,
      voiceTranscript: voiceTranscript,
      businessProfile: profileToUse,
      logs: [],
    };
    setCurrentJob(newJob);
    setSimStage('generating');

    // --- Send generation request via hardened WebSocket ---
    // The useGenerationWs hook handles:
    //   - Auto-connect with exponential backoff reconnection
    //   - Message acknowledgment with retries
    //   - Offline queue with auto-flush on reconnect
    //   - Backpressure signals
    //   - Server shutdown handling
    //   - Connection health monitoring & metrics
    //   - Message replay on reconnect

    // Include block composition in generation payload if available
    const currentBlocks = useAppStore.getState().selectedBlocks;
    const generationProfile: Record<string, unknown> = { ...profileToUse } as unknown as Record<string, unknown>;
    if (currentBlocks.length > 0) {
      generationProfile.blockComposition = currentBlocks.map(b => ({
        id: b.id,
        type: b.type,
        name: b.name,
        variant: b.variant,
        description: b.description,
      }));
    }

    wsStartGeneration(storefrontId, generationProfile, voiceTranscript);
  }, [voiceTranscript, businessProfile, setCurrentJob, wsStartGeneration]);

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    const message = textInput.trim();
    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });
    setTextInput('');
    setSimStage('chatting');

    const result = await callChatAPI(message);
    if (!result) return;

    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: result.response,
      timestamp: Date.now(),
    });

    // Extract business profile after enough messages via real API
    if (result.messageCount >= 2 && !businessProfile && mountedRef.current) {
      (async () => {
        try {
          const allMessages = useAppStore.getState().chatMessages;
          const profileRes = await fetch('/api/extract-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: allMessages }),
          });
          const profileData = await profileRes.json();
          if (!mountedRef.current) return;
          if (profileData.success && profileData.businessProfile) {
            setBusinessProfile(profileData.businessProfile);
            setSimStage('ready');
          } else {
            throw new Error(profileData.error || 'Extraction failed');
          }
        } catch (err) {
          if (!mountedRef.current) return;
          console.error('[ExtractProfile] Failed:', err);
        }
      })();
    }
  };

  const handleQuickReply = async (reply: string) => {
    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: reply,
      timestamp: Date.now(),
    });

    const result = await callChatAPI(reply);
    if (!result) return;

    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: result.response,
      timestamp: Date.now(),
    });
  };

  const handleReset = () => {
    simTimerRef.current.forEach(clearTimeout);
    simTimerRef.current = [];
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    // Disconnect hardened WebSocket
    wsDisconnect();
    // Stop any active media recorder
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
    generationCompletedRef.current = false;
    clearChat();
    setBusinessProfile(null);
    setCurrentJob(null);
    setVoiceTranscript('');
    setTextInput('');
    setSimStage('idle');
    setActiveQuickReplies([]);
    sessionIdRef.current = `builder-${Date.now()}`;
  };

  const handleViewPreview = () => {
    setCurrentView('preview');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Column: Voice + Chat */}
      <div className="flex-1 lg:w-[60%] flex flex-col gap-6 min-w-0">
        {/* Voice Input Card */}
        <AnimatePresence mode="wait">
          {!isGenerating && simStage !== 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden relative">
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/20 via-cyan-500/20 to-violet-500/20 opacity-50 pointer-events-none" />
                <CardContent className="relative p-6">
                  {/* Voice Button */}
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      className="relative"
                      animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {/* Pulsing rings when recording */}
                      {isRecording && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full bg-violet-500/20"
                            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                            style={{ margin: -12 }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full bg-cyan-500/15"
                            animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'easeOut',
                              delay: 0.3,
                            }}
                            style={{ margin: -8 }}
                          />
                        </>
                      )}

                      <Button
                        size="lg"
                        className={cn(
                          'relative w-20 h-20 rounded-full text-white shadow-lg transition-all duration-300',
                          isRecording
                            ? 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/30'
                            : 'bg-gradient-to-br from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-violet-500/30 hover:shadow-violet-500/50'
                        )}
                        onClick={() => {
                          if (simStage === 'idle') {
                            if (isMicSupported && !micPermissionDenied) {
                              startRecording();
                            } else {
                              showToast({
                                title: 'Microphone Unavailable',
                                description: 'Microphone access is not available. Please type your message instead.',
                                variant: 'destructive',
                              });
                            }
                          } else if (isRecording) {
                            stopRecording();
                          }
                        }}
                      >
                        {isRecording ? (
                          <StopCircle className="h-8 w-8" />
                        ) : (
                          <Mic className="h-8 w-8" />
                        )}
                      </Button>
                    </motion.div>

                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground/90">
                        {isRecording
                          ? 'Listening... Tap to stop'
                          : simStage === 'idle'
                            ? 'Tap to describe your business'
                            : 'Record or type more details'}
                      </p>
                      {!isRecording && simStage === 'idle' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {micPermissionDenied
                            ? 'Microphone unavailable — please type your message'
                            : isMicSupported
                              ? 'Speak naturally — AI will extract everything'
                              : 'Voice not supported — please type your message'
                          }
                        </p>
                      )}
                    </div>

                    {/* Waveform */}
                    <WaveformVisualization isRecording={isRecording} />

                    {/* Transcript Display */}
                    {(voiceTranscript || isRecording) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full"
                      >
                        <div className="bg-muted/50 rounded-lg p-3 border border-border/50">
                          <p className="text-sm text-foreground/80 leading-relaxed">
                            {voiceTranscript || (
                              <span className="italic text-muted-foreground">
                                Listening to your voice...
                              </span>
                            )}
                            {isRecording && (
                              <motion.span
                                className="inline-block w-[2px] h-4 bg-violet-500 ml-1 align-middle"
                                animate={{ opacity: [1, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                            )}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 w-full">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground font-medium">OR TYPE</span>
                      <Separator className="flex-1" />
                    </div>

                    {/* Text Input */}
                    {showTextInput || simStage !== 'idle' ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="w-full flex gap-2"
                      >
                        <Textarea
                          ref={textareaRef}
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Describe your business here..."
                          className="min-h-[60px] max-h-[120px] resize-none bg-muted/30 border-border/50"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleTextSubmit();
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          className="shrink-0 self-end bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg"
                          onClick={handleTextSubmit}
                          disabled={!textInput.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setShowTextInput(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Type instead
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Interface */}
        <Card className="flex-1 border-border/50 bg-card/80 backdrop-blur-sm flex flex-col min-h-[300px]">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-500" />
                AI Builder Assistant
              </CardTitle>
              {hasStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </CardHeader>
          <Separator />
          <div className="flex-1 overflow-hidden flex flex-col">
            {!hasStarted ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-500/20 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Build your website with AI
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Describe your business using voice or text. Our AI will understand your needs and generate a complete website.
                    </p>
                  </div>

                  {/* Example Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-w-lg mx-auto">
                    {EXAMPLE_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 text-left transition-colors group"
                        onClick={() => {
                          setTextInput(prompt.description);
                          setShowTextInput(true);
                        }}
                      >
                        <div className="mt-0.5 text-violet-400 group-hover:text-violet-300 transition-colors">
                          {prompt.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground/90">
                            {prompt.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {prompt.description}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3">
                    {allChatMessages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: i === allChatMessages.length - 1 ? 0.1 : 0 }}
                        className={cn(
                          'flex gap-2',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-gradient-to-br from-violet-600 to-cyan-600 text-white text-[10px]">
                              <Sparkles className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-br-md'
                              : 'bg-muted border border-border/50 rounded-bl-md text-foreground/90'
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0.5">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isChatLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 items-start"
                      >
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarFallback className="bg-gradient-to-br from-violet-600 to-cyan-600 text-white text-[10px]">
                            <Sparkles className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 rounded-full bg-violet-400/60"
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: 'easeInOut',
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick Replies */}
                {simStage === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 pb-2"
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {activeQuickReplies.map((reply) => (
                        <Button
                          key={reply}
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-violet-500/30 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 hover:border-violet-500/50"
                          onClick={() => handleQuickReply(reply)}
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Generate Button */}
                {simStage === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 pb-4 pt-1"
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 hover:from-violet-500 hover:via-purple-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/20 h-11 text-sm font-medium"
                      onClick={handleGenerateWebsite}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Website
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Business Understanding + Pipeline */}
      <div className="lg:w-[40%] flex flex-col gap-6 min-w-0">
        {/* Business Understanding */}
        {hasBusinessProfile && !isGenerating && simStage !== 'complete' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  Business Understanding
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-3">
                <BusinessInfoCards profile={businessProfile!} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Related Templates — alternatives from same category */}
        {hasBusinessProfile && !isGenerating && simStage === 'ready' && relatedTemplates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-400" />
                  Try a Different Template
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-3 space-y-2">
                {relatedTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/40 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group text-left"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundImage: `linear-gradient(135deg, ${t.style.primaryColor}, ${t.style.secondaryColor})` }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-violet-300 transition-colors">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.sections.length} sections · {t.style.theme} · {t.style.mood}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-violet-400 transition-colors shrink-0" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Generation Pipeline */}
        {(isGenerating || simStage === 'complete') && currentJob && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full flex flex-col">
              <CardHeader className="pb-3 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {simStage === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-violet-400 animate-spin" />
                    )}
                    Generation Pipeline
                  </CardTitle>
                  {currentJob && (
                    <Badge
                      variant={simStage === 'complete' ? 'default' : 'secondary'}
                      className={
                        simStage === 'complete'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                      }
                    >
                      {Math.round(currentJob.progress)}%
                    </Badge>
                  )}
                </div>
                {currentJob && simStage !== 'complete' && (
                  <Progress
                    value={currentJob.progress}
                    className="mt-2 h-1.5 bg-muted/50"
                  />
                )}
              </CardHeader>
              <Separator />
              <CardContent className="p-4 flex-1 flex flex-col gap-4 min-h-0">
                <PipelineSteps
                  currentStatus={currentJob?.status || 'idle'}
                  isComplete={simStage === 'complete'}
                />

                {/* Generation Logs */}
                <GenerationLogsPanel
                  logs={currentJob?.logs || []}
                  logsEndRef={logsEndRef}
                />

                {/* View Preview Button */}
                {simStage === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-500/20 h-11 text-sm font-medium"
                      onClick={handleViewPreview}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Website Preview
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty state when nothing on right */}
        {!hasBusinessProfile && !isGenerating && simStage !== 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mx-auto">
                <Lightbulb className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Describe your business to see<br />
                AI-extracted insights here
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- Business Info Cards ---
function BusinessInfoCards({ profile }: { profile: BusinessProfile }) {
  const items = [
    {
      icon: <Store className="h-4 w-4 text-violet-400" />,
      label: 'Business Name',
      value: profile.name,
    },
    {
      icon: CATEGORY_ICONS[profile.category],
      label: 'Category',
      value: CATEGORY_LABELS[profile.category],
      badge: true,
    },
    {
      icon: <MapPin className="h-4 w-4 text-cyan-400" />,
      label: 'Location',
      value: profile.location,
    },
    {
      icon: <Clock className="h-4 w-4 text-amber-400" />,
      label: 'Hours',
      value: profile.hours,
    },
    {
      icon: <Package className="h-4 w-4 text-emerald-400" />,
      label: 'Products',
      value: `${profile.products.length} items`,
      detail: profile.products.map((p) => p.name).join(', '),
    },
    {
      icon: <Wrench className="h-4 w-4 text-rose-400" />,
      label: 'Services',
      value: `${profile.services.length} offered`,
      detail: profile.services.map((s) => s.name).join(', '),
    },
    {
      icon: <Palette className="h-4 w-4 text-pink-400" />,
      label: 'Style',
      value: `${profile.style.theme} — ${profile.style.mood}`,
      colorPreview: true,
      color1: profile.style.primaryColor,
      color2: profile.style.secondaryColor,
    },
    {
      icon: <LayoutGrid className="h-4 w-4 text-orange-400" />,
      label: 'Features',
      value: `${profile.features.length} features`,
      detail: profile.features.join(', '),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-muted/30 rounded-lg p-3 border border-border/30 hover:border-violet-500/20 transition-colors"
        >
          <div className="flex items-center gap-1.5 mb-1">
            {item.icon}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {item.label}
            </span>
          </div>
          {item.badge ? (
            <Badge
              variant="outline"
              className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs"
            >
              {item.value}
            </Badge>
          ) : (
            <p className="text-sm font-medium text-foreground/90 leading-tight">
              {item.value}
            </p>
          )}
          {item.colorPreview && (
            <div className="flex gap-1.5 mt-1.5">
              <div
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: item.color1 }}
              />
              <div
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: item.color2 }}
              />
            </div>
          )}
          {item.detail && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {item.detail}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// --- Pipeline Steps ---
function PipelineSteps({
  currentStatus,
  isComplete,
}: {
  currentStatus: GenerationStatus;
  isComplete: boolean;
}) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStatus);

  return (
    <div className="space-y-1.5">
      {PIPELINE_STEPS.map((step, i) => {
        const isDone = isComplete || currentIndex > i;
        const isCurrent = currentIndex === i && !isComplete;
        const isPending = currentIndex < i && !isComplete;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-all duration-300',
              isCurrent && 'bg-violet-500/10 border border-violet-500/30',
              isDone && 'opacity-70',
              isPending && 'opacity-40'
            )}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors',
                isCurrent && 'bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-500/30',
                isDone && 'bg-emerald-500/20 text-emerald-400',
                isPending && 'bg-muted text-muted-foreground'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isCurrent ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  {step.icon}
                </motion.div>
              ) : (
                step.icon
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-xs font-medium truncate',
                  isCurrent && 'text-violet-300',
                  isDone && 'text-emerald-400',
                  isPending && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-muted-foreground truncate"
                >
                  {step.description}
                </motion.p>
              )}
            </div>
            {isCurrent && (
              <motion.div
                className="w-2 h-2 rounded-full bg-violet-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// --- Generation Logs Panel ---
function GenerationLogsPanel({
  logs,
  logsEndRef,
}: {
  logs: GenerationLog[];
  logsEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const levelConfig = {
    info: {
      icon: <Terminal className="h-3 w-3" />,
      color: 'text-muted-foreground',
      bg: '',
    },
    success: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/5',
    },
    warning: {
      icon: <AlertTriangle className="h-3 w-3" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/5',
    },
    error: {
      icon: <XCircle className="h-3 w-3" />,
      color: 'text-red-400',
      bg: 'bg-red-500/5',
    },
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Agent Logs
        <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
          {logs.length}
        </Badge>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-1 min-h-0"
          >
            <ScrollArea className="h-[160px] rounded-lg bg-black/20 border border-border/30">
              <div className="p-2 space-y-0.5 font-mono">
                {logs.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/50 p-2 text-center">
                    Waiting for logs...
                  </p>
                )}
                {logs.map((log, i) => {
                  const config = levelConfig[log.level];
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'flex items-start gap-2 px-2 py-1 rounded text-[11px] leading-relaxed',
                        config.bg
                      )}
                    >
                      <span className={cn('shrink-0 mt-px', config.color)}>
                        {config.icon}
                      </span>
                      <span className="text-muted-foreground/70 shrink-0 w-24 truncate">
                        {log.agent}
                      </span>
                      <span className={cn('flex-1', config.color)}>{log.message}</span>
                    </motion.div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Export
// =============================================================================

export function BuilderView() {
  return (
    <div className="h-full">
      <VoiceInputSection />
    </div>
  );
}
