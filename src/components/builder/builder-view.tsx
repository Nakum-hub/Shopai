'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type {
  ChatMessage,
  BusinessProfile,
  GenerationJob,
  GenerationStatus,
  GenerationLog,
  BusinessCategory,
  Storefront,
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
  MicOff,
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
  Play,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  Brain,
  Globe,
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
  GraduationCap,
  HelpCircle,
} from 'lucide-react';

// =============================================================================
// Constants & Mock Data
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

const QUICK_REPLIES = [
  'That looks perfect!',
  'I want to add more products',
  'Change the color theme',
  'Add a testimonials section',
  'Include a booking form',
  'Make it more minimal',
];

const MOCK_AI_RESPONSES = [
  "I've analyzed your business description! Here's what I've extracted so far:",
  "Great details! Let me ask a few follow-up questions to make your website even better. Do you offer any seasonal specials or loyalty programs?",
  "Perfect! I also noticed you mentioned your location — would you like to include a Google Maps embed on your contact page?",
  "Excellent! I have enough information now. Would you like me to proceed with generating your website, or would you like to add any more details?",
];

const MOCK_BUSINESS_PROFILE: BusinessProfile = {
  name: 'The Flour Garden',
  category: 'bakery',
  description:
    'Artisan bakery specializing in sourdough bread, custom cakes, and pastries. A warm neighborhood bakery experience.',
  location: 'Church Street, Bangalore',
  phone: '+91 98765 43210',
  email: 'hello@theflourgarden.in',
  hours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-6PM',
  products: [
    {
      name: 'Sourdough Loaf',
      description: '48-hour fermented artisan sourdough',
      price: '₹350',
      category: 'Breads',
    },
    {
      name: 'Custom Cakes',
      description: 'Made-to-order celebration cakes',
      price: '₹1,200+',
      category: 'Cakes',
    },
    {
      name: 'Croissants',
      description: 'Buttery French-style croissants',
      price: '₹120',
      category: 'Pastries',
    },
    {
      name: 'Cinnamon Rolls',
      description: 'Fresh-baked with cream cheese glaze',
      price: '₹150',
      category: 'Pastries',
    },
  ],
  services: [
    {
      name: 'Custom Cake Consultation',
      description: 'One-on-one consultation for custom cake orders',
      duration: '30 min',
      price: 'Free',
    },
    {
      name: 'Baking Workshop',
      description: 'Learn sourdough basics in our weekend workshop',
      duration: '3 hours',
      price: '₹2,500',
    },
  ],
  style: {
    primaryColor: '#D4A574',
    secondaryColor: '#2D5016',
    fontFamily: 'Playfair Display',
    theme: 'elegant',
    mood: 'Warm, inviting, artisanal',
  },
  features: [
    'Online ordering',
    'Custom cake form',
    'Photo gallery',
    'Google Maps',
    'Customer reviews',
    'Newsletter signup',
  ],
};

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

