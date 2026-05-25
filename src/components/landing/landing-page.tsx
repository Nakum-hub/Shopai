'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Palette,
  Rocket,
  BarChart3,
  Layout,
  Globe,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DemoPreview } from './demo-preview';

// ---------------------------------------------------------------------------
// Auth callbacks — can be overridden by AuthGate via custom events
// ---------------------------------------------------------------------------

function triggerAuthAction(action: 'signin' | 'getstarted') {
  window.dispatchEvent(new CustomEvent('storecraft:auth', { detail: action }));
}

function authSignIn() {
  triggerAuthAction('signin');
}

function authGetStarted() {
  triggerAuthAction('getstarted');
}

// =============================================================================
// Animation Variants
// =============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// =============================================================================
// Template Data (showcase subset)
// =============================================================================

const FEATURED_TEMPLATES = [
  { name: 'Golden Crust Bakery', category: 'Bakery', image: '/templates/golden-crust-bakery.jpg' },
  { name: 'Restaurant Elegance', category: 'Restaurant', image: '/templates/restaurant-elegance.jpg' },
  { name: 'Sakura Sushi Bar', category: 'Restaurant', image: '/templates/sakura-sushi-bar.jpg' },
  { name: 'Beauty Salon', category: 'Salon', image: '/templates/beauty-salon.jpg' },
  { name: 'Tech Store Pro', category: 'Electronics', image: '/templates/tech-store-pro.jpg' },
  { name: 'Fashion Forward', category: 'Fashion', image: '/templates/fashion-forward.jpg' },
  { name: 'Zen Wellness Spa', category: 'Wellness', image: '/templates/zen-wellness-spa.jpg' },
  { name: 'Gaming Zone', category: 'Electronics', image: '/templates/gaming-zone.jpg' },
];

// =============================================================================
// Features Data
// =============================================================================

const FEATURES = [
  {
    icon: Mic,
    title: 'Voice Powered',
    description: 'Speak your business details naturally. Our AI understands context and creates professional content automatically.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Layout,
    title: '60+ Templates',
    description: 'Curated, industry-specific designs for bakeries, restaurants, salons, boutiques, and 7 more categories.',
    gradient: 'from-cyan-500 to-teal-500',
  },
  {
    icon: Sparkles,
    title: 'AI Generation',
    description: 'Intelligent content creation that writes copy, selects images, and designs layouts tailored to your brand.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description: 'Go from concept to live website in under 60 seconds. No coding, no waiting, no hassle.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Custom Domains',
    description: 'Connect your own domain name for a fully branded experience that builds trust with customers.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: BarChart3,
    title: 'Analytics Built-In',
    description: 'Track visitors, conversions, and engagement with a beautiful dashboard — no third-party tools needed.',
    gradient: 'from-blue-500 to-indigo-500',
  },
];

// =============================================================================
// Stats Data
// =============================================================================

const STATS = [
  { value: '60+', label: 'Templates' },
  { value: '11', label: 'Industries' },
  { value: 'AI', label: 'Powered' },
  { value: '60s', label: 'Setup' },
];

// =============================================================================
// Section Wrapper (for scroll animations)
// =============================================================================

function AnimatedSection({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// =============================================================================
// Navbar
// =============================================================================

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              StoreCraft <span className="text-zinc-400 font-medium">AI</span>
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Templates', id: 'templates' },
              { label: 'Demo', id: 'demo' },
            ].map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollTo(link.id)}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 rounded-lg hover:bg-zinc-800/50"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={authSignIn}
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
            >
              Sign In
            </Button>
            <Button
              onClick={authGetStarted}
              className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 rounded-lg"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={cn(
                  'w-full h-0.5 bg-current transition-all duration-300',
                  mobileMenuOpen && 'rotate-45 translate-y-1.75'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 bg-current transition-all duration-300',
                  mobileMenuOpen && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 bg-current transition-all duration-300',
                  mobileMenuOpen && '-rotate-45 -translate-y-1.75'
                )}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimateMobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </div>
    </motion.nav>
  );
}

