'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Loader2,
  Check,
  ArrowRight,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { SandboxedPreview } from '@/components/preview/sandboxed-preview';

// =============================================================================
// Types
// =============================================================================

type DeviceView = 'mobile' | 'tablet' | 'desktop';

type GenerationPhase =
  | 'idle'
  | 'analyzing'
  | 'selecting'
  | 'building'
  | 'polishing'
  | 'complete'
  | 'error';

interface GenerationResult {
  html: string;
  category: string;
  businessName: string;
  generationTime: string;
}

// =============================================================================
// Constants
// =============================================================================

const GENERATION_STEPS: { phase: GenerationPhase; label: string; duration: number }[] = [
  { phase: 'analyzing', label: 'Analyzing your business...', duration: 1200 },
  { phase: 'selecting', label: 'Selecting the perfect design...', duration: 1000 },
  { phase: 'building', label: 'Building sections...', duration: 1500 },
  { phase: 'polishing', label: 'Polishing the final result...', duration: 800 },
];

const SUGGESTED_EXAMPLES = [
  'Italian restaurant in Bangalore',
  'Yoga studio in Austin',
  'Coffee roastery in Portland',
  'Artisan bakery in Brooklyn',
  'Barbershop in London',
  'Flower shop in Paris',
];

const DEVICE_WIDTHS: Record<DeviceView, string> = {
  mobile: 'w-[375px] max-w-full',
  tablet: 'w-[768px] max-w-full',
  desktop: 'w-full',
};

const DEVICE_HEIGHTS: Record<DeviceView, number> = {
  mobile: 580,
  tablet: 500,
  desktop: 520,
};

const CATEGORY_LABELS: Record<string, string> = {
  bakery: 'Bakery & Cafe',
  restaurant: 'Restaurant',
  clothing: 'Fashion & Apparel',
  electronics: 'Electronics & Tech',
  salon: 'Salon & Wellness',
  grocery: 'Grocery & Market',
  hardware: 'Hardware & Tools',
  medical: 'Healthcare',
  boutique: 'Boutique',
  service: 'Services',
  other: 'Business',
};

// =============================================================================
// Browser Frame Component
// =============================================================================

