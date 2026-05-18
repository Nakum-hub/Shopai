'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

// Lazy-loaded views
import { BuilderView } from '@/components/builder/builder-view';
import { PreviewView } from '@/components/preview/preview-view';
import { ProjectsView } from '@/components/projects/projects-view';
import { TemplatesView } from '@/components/templates/templates-view';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { SettingsView } from '@/components/settings/settings-view';
import { AgentsView } from '@/components/agents/agents-view';

const viewComponents: Record<string, React.ComponentType> = {
  builder: BuilderView,
  preview: PreviewView,
  projects: ProjectsView,
  templates: TemplatesView,
  agents: AgentsView,
  analytics: AnalyticsView,
  settings: SettingsView,
};

function AppContent() {
  const { currentView, sidebarOpen } = useAppStore();
  const ViewComponent = viewComponents[currentView] || BuilderView;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">
          <ViewComponent />
        </main>
        <footer className="mt-auto py-3 px-6 bg-card/50 backdrop-blur-sm border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2025 StoreCraft AI</span>
            <span>Voice-to-Website Platform</span>
            <span>v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}
