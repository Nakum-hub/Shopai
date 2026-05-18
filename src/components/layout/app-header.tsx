'use client';

import React from 'react';
import { Bell, Moon, Sun, Globe } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const viewTitles: Record<string, string> = {
  builder: 'AI Builder',
  preview: 'Storefront Preview',
  projects: 'My Storefronts',
  templates: 'Templates',
  analytics: 'Analytics',
  settings: 'Settings',
};

const viewDescriptions: Record<string, string> = {
  builder: 'Describe your business and let AI build your storefront',
  preview: 'Preview and customize your generated storefront',
  projects: 'Manage all your generated storefronts',
  templates: 'Browse business-specific templates',
  analytics: 'Track storefront performance and insights',
  settings: 'Configure your platform preferences',
};

export function AppHeader() {
  const { currentView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold">{viewTitles[currentView] || 'Dashboard'}</h1>
        <span className="hidden sm:inline text-xs text-muted-foreground">
          — {viewDescriptions[currentView] || ''}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium">Storefront published successfully</span>
              <span className="text-xs text-muted-foreground">Sweet Dreams Bakery is now live</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium">SEO score improved to 92</span>
              <span className="text-xs text-muted-foreground">Auto-optimization applied to meta tags</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium">New template available</span>
              <span className="text-xs text-muted-foreground">Restaurant Pro v2.0 — with online ordering</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
                  SC
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>StoreCraft User</span>
                <span className="text-xs font-normal text-muted-foreground">Free Plan</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Documentation</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
