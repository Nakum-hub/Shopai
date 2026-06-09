'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthGate } from '@/components/auth-gate';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { getCsrfToken } from '@/lib/csrf';

// Lazy-loaded views (dynamic imports for code splitting)
// Previously static imports — now lazy-loaded for performance:
// import { BuilderView } from '@/components/builder/builder-view';
// import { PreviewView } from '@/components/preview/preview-view';
// import { ProjectsView } from '@/components/projects/projects-view';
// import { TemplatesView } from '@/components/templates/templates-view';
// import { BlocksView } from '@/components/blocks/blocks-view';
// import { DesignLibraryView } from '@/components/design-library/design-library-view';
// import { AnalyticsView } from '@/components/analytics/analytics-view';
// import { SettingsView } from '@/components/settings/settings-view';
// import { AgentsView } from '@/components/agents/agents-view';

import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';

const BuilderView = dynamic(() => import('@/components/builder/builder-view').then(m => ({ default: m.BuilderView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const PreviewView = dynamic(() => import('@/components/preview/preview-view').then(m => ({ default: m.PreviewView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const ProjectsView = dynamic(() => import('@/components/projects/projects-view').then(m => ({ default: m.ProjectsView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const TemplatesView = dynamic(() => import('@/components/templates/templates-view').then(m => ({ default: m.TemplatesView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const BlocksView = dynamic(() => import('@/components/blocks/blocks-view').then(m => ({ default: m.BlocksView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const DesignLibraryView = dynamic(() => import('@/components/design-library/design-library-view').then(m => ({ default: m.DesignLibraryView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const AnalyticsView = dynamic(() => import('@/components/analytics/analytics-view').then(m => ({ default: m.AnalyticsView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const SettingsView = dynamic(() => import('@/components/settings/settings-view').then(m => ({ default: m.SettingsView })), {
  loading: () => <ViewLoadingSkeleton />,
});
const AgentsView = dynamic(() => import('@/components/agents/agents-view').then(m => ({ default: m.AgentsView })), {
  loading: () => <ViewLoadingSkeleton />,
});

function ViewLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading view...</p>
      </div>
    </div>
  );
}

const viewComponents: Record<string, React.ComponentType> = {
  builder: BuilderView,
  preview: PreviewView,
  projects: ProjectsView,
  templates: TemplatesView,
  blocks: BlocksView,
  'design-library': DesignLibraryView,
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
          sidebarOpen ? 'lg:ml-64 ml-0' : 'lg:ml-16 ml-0'
        )}
      >
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">
          <ErrorBoundary>
            <ViewComponent />
          </ErrorBoundary>
        </main>
        <footer className="mt-auto py-3 px-6 bg-card/50 backdrop-blur-sm border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} StoreCraft AI</span>
            <span>Voice-to-Website Platform</span>
            <span>v2.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function Home() {
  // Install global CSRF fetch interceptor — adds X-CSRF-Token header to all mutations
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = function csrfFetch(input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || 'GET').toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          const headers = new Headers(init?.headers);
          if (!headers.has('X-CSRF-Token')) {
            headers.set('X-CSRF-Token', csrfToken);
          }
          return originalFetch.call(this, input, { ...init, headers });
        }
      }
      return originalFetch.call(this, input, init);
    };
    return () => { window.fetch = originalFetch; };
  }, []);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthGate>
        <AppContent />
      </AuthGate>
      <Toaster />
    </ThemeProvider>
  );
}