const MOCK_LOGS: Omit<GenerationLog, 'id' | 'timestamp'>[] = [
  { level: 'info', agent: 'Voice Agent', message: 'Transcribing audio stream...' },
  { level: 'success', agent: 'Voice Agent', message: 'Transcription complete: 147 words detected' },
  { level: 'info', agent: 'Business Analyzer', message: 'Parsing business name: "The Flour Garden"' },
  { level: 'info', agent: 'Business Analyzer', message: 'Category detected: bakery (confidence: 96%)' },
  { level: 'success', agent: 'Business Analyzer', message: 'Extracted 4 products and 2 services' },
  { level: 'info', agent: 'Planner Agent', message: 'Planning 7 website sections...' },
  { level: 'info', agent: 'Planner Agent', message: 'Section order: hero → about → products → gallery → testimonials → hours → contact' },
  { level: 'success', agent: 'Planner Agent', message: 'Site architecture finalized' },
  { level: 'info', agent: 'Branding Agent', message: 'Generating color palette from business mood...' },
  { level: 'success', agent: 'Branding Agent', message: 'Primary: #D4A574 (Warm Gold), Secondary: #2D5016 (Forest Green)' },
  { level: 'info', agent: 'Content Agent', message: 'Writing hero headline: "Handcrafted with Love, Baked with Passion"' },
  { level: 'info', agent: 'Content Agent', message: 'Generating product descriptions for 4 items...' },
  { level: 'success', agent: 'Content Agent', message: 'All copy generated (847 words total)' },
  { level: 'info', agent: 'Section Builder', message: 'Building hero section with CTA...' },
  { level: 'info', agent: 'Section Builder', message: 'Building product grid (4 items)...' },
  { level: 'info', agent: 'Section Builder', message: 'Building contact form with map embed...' },
  { level: 'success', agent: 'Section Builder', message: 'All 7 sections generated' },
  { level: 'info', agent: 'Assembler', message: 'Compiling responsive HTML...' },
  { level: 'info', agent: 'Assembler', message: 'Injecting Tailwind CSS classes...' },
  { level: 'success', agent: 'Assembler', message: 'Page assembled: 2,340 lines of HTML/CSS' },
  { level: 'info', agent: 'Validator', message: 'Running Lighthouse audit...' },
  { level: 'success', agent: 'Validator', message: 'SEO Score: 95/100, Performance: 92/100, Accessibility: 98/100' },
  { level: 'info', agent: 'Deployer', message: 'Deploying to preview environment...' },
  { level: 'success', agent: 'Deployer', message: 'Preview deployed successfully! 🚀' },
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
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [simStage, setSimStage] = useState<
    'idle' | 'transcribing' | 'analyzing' | 'chatting' | 'ready' | 'generating' | 'complete'
  >('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const simTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const apiResultRef = useRef<string | null>(null);
  const generationCompletedRef = useRef(false);
  const { toast: showToast } = useToast();
  const sessionIdRef = useRef<string>(`builder-${Date.now()}`);
  const [activeQuickReplies, setActiveQuickReplies] = useState<string[]>([]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Cleanup timers and WebSocket on unmount
  useEffect(() => {
    return () => {
      simTimerRef.current.forEach(clearTimeout);
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const hasStarted = chatMessages.length > 0 || simStage !== 'idle';
  const hasBusinessProfile = businessProfile !== null;
  const allChatMessages = chatMessages;

  const simulateTranscription = useCallback(() => {
    const fullText =
      "I own a bakery in Bangalore called The Flour Garden. We specialize in sourdough bread, custom cakes, and artisan pastries. We're located on Church Street. We're open Monday to Saturday 7AM to 9PM, and Sunday 8AM to 6PM. Our popular items include sourdough loaves, cinnamon rolls, and custom celebration cakes. We also do baking workshops on weekends.";

    setIsRecording(true);
    setSimStage('transcribing');
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        const chunkSize = Math.floor(Math.random() * 4) + 2;
        charIndex = Math.min(charIndex + chunkSize, fullText.length);
        setVoiceTranscript(fullText.substring(0, charIndex));
      } else {
        clearInterval(typeInterval);
        setIsRecording(false);
        setSimStage('analyzing');

        // Simulate analysis delay
        simTimerRef.current.push(
          setTimeout(() => {
            addChatMessage({
              id: `msg-${Date.now()}`,
              role: 'user',
              content: fullText,
              timestamp: Date.now(),
            });
            setSimStage('chatting');
            simulateChat(fullText);
          }, 1500)
        );
      }
    }, 40);
    simTimerRef.current.push(typeInterval);
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

      // Show business profile after a delay
      simTimerRef.current.push(
        setTimeout(() => {
          setBusinessProfile(MOCK_BUSINESS_PROFILE);
          setSimStage('ready');
        }, 800)
      );

      // Send one more automated follow-up after a delay
      simTimerRef.current.push(
        setTimeout(async () => {
          const followUp = await callChatAPI(
            'Tell me more about what you can help me with for my website.'
          );
          if (!followUp) return;

          addChatMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: followUp.response,
            timestamp: Date.now(),
          });
        }, 2500)
      );
    },
    [addChatMessage, callChatAPI, setBusinessProfile]
  );

  // Helper to finalize generation with the generated HTML
  const finalizeGeneration = useCallback(
    (generatedHtml: string, storefrontId: string, profile: BusinessProfile) => {
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

      addStorefront(newStorefront);
      setCurrentStorefront(newStorefront);
      updateGenerationStatus('complete', 'Website generated successfully!', 100);
      setSimStage('complete');
      generationCompletedRef.current = true;

      showToast({
        title: 'Website Generated!',
        description: 'Your storefront is ready for preview.',
      });
    },
    [addStorefront, setCurrentStorefront, updateGenerationStatus, showToast]
  );

  const handleGenerateWebsite = useCallback(() => {
    const profileToUse = businessProfile || MOCK_BUSINESS_PROFILE;
    const storefrontId = `sf-${Date.now()}`;
    const jobId = `job-${Date.now()}`;

    // Reset refs for this generation
    apiResultRef.current = null;
    generationCompletedRef.current = false;

    // Create the generation job in the store
    const newJob: GenerationJob = {
      id: jobId,
      storefrontId,
      status: 'idle',
      currentStep: 0,
      totalSteps: PIPELINE_STEPS.length,
      progress: 0,
      message: 'Starting generation...',
      startedAt: new Date().toISOString(),
      completedAt: null,
      voiceTranscript: voiceTranscript,
      businessProfile: profileToUse,
      logs: [],
    };
    setCurrentJob(newJob);
    setSimStage('generating');

    // --- Connect to WebSocket for real-time progress ---
    const socket = io('/?XTransformPort=3002', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Builder] WebSocket connected:', socket.id);

      // Emit start_generation to the WebSocket service
      socket.emit('start_generation', {
        storefrontId,
        businessProfile: profileToUse,
      });
    });

    socket.on('generation_progress', (data: {
      storefrontId: string;
      status: GenerationStatus;
      message: string;
      progress: number;
      agent: string;
      logs: GenerationLog[];
    }) => {
      // Update status and progress in the store
      updateGenerationStatus(data.status, data.message, data.progress);

      // Add any new logs from the event
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
    });

    socket.on('generation_complete', (data: {
      storefrontId: string;
      success: boolean;
    }) => {
      if (data.success) {
        // If the API already returned HTML, finalize now
        if (apiResultRef.current && !generationCompletedRef.current) {
          finalizeGeneration(apiResultRef.current, storefrontId, profileToUse);
        }
      } else {
        updateGenerationStatus('error', 'Generation failed on the server', 0);
        setSimStage('complete');
        showToast({
          title: 'Generation Failed',
          description: 'The server reported an error during generation.',
          variant: 'destructive',
        });
      }

      // Disconnect WebSocket after completion
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Builder] WebSocket connection error:', err.message);
      // Don't block — the API call will still proceed
    });

    // --- In parallel, call the API to generate HTML ---
    (async () => {
      try {
        const res = await fetch('/api/generate/website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessProfile: profileToUse }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}`);
        }

        const data = await res.json();

        if (data.success && data.html) {
          apiResultRef.current = data.html;

          // If WebSocket already completed, finalize now
          if (generationCompletedRef.current) {
            // Already completed via WebSocket, update the HTML
            const currentStorefront = useAppStore.getState().currentStorefront;
            if (currentStorefront) {
              // Update the existing storefront with the real HTML
              useAppStore.getState().updateStorefront(currentStorefront.id, {
                html: data.html,
                updatedAt: new Date().toISOString(),
              });
            }
          } else if (
            useAppStore.getState().currentJob?.status === 'complete' ||
            useAppStore.getState().currentJob?.status === 'idle'
          ) {
            // Pipeline already done, finalize immediately
            finalizeGeneration(data.html, storefrontId, profileToUse);
          }
          // Otherwise wait for WebSocket generation_complete event
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (error) {
        console.error('[Builder] API generation error:', error);
        if (!generationCompletedRef.current) {
          updateGenerationStatus('error', 'Failed to generate website HTML', 0);
          setSimStage('complete');
          showToast({
            title: 'Generation Error',
            description: error instanceof Error ? error.message : 'Failed to generate the website.',
            variant: 'destructive',
          });
        }
        // Disconnect WebSocket on error
        if (socketRef.current?.connected) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      }
    })();
  }, [voiceTranscript, businessProfile, setCurrentJob, updateGenerationStatus, addGenerationLog, finalizeGeneration, showToast]);

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

    // Show business profile after enough messages
    if (result.messageCount >= 2 && !businessProfile) {
      setTimeout(() => {
        setBusinessProfile(MOCK_BUSINESS_PROFILE);
        setSimStage('ready');
      }, 800);
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
    // Disconnect WebSocket
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    apiResultRef.current = null;
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
                            simulateTranscription();
                          } else if (isRecording) {
                            setIsRecording(false);
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
                          Speak naturally — AI will extract everything
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
                          {msg.content}
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
                      {(activeQuickReplies.length > 0 ? activeQuickReplies : QUICK_REPLIES).map((reply) => (
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
                <BusinessInfoCards profile={MOCK_BUSINESS_PROFILE} />
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
