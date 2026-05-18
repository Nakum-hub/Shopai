'use client';

import React from 'react';
import {
  Sparkles,
  Eye,
  FolderKanban,
  LayoutTemplate,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import type { ViewType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { id: 'builder', label: 'AI Builder', icon: Sparkles, badge: 'New', badgeColor: 'bg-emerald-500' },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'projects', label: 'My Storefronts', icon: FolderKanban, badge: '3', badgeColor: 'bg-sky-500' },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-3 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-500/20">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  StoreCraft
                </span>
                <span className="ml-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">AI</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            const button = (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 h-9 px-3 relative overflow-hidden group',
                  isActive && 'bg-accent text-accent-foreground font-medium',
                  !sidebarOpen && 'justify-center px-0'
                )}
                onClick={() => setCurrentView(item.id)}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-accent rounded-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0 relative z-10" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap relative z-10"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarOpen && item.badge && (
                  <Badge
                    className={cn(
                      'ml-auto text-[10px] px-1.5 py-0 h-4 text-white border-0',
                      item.badgeColor || 'bg-primary'
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    {item.label}
                    {item.badge && (
                      <Badge className={cn('text-[10px] px-1.5 py-0 h-4 text-white border-0', item.badgeColor)}>
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Pro Badge / CTA */}
        {sidebarOpen && (
          <div className="px-3 mb-2">
            <div className="rounded-xl bg-gradient-to-br from-violet-600/10 to-cyan-500/10 border border-violet-500/20 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-semibold">Voice-to-Website</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Speak your business details and watch AI build your storefront instantly
              </p>
              <Button
                size="sm"
                className="w-full mt-2.5 h-7 text-xs bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90"
                onClick={() => setCurrentView('builder')}
              >
                Try Now
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-2">
          <Separator className="mb-2" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