function BrowserFrame({
  children,
  device,
  businessName,
}: {
  children: React.ReactNode;
  device: DeviceView;
  businessName?: string;
}) {
  return (
    <div
      className={cn(
        'relative mx-auto transition-all duration-500 ease-out',
        DEVICE_WIDTHS[device]
      )}
    >
      {/* Browser Chrome */}
      <div className="rounded-t-xl bg-zinc-800 border border-b-0 border-zinc-700/50 overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>

          {/* URL Bar */}
          <div className="flex-1 flex items-center gap-2 bg-zinc-900/60 rounded-md px-3 py-1">
            <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 truncate font-mono">
              {businessName
                ? `www.${businessName.toLowerCase().replace(/\s+/g, '')}.com`
                : 'www.your-business.com'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <LockIcon className="w-3 h-3 text-green-400/70" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="border border-t-0 border-zinc-700/50 rounded-b-xl overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// =============================================================================
// Loading Animation Component
// =============================================================================

function LoadingAnimation({ currentPhase }: { currentPhase: GenerationPhase }) {
  const currentStepIndex = GENERATION_STEPS.findIndex((s) => s.phase === currentPhase);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Animated orbs */}
      <div className="relative w-24 h-24 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 opacity-30 blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {GENERATION_STEPS.map((step, index) => {
          const isActive = step.phase === currentPhase;
          const isComplete = currentStepIndex > index;
          const isPending = currentStepIndex < index;

          return (
            <motion.div
              key={step.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isComplete ? (
                    <motion.div
                      key="complete"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                  ) : isActive ? (
                    <motion.div
                      key="loading"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-2 h-2 rounded-full bg-zinc-600"
                    />
                  )}
                </AnimatePresence>
              </div>
              <span
                className={cn(
                  'text-sm transition-colors duration-300',
                  isComplete && 'text-emerald-400/80',
                  isActive && 'text-foreground font-medium',
                  isPending && 'text-zinc-600'
                )}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// Main Demo Preview Component
// =============================================================================

export function DemoPreview() {
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [device, setDevice] = useState<DeviceView>('desktop');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll into view when result is ready
  useEffect(() => {
    if (phase === 'complete' && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [phase]);

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      toast({
        title: 'Please describe a business',
        description: 'Type something like "Italian restaurant in Bangalore" to get started.',
        variant: 'destructive',
      });
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length < 5) {
      toast({
        title: 'Too short',
        description: 'Please provide a more detailed business description (at least 5 characters).',
        variant: 'destructive',
      });
      inputRef.current?.focus();
      return;
    }

    setResult(null);
    setPhase('analyzing');

    try {
      // Step through loading phases sequentially
      for (let i = 0; i < GENERATION_STEPS.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, GENERATION_STEPS[i].duration));
        if (i < GENERATION_STEPS.length - 1) {
          setPhase(GENERATION_STEPS[i + 1].phase);
        }
      }

      // Call the API
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message =
          errorData?.error?.message ||
          errorData?.message ||
          'Something went wrong. Please try again.';
        throw new Error(message);
      }

      const data = await response.json();
      const html = data?.data?.html || data?.html || '';

      if (!html) {
        throw new Error('No website was generated. Please try a different description.');
      }

      setResult({
        html,
        category: data?.data?.category || 'other',
        businessName: data?.data?.businessName || 'Generated Business',
        generationTime: data?.data?.generationTime || data?.generationTime || '',
      });
      setPhase('complete');
    } catch (err) {
      setPhase('error');
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast({
        title: 'Generation failed',
        description: message,
        variant: 'destructive',
      });
    }
  }, [description]);

  const handleTryAnother = useCallback(() => {
    setPhase('idle');
    setResult(null);
    setDescription('');
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && (phase === 'idle' || phase === 'complete' || phase === 'error')) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate, phase]
  );

  const handleExampleClick = useCallback((example: string) => {
    setDescription(example);
    inputRef.current?.focus();
  }, []);

  const isGenerating = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Input Area */}
      <div className="space-y-4">
        {/* Search-style Input */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-2 shadow-lg shadow-violet-500/5 backdrop-blur-sm">
            <div className="pl-3 flex-1">
              <Input
                ref={inputRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Italian restaurant in Bangalore"
                disabled={isGenerating}
                className="border-0 bg-transparent h-auto px-0 py-2 text-base md:text-lg focus-visible:ring-0 focus-visible:border-0 placeholder:text-zinc-500"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim()}
              size="lg"
              className="shrink-0 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/25 rounded-xl px-6 h-11"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Suggested Examples */}
        <div className="flex flex-wrap items-center gap-2 justify-center">
          <span className="text-xs text-zinc-500 hidden sm:inline">Try:</span>
          {SUGGESTED_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isGenerating}
              className="text-xs px-3 py-1.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600/60 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Result Area */}
      <div ref={scrollRef} className="mt-10">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-zinc-700/40 bg-zinc-900/40 backdrop-blur-sm overflow-hidden"
            >
              <LoadingAnimation currentPhase={phase} />
            </motion.div>
          )}

          {/* Complete State */}
          {phase === 'complete' && result && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Generated
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-zinc-800/50 border-zinc-700/50 text-zinc-300 text-xs"
                  >
                    {CATEGORY_LABELS[result.category] || result.category}
                  </Badge>
                  {result.generationTime && (
                    <span className="text-xs text-zinc-500">
                      in {result.generationTime}
                    </span>
                  )}
                </div>

                {/* Device Switcher */}
                <div className="flex items-center gap-1 bg-zinc-800/60 rounded-lg p-1 border border-zinc-700/40">
                  {([
                    { key: 'mobile' as DeviceView, icon: Smartphone },
                    { key: 'tablet' as DeviceView, icon: Tablet },
                    { key: 'desktop' as DeviceView, icon: Monitor },
                  ]).map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDevice(key)}
                      className={cn(
                        'p-1.5 rounded-md transition-all duration-200',
                        device === key
                          ? 'bg-zinc-700/80 text-zinc-100 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Browser Frame with Preview */}
              <div className="rounded-2xl border border-zinc-700/40 bg-zinc-900/40 backdrop-blur-sm overflow-hidden shadow-2xl shadow-violet-500/5">
                <BrowserFrame device={device} businessName={result.businessName}>
                  <div
                    className={cn(
                      'mx-auto transition-all duration-500 ease-out overflow-hidden',
                      device === 'mobile' && 'max-w-[375px]',
                      device === 'tablet' && 'max-w-[768px]',
                      device === 'desktop' && 'max-w-full'
                    )}
                    style={{ maxHeight: DEVICE_HEIGHTS[device] }}
                  >
                    <SandboxedPreview
                      html={result.html}
                      title={`${result.businessName} Preview`}
                      height={DEVICE_HEIGHTS[device]}
                      businessName={result.businessName}
                      className="w-full"
                    />
                  </div>
                </BrowserFrame>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
              >
                <Button
                  variant="outline"
                  onClick={handleTryAnother}
                  className="gap-2 rounded-xl border-zinc-700/50 bg-zinc-800/40 hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100 px-5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Another
                </Button>
                <Button
                  className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 px-6"
                  onClick={() => {
                    toast({
                      title: 'Welcome aboard!',
                      description: 'Sign in to save and customize your generated website.',
                    });
                  }}
                >
                  Build Your Own
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
            >
              <p className="text-sm text-red-400 mb-4">
                Something went wrong during generation. Please try again.
              </p>
              <Button
                variant="outline"
                onClick={handleTryAnother}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
