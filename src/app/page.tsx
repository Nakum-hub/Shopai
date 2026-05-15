'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

// Lazy-loaded views
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { WorkspaceView } from '@/components/workspace/workspace-view';
import { AgentsView } from '@/components/agents/agents-view';
import { ProjectsView } from '@/components/projects/projects-view';
import { SandboxView } from '@/components/sandbox/sandbox-view';
import { MemoryView } from '@/components/memory/memory-view';
import { SettingsView } from '@/components/settings/settings-view';

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardView,
  workspace: WorkspaceView,
  agents: AgentsView,
  projects: ProjectsView,
  sandbox: SandboxView,
  memory: MemoryView,
  settings: SettingsView,
};

function AppContent() {
  const { currentView, sidebarOpen } = useAppStore();
  const ViewComponent = viewComponents[currentView] || DashboardView;

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