function AnimateMobileMenu({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const scrollTo = useCallback((id: string) => {
    onClose();
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [onClose]);

  return (
    <motion.div
      initial={false}
      animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
      className="md:hidden overflow-hidden"
    >
      <div className="pb-4 pt-2 space-y-1">
        {[
          { label: 'Features', id: 'features' },
          { label: 'Templates', id: 'templates' },
          { label: 'Demo', id: 'demo' },
        ].map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => scrollTo(link.id)}
            className="block w-full text-left px-4 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-lg transition-colors"
          >
            {link.label}
          </button>
        ))}
        <div className="pt-3 px-4 flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={authSignIn}
            className="w-full border-zinc-700/50 bg-zinc-800/40 text-zinc-300"
          >
            Sign In
          </Button>
          <Button
            onClick={authGetStarted}
            className="w-full bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Hero Section
// =============================================================================

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900" />

        {/* Mesh pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Animated blobs */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[120px]"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2">
          <motion.div
            className="w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px]"
            animate={{
              scale: [1, 1.15, 1],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="w-[400px] h-[400px] rounded-full bg-fuchsia-500/8 blur-[100px]"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <motion.div style={{ y, opacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-24 pb-12">
        {/* Badge */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm bg-zinc-800/40 border-zinc-700/50 text-zinc-300 backdrop-blur-sm rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
            AI-Powered Website Builder
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Turn Your Voice Into
          </span>
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            a Stunning Website
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Describe your business in plain language. AI builds your complete,
          professional website in under 60 seconds. No coding required.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
        >
          <Button
            onClick={() =>
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
            }
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-xl shadow-violet-500/25 rounded-xl px-8 h-12 text-base"
          >
            Try the Demo
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            onClick={authGetStarted}
            size="lg"
            variant="outline"
            className="border-zinc-700/60 bg-zinc-800/30 hover:bg-zinc-800/70 text-zinc-200 hover:text-zinc-100 rounded-xl px-8 h-12 text-base backdrop-blur-sm"
          >
            Get Started Free
          </Button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex items-center justify-center gap-6 sm:gap-10"
        >
          {STATS.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="mt-16"
        >
          <motion.button
            type="button"
            onClick={() =>
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
            }
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex flex-col items-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <span className="text-xs">See it in action</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Animated Website Preview Skeleton */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          custom={5}
          className="mt-8 max-w-3xl mx-auto hidden lg:block"
        >
          <div className="relative rounded-xl border border-zinc-700/30 bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-700/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 bg-zinc-800/50 rounded-md px-3 py-1 text-xs text-zinc-500 font-mono text-center">
                www.your-bakery.com
              </div>
            </div>
            {/* Mock content */}
            <div className="p-6 space-y-4">
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-8 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-lg w-2/3"
              />
              <motion.div
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="h-4 bg-zinc-700/30 rounded w-full"
              />
              <motion.div
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
                className="h-4 bg-zinc-700/30 rounded w-5/6"
              />
              <div className="flex gap-3 pt-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                    className="flex-1 h-24 bg-zinc-700/20 rounded-lg border border-zinc-700/20"
                  />
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.2 }}
                  className="flex-1 h-4 bg-zinc-700/20 rounded"
                />
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  className="flex-1 h-4 bg-zinc-700/20 rounded"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Demo Section
// =============================================================================

function DemoSection() {
  return (
    <AnimatedSection
      id="demo"
      className="relative py-20 sm:py-28 px-4 sm:px-6"
    >
      {/* Background accents */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs bg-violet-500/10 border-violet-500/20 text-violet-400 mb-4 rounded-full"
          >
            <Zap className="w-3 h-3 mr-1" />
            Interactive Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              See It in Action
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Type any business description and watch AI build a complete, professional
            website in seconds.
          </p>
        </motion.div>

        {/* Demo Component */}
        <motion.div variants={fadeInUp}>
          <DemoPreview />
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// =============================================================================
// Features Section
// =============================================================================

function FeaturesSection() {
  return (
    <AnimatedSection
      id="features"
      className="relative py-20 sm:py-28 px-4 sm:px-6"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs bg-cyan-500/10 border-cyan-500/20 text-cyan-400 mb-4 rounded-full"
          >
            <Palette className="w-3 h-3 mr-1" />
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Everything You Need to
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Launch Your Business Online
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            From voice input to deployment, StoreCraft AI handles every step so you
            can focus on what matters — your business.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((feature, index) => (
            <motion.div key={feature.title} variants={fadeInUp} custom={index}>
              <Card className="group relative bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/60 backdrop-blur-sm overflow-hidden rounded-xl transition-all duration-300 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-violet-500/5 h-full">
                {/* Gradient border effect on hover */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-px -z-10',
                    'bg-gradient-to-br',
                    feature.gradient
                  )}
                />
                <CardContent className="p-5 sm:p-6 relative">
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110',
                      'bg-gradient-to-br',
                      feature.gradient
                    )}
                  >
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  {/* Text */}
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

// =============================================================================
// Templates Section
// =============================================================================

function TemplatesSection() {
  return (
    <AnimatedSection
      id="templates"
      className="relative py-20 sm:py-28 px-4 sm:px-6"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div variants={fadeInUp} className="text-center mb-16">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs bg-amber-500/10 border-amber-500/20 text-amber-400 mb-4 rounded-full"
          >
            <Layout className="w-3 h-3 mr-1" />
            Template Library
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              60+ Industry-Specific Templates
            </span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Professionally designed templates for every industry, ready to customize
            with your brand colors and content.
          </p>
        </motion.div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURED_TEMPLATES.map((template, index) => (
            <motion.div key={template.name} variants={scaleIn} custom={index}>
              <div className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900/50 cursor-pointer transition-all duration-300 hover:border-zinc-600/50 hover:shadow-xl hover:shadow-violet-500/5 hover:scale-[1.02]">
                {/* Template Preview Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${template.image})` }}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="secondary"
                    className="bg-zinc-900/80 backdrop-blur-sm text-zinc-300 border-zinc-700/50 text-[10px] px-2 py-0.5"
                  >
                    {template.category}
                  </Badge>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/10 transition-colors duration-300" />

                {/* Name & arrow at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                        {template.name}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <ExternalLink className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Browse All Button */}
        <motion.div variants={fadeInUp} className="text-center mt-10">
          <Button
            onClick={() => signIn()}
            variant="outline"
            size="lg"
            className="border-zinc-700/50 bg-zinc-800/30 hover:bg-zinc-800/70 text-zinc-200 hover:text-zinc-100 rounded-xl px-8 h-11 backdrop-blur-sm group"
          >
            Browse All Templates
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

// =============================================================================
// CTA Section
// =============================================================================

function CTASection() {
  return (
    <AnimatedSection className="relative py-20 sm:py-28 px-4 sm:px-6">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      <motion.div variants={fadeInUp} className="max-w-3xl mx-auto text-center">
        <div className="relative rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm p-8 sm:p-12 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-gradient-to-b from-violet-500/10 to-transparent blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                Ready to Build Your Website?
              </span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Join thousands of small businesses who&apos;ve gone online with
              StoreCraft AI. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => signIn()}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-xl shadow-violet-500/25 rounded-xl px-8 h-12 text-base"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="text-zinc-400 hover:text-zinc-200 rounded-xl px-6 h-12"
              >
                Try the demo first
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatedSection>
  );
}

// =============================================================================
// Footer
// =============================================================================

function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold tracking-tight">
                StoreCraft <span className="text-zinc-400 font-medium">AI</span>
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Built with AI, designed for humans.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((link) => (
              <button
                key={link}
                type="button"
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} StoreCraft AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// Main Landing Page
// =============================================================================

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <DemoSection />
      <FeaturesSection />
      <TemplatesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
