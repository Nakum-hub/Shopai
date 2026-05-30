'use client';

import React from 'react';
import { Bell, Moon, Sun, LogOut, User, Settings, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession, signOut } from 'next-auth/react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  agents: 'AI Agents',
  analytics: 'Analytics',
  settings: 'Settings',
};

const viewDescriptions: Record<string, string> = {
  builder: 'Describe your business and let AI build your storefront',
  preview: 'Preview and customize your generated storefront',
  projects: 'Manage all your generated storefronts',
  templates: 'Browse business-specific templates',
  agents: 'Monitor and manage your AI agent fleet',
  analytics: 'Track storefront performance and insights',
  settings: 'Configure your platform preferences',
};

export function AppHeader() {
  const { currentView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Get user initials for avatar fallback
  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SC';

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

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
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You&apos;ll see updates about your storefronts here
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar — shows real auth data */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <Avatar className="h-7 w-7">
                {session?.user?.image && (
                  <AvatarImage src={session.user.image} alt={session.user.name || ''} />
                )}
                <AvatarFallback className="text-xs bg-gradient-to-br from-violet-600 to-cyan-500 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{session?.user?.name || 'StoreCraft User'}</span>
                <span className="text-xs font-normal text-muted-foreground truncate">
                  {session?.user?.email || 'Free Plan'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => useAppStore.getState().setCurrentView('settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
