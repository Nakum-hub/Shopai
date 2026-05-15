'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  Terminal,
  GitBranch,
  AlertCircle,
  CheckCircle,
  Copy,
  Play,
  RotateCcw,
  Search,
  MoreHorizontal,
  Bot,
  Braces,
  FileType2,
  Database,
  Palette,
  Settings,
  Box,
  FileJson,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import type { WorkspaceFile, TerminalLine } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock file tree structure
// ---------------------------------------------------------------------------

const FILE_TREE: WorkspaceFile[] = [
  {
    name: 'src',
    path: 'src',
    type: 'folder',
    children: [
      {
        name: 'app',
        path: 'src/app',
        type: 'folder',
        children: [
          {
            name: 'page.tsx',
            path: 'src/app/page.tsx',
            type: 'file',
            language: 'tsx',
          },
          {
            name: 'layout.tsx',
            path: 'src/app/layout.tsx',
            type: 'file',
            language: 'tsx',
          },
          {
            name: 'globals.css',
            path: 'src/app/globals.css',
            type: 'file',
            language: 'css',
          },
          {
            name: 'api',
            path: 'src/app/api',
            type: 'folder',
            children: [
              {
                name: 'agents',
                path: 'src/app/api/agents',
                type: 'folder',
                children: [
                  {
                    name: 'route.ts',
                    path: 'src/app/api/agents/route.ts',
                    type: 'file',
                    language: 'typescript',
                  },
                ],
              },
              {
                name: 'projects',
                path: 'src/app/api/projects',
                type: 'folder',
                children: [
                  {
                    name: 'route.ts',
                    path: 'src/app/api/projects/route.ts',
                    type: 'file',
                    language: 'typescript',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'components',
        path: 'src/components',
        type: 'folder',
        children: [
          {
            name: 'ui',
            path: 'src/components/ui',
            type: 'folder',
            children: [
              {
                name: 'button.tsx',
                path: 'src/components/ui/button.tsx',
                type: 'file',
                language: 'tsx',
              },
              {
                name: 'card.tsx',
                path: 'src/components/ui/card.tsx',
                type: 'file',
                language: 'tsx',
              },
              {
                name: 'input.tsx',
                path: 'src/components/ui/input.tsx',
                type: 'file',
                language: 'tsx',
              },
            ],
          },
          {
            name: 'dashboard',
            path: 'src/components/dashboard',
            type: 'folder',
            children: [
              {
                name: 'dashboard-view.tsx',
                path: 'src/components/dashboard/dashboard-view.tsx',
                type: 'file',
                language: 'tsx',
              },
            ],
          },
          {
            name: 'workspace',
            path: 'src/components/workspace',
            type: 'folder',
            children: [
              {
                name: 'workspace-view.tsx',
                path: 'src/components/workspace/workspace-view.tsx',
                type: 'file',
                language: 'tsx',
              },
              {
                name: 'file-explorer.tsx',
                path: 'src/components/workspace/file-explorer.tsx',
                type: 'file',
                language: 'tsx',
              },
              {
                name: 'code-editor.tsx',
                path: 'src/components/workspace/code-editor.tsx',
                type: 'file',
                language: 'tsx',
              },
            ],
          },
        ],
      },
      {
        name: 'lib',
        path: 'src/lib',
        type: 'folder',
        children: [
          {
            name: 'utils.ts',
            path: 'src/lib/utils.ts',
            type: 'file',
            language: 'typescript',
          },
          {
            name: 'types.ts',
            path: 'src/lib/types.ts',
            type: 'file',
            language: 'typescript',
          },
          {
            name: 'db.ts',
            path: 'src/lib/db.ts',
            type: 'file',
            language: 'typescript',
          },
        ],
      },
      {
        name: 'store',
        path: 'src/store',
        type: 'folder',
        children: [
          {
            name: 'app-store.ts',
            path: 'src/store/app-store.ts',
            type: 'file',
            language: 'typescript',
          },
        ],
      },
    ],
  },
  {
    name: 'prisma',
    path: 'prisma',
    type: 'folder',
    children: [
      {
        name: 'schema.prisma',
        path: 'prisma/schema.prisma',
        type: 'file',
        language: 'prisma',
      },
      {
        name: 'seed.ts',
        path: 'prisma/seed.ts',
        type: 'file',
        language: 'typescript',
      },
    ],
  },
  {
    name: 'public',
    path: 'public',
    type: 'folder',
    children: [
      {
        name: 'favicon.ico',
        path: 'public/favicon.ico',
        type: 'file',
        language: 'plaintext',
      },
    ],
  },
  {
    name: 'package.json',
    path: 'package.json',
    type: 'file',
    language: 'json',
  },
  {
    name: 'tsconfig.json',
    path: 'tsconfig.json',
    type: 'file',
    language: 'json',
  },
  {
    name: 'next.config.ts',
    path: 'next.config.ts',
    type: 'file',
    language: 'typescript',
  },
  {
    name: 'tailwind.config.ts',
    path: 'tailwind.config.ts',
    type: 'file',
    language: 'typescript',
  },
  {
    name: 'README.md',
    path: 'README.md',
    type: 'file',
    language: 'markdown',
  },
  {
    name: '.env.local',
    path: '.env.local',
    type: 'file',
    language: 'plaintext',
  },
  {
    name: '.gitignore',
    path: '.gitignore',
    type: 'file',
    language: 'plaintext',
  },
];

// ---------------------------------------------------------------------------
// Mock file contents — realistic Next.js / React code
// ---------------------------------------------------------------------------

const FILE_CONTENTS: Record<string, string> = {
  'src/app/page.tsx': `'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { WorkspaceView } from '@/components/workspace/workspace-view';
import { AgentsView } from '@/components/agents/agents-view';

type ViewType = 'dashboard' | 'workspace' | 'agents' | 'projects' | 'sandbox' | 'memory';

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'workspace', label: 'Workspace', icon: <CodeIcon /> },
  { id: 'agents', label: 'Agents', icon: <BotIcon /> },
  { id: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { id: 'sandbox', label: 'Sandbox', icon: <ContainerIcon /> },
  { id: 'memory', label: 'Memory', icon: <BrainIcon /> },
];

export default function HomePage() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading AgentForge...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'workspace': return <WorkspaceView />;
      case 'agents': return <AgentsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'border-r bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Bot className="h-6 w-6 text-primary" />
          {sidebarOpen && (
            <span className="ml-2 font-bold text-lg">AgentForge</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                currentView === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}`,

  'src/app/layout.tsx': `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentForge - Autonomous AI Engineering Platform',
  description: 'Multi-agent orchestration platform for autonomous software engineering',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}`,

  'src/app/globals.css': `@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 262 83% 58%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 262 83% 58%;
  --radius: 0.5rem;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 5.5%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 5.5%;
  --popover-foreground: 0 0% 98%;
  --primary: 262 83% 58%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 262 83% 58%;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}`,

  'src/app/api/agents/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const agents = await db.agent.findMany({
      where: {
        ...(status && { status }),
        ...(type && { type }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error('[AGENTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, model, description, capabilities } = body;

    if (!name || !type || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, model' },
        { status: 400 }
      );
    }

    const agent = await db.agent.create({
      data: {
        name,
        type,
        model,
        description,
        capabilities: capabilities || [],
        config: {},
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error('[AGENTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}`,

  'src/app/api/projects/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const projects = await db.project.findMany({
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('[PROJECTS_GET]', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, framework, stack } = body;

    const project = await db.project.create({
      data: {
        name,
        description,
        framework: framework || 'next',
        stack: stack || 'typescript',
        status: 'active',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('[PROJECTS_POST]', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}`,

  'src/components/ui/button.tsx': `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };`,

  'src/components/ui/card.tsx': `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };`,

  'src/components/ui/input.tsx': `import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };`,

  'src/components/dashboard/dashboard-view.tsx': `'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';

export function DashboardView() {
  const { systemStatus } = useAppStore();

  return (
    <motion.div
      className="flex flex-col gap-6 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time overview of your autonomous engineering platform
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="py-5">
          <CardContent className="flex items-center gap-4 px-6">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <span className="text-emerald-500">🤖</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Active Agents
              </p>
              <p className="text-2xl font-bold tracking-tight">7<span className="text-base text-muted-foreground font-normal">/9</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}`,

  'src/components/workspace/workspace-view.tsx': `'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  File, Folder, FolderOpen, ChevronRight, ChevronDown, X,
  Terminal, GitBranch, AlertCircle, CheckCircle, Copy, Play, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function WorkspaceView() {
  // State for expanded folders, active file, etc.
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['src', 'src/app', 'src/components', 'src/lib'])
  );

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div className="w-60 border-r bg-card">
        {/* Explorer header */}
        <div className="flex items-center justify-between px-3 h-10 border-b">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
          </span>
        </div>
        {/* File tree */}
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="p-1">
            {/* Render file tree items */}
          </div>
        </ScrollArea>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="flex items-center h-9 bg-muted/50 border-b px-1">
          {/* Active tab */}
        </div>

        {/* Code editor */}
        <div className="flex-1 bg-[#282c34] overflow-auto">
          <SyntaxHighlighter
            language="tsx"
            style={oneDark}
            showLineNumbers
            customStyle={{
              margin: 0,
              padding: '16px 0',
              background: '#282c34',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
            lineNumberStyle={{
              minWidth: '50px',
              paddingRight: '16px',
              color: '#636d83',
              userSelect: 'none',
            }}
          >
            {\'// Code content here\'}
          </SyntaxHighlighter>
        </div>

        {/* Terminal panel */}
        <ResizablePanelGroup direction="vertical">
          <ResizableHandle />
          <ResizablePanel defaultSize={30} minSize={15} maxSize={60}>
            <div className="border-t bg-card">
              <div className="flex items-center h-9 border-b px-2 gap-1">
                <span className="text-xs font-medium text-muted-foreground">Terminal</span>
              </div>
              <div className="p-3 font-mono text-xs">
                <p className="text-emerald-400">$ bun run dev</p>
                <p className="text-muted-foreground mt-1">Ready on http://localhost:3000</p>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}`,

  'src/components/workspace/file-explorer.tsx': `'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { WorkspaceFile } from '@/lib/types';

interface FileExplorerProps {
  files: WorkspaceFile[];
  activePath: string | null;
  onFileSelect: (file: WorkspaceFile) => void;
}

export function FileExplorer({ files, activePath, onFileSelect }: FileExplorerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['src']));

  const toggleFolder = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="p-1">
      {files.map((file) => (
        <FileTreeItem
          key={file.path}
          file={file}
          depth={0}
          expanded={expanded}
          activePath={activePath}
          onToggle={toggleFolder}
          onSelect={onFileSelect}
        />
      ))}
    </div>
  );
}`,

  'src/components/workspace/code-editor.tsx': `'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  code: string;
  language: string;
  filename: string;
}

export function CodeEditor({ code, language, filename }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative flex-1 bg-[#282c34] overflow-auto">
      <div className="absolute top-2 right-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers
        customStyle={{
          margin: 0,
          padding: '16px 0',
          background: '#282c34',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
        lineNumberStyle={{
          minWidth: '50px',
          paddingRight: '16px',
          color: '#636d83',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}`,

  'src/lib/utils.ts': `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}`,

  'src/lib/types.ts': `// Agent Types
export type AgentType = 'planner' | 'frontend' | 'backend' | 'database' | 'devops' | 'security' | 'testing' | 'refactor' | 'documentation';
export type AgentStatus = 'idle' | 'working' | 'error' | 'completed';
export type AgentModel = 'claude-4-opus' | 'claude-4-sonnet' | 'gpt-5' | 'deepseek-v3' | 'gemini-2.5-flash' | 'llama-4';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  model: AgentModel;
  description: string | null;
  capabilities: string[];
  config: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

// Workspace
export interface WorkspaceFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: WorkspaceFile[];
}

export interface TerminalLine {
  id: string;
  text: string;
  type: 'input' | 'output' | 'error' | 'info' | 'success';
  timestamp: number;
}

// Navigation
export type ViewType = 'dashboard' | 'workspace' | 'agents' | 'projects' | 'sandbox' | 'memory' | 'settings';`,

  'src/lib/db.ts': `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}`,

  'src/store/app-store.ts': `import { create } from 'zustand';
import type { ViewType, Agent, Project, Task, Execution, Activity, TerminalLine, WorkspaceFile } from '@/lib/types';

interface AppState {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  selectedAgent: Agent | null;
  setSelectedAgent: (agent: Agent | null) => void;

  tasks: Task[];
  setTasks: (tasks: Task[]) => void;

  workspaceFiles: WorkspaceFile[];
  openFiles: WorkspaceFile[];
  activeFile: WorkspaceFile | null;
  openFile: (file: WorkspaceFile) => void;
  closeFile: (path: string) => void;
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;

  terminalLines: TerminalLine[];
  addTerminalLine: (line: TerminalLine) => void;
  clearTerminal: () => void;
  terminalInput: string;
  setTerminalInput: (input: string) => void;

  systemStatus: {
    cpu: number;
    memory: number;
    disk: number;
    agents: number;
    tasks: number;
    uptime: number;
  };
  setSystemStatus: (status: Partial<AppState['systemStatus']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  projects: [],
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  agents: [],
  setAgents: (agents) => set({ agents }),
  selectedAgent: null,
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  workspaceFiles: [],
  openFiles: [],
  activeFile: null,
  openFile: (file) =>
    set((state) => {
      const exists = state.openFiles.find((f) => f.path === file.path);
      const newOpenFiles = exists ? state.openFiles : [...state.openFiles, file];
      return { openFiles: newOpenFiles, activeFile: file };
    }),
  closeFile: (path) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f.path !== path);
      const newActiveFile = state.activeFile?.path === path
        ? newOpenFiles[newOpenFiles.length - 1] || null
        : state.activeFile;
      return { openFiles: newOpenFiles, activeFile: newActiveFile };
    }),
  fileContents: {},
  setFileContent: (path, content) =>
    set((state) => ({ fileContents: { ...state.fileContents, [path]: content } })),
  terminalLines: [],
  addTerminalLine: (line) =>
    set((state) => ({ terminalLines: [...state.terminalLines, line] })),
  clearTerminal: () => set({ terminalLines: [] }),
  terminalInput: '',
  setTerminalInput: (input) => set({ terminalInput: input }),
  systemStatus: { cpu: 42, memory: 67, disk: 34, agents: 9, tasks: 23, uptime: 93847 },
  setSystemStatus: (status) =>
    set((state) => ({ systemStatus: { ...state.systemStatus, ...status } })),
}));`,

  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Agent {
  id          String      @id @default(cuid())
  name        String
  type        String
  status      String      @default("idle")
  model       String
  description String?
  capabilities String[]   @default([])
  config      String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  executions  Execution[]
  tasks       Task[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      String   @default("active")
  framework   String   @default("next")
  stack       String   @default("typescript")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tasks       Task[]
  executions  Execution[]
  memories    Memory[]
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("pending")
  priority    String    @default("medium")
  type        String    @default("feature")
  agentId     String?
  projectId   String
  parentId    String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  agent       Agent?    @relation(fields: [agentId], references: [id])
  project     Project   @relation(fields: [projectId], references: [id])
  executions  Execution[]
}

model Execution {
  id          String   @id @default(cuid())
  status      String   @default("pending")
  type        String
  command     String?
  output      String?
  error       String?
  duration    Int?
  sandbox     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  agentId     String?
  projectId   String
  taskId      String?
  agent       Agent?   @relation(fields: [agentId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  task        Task?    @relation(fields: [taskId], references: [id])
}

model Memory {
  id        String   @id @default(cuid())
  type      String   @default("session")
  key       String
  value     String
  projectId String
  tags      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  project   Project  @relation(fields: [projectId], references: [id])
}`,

  'prisma/seed.ts': `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo agents
  const planner = await prisma.agent.create({
    data: {
      name: 'Planner',
      type: 'planner',
      status: 'idle',
      model: 'claude-4-opus',
      description: 'Orchestrates task breakdown and agent delegation',
      capabilities: ['task-planning', 'delegation', 'sprint-management'],
    },
  });

  const frontend = await prisma.agent.create({
    data: {
      name: 'Frontend',
      type: 'frontend',
      status: 'idle',
      model: 'claude-4-sonnet',
      description: 'UI component development and styling',
      capabilities: ['react', 'nextjs', 'tailwindcss', 'shadcn-ui'],
    },
  });

  const backend = await prisma.agent.create({
    data: {
      name: 'Backend',
      type: 'backend',
      status: 'idle',
      model: 'gpt-5',
      description: 'API routes, business logic, server-side code',
      capabilities: ['api-design', 'nextjs-api', 'auth', 'validation'],
    },
  });

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'AgentForge Platform',
      description: 'Autonomous AI engineering platform with multi-agent orchestration',
      framework: 'next',
      stack: 'typescript',
      status: 'active',
    },
  });

  console.log('Database seeded successfully!');
  console.log({ planner, frontend, backend, project });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`,

  'package.json': `{
  "name": "agentforge",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "db:push": "prisma db push",
    "db:seed": "bun run prisma/seed.ts"
  },
  "dependencies": {
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.11.1",
    "zustand": "^5.0.6",
    "framer-motion": "^12.23.2",
    "react-syntax-highlighter": "^15.6.1",
    "lucide-react": "^0.525.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "typescript": "^5",
    "tailwindcss": "^4",
    "prisma": "^6.11.1"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  'next.config.ts': `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;`,

  'tailwind.config.ts': `import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;`,

  'README.md': `# AgentForge

> Autonomous AI Engineering Platform

## Overview

AgentForge is a multi-agent orchestration platform that enables autonomous software engineering through coordinated AI agents.

## Features

- **Multi-Agent Orchestration**: Coordinate 9+ specialized AI agents
- **Workspace IDE**: Full-featured code editor with syntax highlighting
- **Real-time Terminal**: Integrated terminal with build/test/deploy commands
- **Sandbox Execution**: Isolated execution environments for safe code running
- **Persistent Memory**: Long-term context retention across sessions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite)
- **State Management**: Zustand
- **AI Models**: Claude, GPT-5, DeepSeek, Gemini, Llama

## Getting Started

\`\`\`bash
# Install dependencies
bun install

# Set up database
bun run db:push
bun run db:seed

# Start development server
bun run dev
\`\`\`

## Architecture

\`\`\`
src/
├── app/          # Next.js App Router pages & API routes
├── components/   # React components (ui, dashboard, workspace)
├── lib/          # Utilities, types, database client
└── store/        # Zustand state management
\`\`\`

## License

MIT`,

  '.env.local': `# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# App
NODE_ENV="development"`,

  '.gitignore': `# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
dev.db
dev.db-journal`,

  'public/favicon.ico': `<!-- Binary file - favicon -->`,

  'src/app/api/agents/route.ts': FILE_CONTENTS['src/app/api/agents/route.ts'] || '',

  'src/app/api/projects/route.ts': FILE_CONTENTS['src/app/api/projects/route.ts'] || '',
};

// ---------------------------------------------------------------------------
// Mock terminal lines
// ---------------------------------------------------------------------------

const INITIAL_TERMINAL_LINES: TerminalLine[] = [
  { id: 'tl-1', text: '$ bun run dev', type: 'input', timestamp: Date.now() - 60000 },
  { id: 'tl-2', text: '', type: 'output', timestamp: Date.now() - 59000 },
  { id: 'tl-3', text: '  ▲ Next.js 16.1.1', type: 'info', timestamp: Date.now() - 58000 },
  { id: 'tl-4', text: '  - Local:        http://localhost:3000', type: 'success', timestamp: Date.now() - 57000 },
  { id: 'tl-5', text: '  - Environments: .env.local', type: 'output', timestamp: Date.now() - 56500 },
  { id: 'tl-6', text: '', type: 'output', timestamp: Date.now() - 56000 },
  { id: 'tl-7', text: ' ✓ Starting...', type: 'success', timestamp: Date.now() - 55000 },
  { id: 'tl-8', text: ' ✓ Ready in 2.3s', type: 'success', timestamp: Date.now() - 50000 },
  { id: 'tl-9', text: '', type: 'output', timestamp: Date.now() - 45000 },
  { id: 'tl-10', text: ' ○ Compiling /dashboard ...', type: 'info', timestamp: Date.now() - 40000 },
  { id: 'tl-11', text: ' ✓ Compiled /dashboard in 1.2s', type: 'success', timestamp: Date.now() - 38000 },
  { id: 'tl-12', text: '', type: 'output', timestamp: Date.now() - 30000 },
  { id: 'tl-13', text: '$ bun run test', type: 'input', timestamp: Date.now() - 25000 },
  { id: 'tl-14', text: '', type: 'output', timestamp: Date.now() - 24000 },
  { id: 'tl-15', text: ' PASS  src/lib/__tests__/utils.test.ts', type: 'success', timestamp: Date.now() - 23000 },
  { id: 'tl-16', text: ' PASS  src/components/__tests__/button.test.tsx', type: 'success', timestamp: Date.now() - 22000 },
  { id: 'tl-17', text: ' PASS  src/app/api/__tests__/agents.test.ts', type: 'success', timestamp: Date.now() - 21000 },
  { id: 'tl-18', text: '', type: 'output', timestamp: Date.now() - 20000 },
  { id: 'tl-19', text: ' Test Files  3 passed (3)', type: 'success', timestamp: Date.now() - 19000 },
  { id: 'tl-20', text: ' Tests       47 passed (47)', type: 'success', timestamp: Date.now() - 18500 },
  { id: 'tl-21', text: ' Duration    4.21s', type: 'output', timestamp: Date.now() - 18000 },
  { id: 'tl-22', text: '', type: 'output', timestamp: Date.now() - 15000 },
  { id: 'tl-23', text: '$ bun run lint', type: 'input', timestamp: Date.now() - 10000 },
  { id: 'tl-24', text: '', type: 'output', timestamp: Date.now() - 9000 },
  { id: 'tl-25', text: ' ⚠ Warning: Unused import in src/lib/db.ts (line 2)', type: 'error', timestamp: Date.now() - 8000 },
  { id: 'tl-26', text: '   2: import { PrismaClient } from "@prisma/client";', type: 'output', timestamp: Date.now() - 7500 },
  { id: 'tl-27', text: '     ┌──────────────────────────────^', type: 'output', timestamp: Date.now() - 7000 },
  { id: 'tl-28', text: '', type: 'output', timestamp: Date.now() - 6500 },
  { id: 'tl-29', text: ' ✓ 142 files checked, 0 errors, 1 warning', type: 'success', timestamp: Date.now() - 5000 },
];

// ---------------------------------------------------------------------------
// Mock problems
// ---------------------------------------------------------------------------

const MOCK_PROBLEMS = [
  { id: 'p-1', type: 'warning' as const, file: 'src/lib/db.ts', line: 2, message: "'PrismaClient' is defined but never used" },
  { id: 'p-2', type: 'info' as const, file: 'src/app/page.tsx', line: 15, message: "Consider using 'useMemo' for expensive computation" },
  { id: 'p-3', type: 'warning' as const, file: 'src/store/app-store.ts', line: 42, message: "Complex state update could be optimized" },
];

// ---------------------------------------------------------------------------
// Mock output
// ---------------------------------------------------------------------------

const MOCK_OUTPUT = [
  { id: 'o-1', text: '[Build] Compiling page /workspace...', timestamp: Date.now() - 5000 },
  { id: 'o-2', text: '[Build] Module size: 245 KB (gzipped: 78 KB)', timestamp: Date.now() - 4500 },
  { id: 'o-3', text: '[Build] First Load JS shared by all: 92 KB', timestamp: Date.now() - 4000 },
  { id: 'o-4', text: '[Build] ✓ Compiled successfully', timestamp: Date.now() - 3500 },
  { id: 'o-5', text: '', timestamp: Date.now() - 3000 },
  { id: 'o-6', text: '[Agent] Frontend agent: Building responsive layout...', timestamp: Date.now() - 2000 },
  { id: 'o-7', text: '[Agent] Planner agent: Sprint 14 task decomposition in progress', timestamp: Date.now() - 1000 },
  { id: 'o-8', text: '[Agent] Testing agent: Running integration tests (34/61)', timestamp: Date.now() - 500 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileIcon(name: string, isFolder: boolean, isOpen: boolean) {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
    ) : (
      <Folder className="h-4 w-4 shrink-0 text-amber-400" />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
    case 'jsx':
      return <Braces className="h-4 w-4 shrink-0 text-sky-400" />;
    case 'ts':
    case 'js':
      return <FileType2 className="h-4 w-4 shrink-0 text-amber-300" />;
    case 'css':
    case 'scss':
      return <Palette className="h-4 w-4 shrink-0 text-pink-400" />;
    case 'json':
      return <FileJson className="h-4 w-4 shrink-0 text-emerald-400" />;
    case 'prisma':
      return <Database className="h-4 w-4 shrink-0 text-cyan-400" />;
    case 'md':
      return <FileText className="h-4 w-4 shrink-0 text-slate-400" />;
    case 'env':
    case 'gitignore':
    case 'ico':
      return <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />;
    default:
      return <File className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
}

function getSyntaxLanguage(language?: string): string {
  switch (language) {
    case 'tsx':
      return 'tsx';
    case 'typescript':
      return 'typescript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'prisma':
      return 'typescript';
    case 'markdown':
      return 'markdown';
    case 'plaintext':
      return 'text';
    default:
      return 'typescript';
  }
}

function getFileLanguageLabel(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'tsx':
      return 'TypeScript React';
    case 'ts':
      return 'TypeScript';
    case 'jsx':
      return 'JavaScript React';
    case 'js':
      return 'JavaScript';
    case 'css':
      return 'CSS';
    case 'json':
      return 'JSON';
    case 'prisma':
      return 'Prisma';
    case 'md':
      return 'Markdown';
    default:
      return 'Plain Text';
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const panelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ---------------------------------------------------------------------------
// FileTreeItem sub-component
// ---------------------------------------------------------------------------

interface FileTreeItemProps {
  file: WorkspaceFile;
  depth: number;
  expanded: Set<string>;
  activePath: string | null;
  modifiedFiles: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (file: WorkspaceFile) => void;
}

function FileTreeItem({ file, depth, expanded, activePath, modifiedFiles, onToggle, onSelect }: FileTreeItemProps) {
  const isFolder = file.type === 'folder';
  const isOpen = expanded.has(file.path);
  const isActive = activePath === file.path;
  const isModified = modifiedFiles.has(file.path);

  const handleClick = () => {
    if (isFolder) {
      onToggle(file.path);
    } else {
      onSelect(file);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center w-full gap-1.5 px-2 py-[3px] text-[13px] rounded-sm transition-colors text-left',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isFolder ? (
          isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {getFileIcon(file.name, isFolder, isOpen)}
        <span className="truncate flex-1">{file.name}</span>
        {isModified && (
          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
        )}
      </button>
      {isFolder && isOpen && file.children && (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {file.children.map((child) => (
              <FileTreeItem
                key={child.path}
                file={child}
                depth={depth + 1}
                expanded={expanded}
                activePath={activePath}
                modifiedFiles={modifiedFiles}
                onToggle={onToggle}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Terminal panel sub-component
// ---------------------------------------------------------------------------

interface TerminalPanelProps {
  lines: TerminalLine[];
  input: string;
  onInputChange: (value: string) => void;
  onCommandSubmit: (command: string) => void;
}

function TerminalPanel({ lines, input, onInputChange, onCommandSubmit }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      onCommandSubmit(trimmed);
    }
  };

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'input':
        return 'text-emerald-400';
      case 'success':
        return 'text-emerald-300';
      case 'error':
        return 'text-red-400';
      case 'info':
        return 'text-sky-300';
      case 'output':
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1b26]">
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-[13px] leading-relaxed"
      >
        {lines.map((line) => (
          <div key={line.id} className={cn('whitespace-pre-wrap break-all', getLineColor(line.type))}>
            {line.text}
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 px-3 py-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-[13px] select-none">{`>`}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            className="flex-1 bg-transparent font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
            placeholder="Type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main WorkspaceView component
// ---------------------------------------------------------------------------

export function WorkspaceView() {
  const store = useAppStore();
  const {
    activeFile,
    openFiles,
    openFile,
    closeFile,
    terminalInput,
    setTerminalInput,
    addTerminalLine,
    clearTerminal,
  } = store;

  // Local state
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['src', 'src/app', 'src/components', 'src/components/ui', 'src/lib'])
  );
  const [modifiedFiles] = useState<Set<string>>(
    new Set(['src/app/page.tsx', 'src/lib/types.ts'])
  );
  const [copied, setCopied] = useState(false);
  const [terminalTab, setTerminalTab] = useState<string>('terminal');

  // Terminal lines: use store if populated, otherwise use initial mock data
  const terminalLines = store.terminalLines.length > 0 ? store.terminalLines : INITIAL_TERMINAL_LINES;

  // Active file content
  const activeContent = useMemo(() => {
    if (!activeFile) return '';
    return FILE_CONTENTS[activeFile.path] || '// File content not available';
  }, [activeFile]);

  const activeLanguage = useMemo(() => {
    if (!activeFile) return 'typescript';
    return getSyntaxLanguage(activeFile.language);
  }, [activeFile]);

  // Cursor position (mock)
  const cursorLine = 24;
  const cursorCol = 8;

  // Handlers
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleFileSelect = useCallback(
    (file: WorkspaceFile) => {
      if (file.type === 'file') {
        openFile(file);
        // Auto-expand parent folders
        const parts = file.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          const folderPath = parts.slice(0, i).join('/');
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.add(folderPath);
            return next;
          });
        }
      }
    },
    [openFile]
  );

  const handleCopy = useCallback(async () => {
    if (activeContent) {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [activeContent]);

  const handleTerminalSubmit = useCallback(
    (command: string) => {
      addTerminalLine({ id: generateId(), text: `$ ${command}`, type: 'input', timestamp: Date.now() });

      // Simulate command responses
      setTimeout(() => {
        if (command === 'clear' || command === 'cls') {
          clearTerminal();
          return;
        }
        if (command === 'help') {
          addTerminalLine({ id: generateId(), text: 'Available commands:', type: 'info', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  dev       - Start development server', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  build     - Build for production', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  test      - Run test suite', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  lint      - Run ESLint', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  db:push   - Push schema changes', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  clear     - Clear terminal', type: 'output', timestamp: Date.now() });
          return;
        }
        if (command === 'dev' || command === 'bun run dev') {
          addTerminalLine({ id: generateId(), text: '', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  ▲ Next.js 16.1.1', type: 'info', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  - Local: http://localhost:3000', type: 'success', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '  ✓ Ready in 2.1s', type: 'success', timestamp: Date.now() });
          return;
        }
        if (command === 'test' || command === 'bun run test') {
          addTerminalLine({ id: generateId(), text: '', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' PASS  src/lib/__tests__/utils.test.ts', type: 'success', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' PASS  src/components/__tests__/button.test.tsx', type: 'success', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' Tests  47 passed (47)', type: 'success', timestamp: Date.now() });
          return;
        }
        if (command === 'build' || command === 'bun run build') {
          addTerminalLine({ id: generateId(), text: '', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' Creating an optimized production build ...', type: 'info', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' ✓ Compiled successfully', type: 'success', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: ' ✓ Build completed in 18.4s', type: 'success', timestamp: Date.now() });
          return;
        }
        if (command.startsWith('git')) {
          addTerminalLine({ id: generateId(), text: 'On branch main', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: 'Your branch is up to date with \'origin/main\'.', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: '', type: 'output', timestamp: Date.now() });
          addTerminalLine({ id: generateId(), text: 'nothing to commit, working tree clean', type: 'success', timestamp: Date.now() });
          return;
        }
        // Unknown command
        addTerminalLine({ id: generateId(), text: `zsh: command not found: ${command.split(' ')[0]}`, type: 'error', timestamp: Date.now() });
      }, 300 + Math.random() * 400);

      setTerminalInput('');
    },
    [addTerminalLine, clearTerminal, setTerminalInput]
  );

  return (
    <motion.div
      className="flex flex-col h-full bg-background"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-1 min-h-0">
        {/* ================================================================ */}
        {/* File Explorer Panel                                              */}
        {/* ================================================================ */}
        <div className="w-60 shrink-0 border-r bg-card flex flex-col">
          {/* Explorer header */}
          <div className="flex items-center justify-between px-3 h-9 border-b shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Explorer
            </span>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <File className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New File</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Folder className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Folder</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Project section header */}
          <div className="flex items-center gap-1.5 px-3 py-1.5">
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              AgentForge
            </span>
          </div>

          {/* File tree */}
          <ScrollArea className="flex-1">
            <div className="pb-4">
              {FILE_TREE.map((file) => (
                <FileTreeItem
                  key={file.path}
                  file={file}
                  depth={0}
                  expanded={expandedFolders}
                  activePath={activeFile?.path ?? null}
                  modifiedFiles={modifiedFiles}
                  onToggle={toggleFolder}
                  onSelect={handleFileSelect}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ================================================================ */}
        {/* Editor Area                                                      */}
        {/* ================================================================ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tab bar */}
          <div className="flex items-center h-9 bg-muted/40 border-b shrink-0 overflow-x-auto">
            <div className="flex items-center min-w-0">
              <AnimatePresence initial={false}>
                {openFiles.map((file) => {
                  const isActive = activeFile?.path === file.path;
                  const isModified = modifiedFiles.has(file.path);
                  return (
                    <motion.div
                      key={file.path}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center shrink-0"
                    >
                      <button
                        onClick={() => openFile(file)}
                        className={cn(
                          'flex items-center gap-1.5 h-full px-3 text-[13px] border-r border-border/50 transition-colors',
                          isActive
                            ? 'bg-background text-foreground border-b-2 border-b-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        )}
                      >
                        {getFileIcon(file.name, false, false)}
                        <span className="max-w-[120px] truncate">{file.name}</span>
                        {isModified && (
                          <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFile(file.path);
                          }}
                          className="ml-1 h-4 w-4 rounded-sm flex items-center justify-center hover:bg-muted-foreground/20 transition-colors shrink-0"
                        >
                          <X className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity" />
                        </span>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Editor content or welcome screen */}
          {activeFile ? (
            <div className="relative flex-1 min-h-0 overflow-auto bg-[#282c34]">
              {/* Copy button */}
              <div className="absolute top-2 right-3 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground bg-[#21252b] border border-[#181a1f] hover:bg-[#2c313a]"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Copy code'}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1 px-4 py-1.5 bg-[#21252b] border-b border-[#181a1f] text-[12px] text-muted-foreground">
                <span>src</span>
                <ChevronRight className="h-3 w-3" />
                {activeFile.path
                  .split('/')
                  .filter((_, i) => i > 0)
                  .map((segment, idx, arr) => (
                    <React.Fragment key={idx}>
                      {idx === arr.length - 1 ? (
                        <span className="text-foreground">{segment}</span>
                      ) : (
                        <span>{segment}</span>
                      )}
                      {idx < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
                    </React.Fragment>
                  ))}
              </div>

              {/* Syntax-highlighted code */}
              <SyntaxHighlighter
                language={activeLanguage}
                style={oneDark}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  padding: '12px 0',
                  background: '#282c34',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  height: '100%',
                }}
                lineNumberStyle={{
                  minWidth: '52px',
                  paddingRight: '16px',
                  paddingLeft: '16px',
                  color: '#495162',
                  userSelect: 'none',
                  fontSize: '12px',
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
                  },
                }}
                wrapLongLines
              >
                {activeContent}
              </SyntaxHighlighter>
            </div>
          ) : (
            /* Welcome screen */
            <div className="flex-1 flex flex-col items-center justify-center bg-[#282c34] text-center px-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Bot className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold text-foreground/80 mb-2">
                  AgentForge Workspace
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Select a file from the explorer to start editing. Your AI agents will work alongside you in this workspace.
                </p>
                <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
                  {[
                    { keys: 'Ctrl+B', desc: 'Toggle sidebar' },
                    { keys: 'Ctrl+`', desc: 'Toggle terminal' },
                    { keys: 'Ctrl+P', desc: 'Quick open file' },
                    { keys: 'Ctrl+S', desc: 'Save file' },
                  ].map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-center gap-2 text-[13px] text-muted-foreground"
                    >
                      <kbd className="px-1.5 py-0.5 rounded bg-[#21252b] border border-[#3e4451] text-[11px] font-mono text-foreground/70">
                        {shortcut.keys}
                      </kbd>
                      <span>{shortcut.desc}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* ============================================================ */}
          {/* Terminal Panel (resizable)                                     */}
          {/* ============================================================ */}
          <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
            <ResizableHandle className="bg-border hover:bg-primary/50 transition-colors" />
            <ResizablePanel defaultSize={30} minSize={12} maxSize={60}>
              <div className="flex flex-col h-full border-t">
                {/* Terminal tabs */}
                <div className="flex items-center h-9 bg-muted/40 border-b shrink-0 px-1 gap-0.5">
                  <button
                    onClick={() => setTerminalTab('terminal')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 h-full text-[12px] font-medium border-b-2 transition-colors',
                      terminalTab === 'terminal'
                        ? 'text-foreground border-b-primary'
                        : 'text-muted-foreground border-b-transparent hover:text-foreground'
                    )}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    Terminal
                  </button>
                  <button
                    onClick={() => setTerminalTab('problems')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 h-full text-[12px] font-medium border-b-2 transition-colors',
                      terminalTab === 'problems'
                        ? 'text-foreground border-b-primary'
                        : 'text-muted-foreground border-b-transparent hover:text-foreground'
                    )}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Problems
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/20"
                    >
                      {MOCK_PROBLEMS.length}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setTerminalTab('output')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 h-full text-[12px] font-medium border-b-2 transition-colors',
                      terminalTab === 'output'
                        ? 'text-foreground border-b-primary'
                        : 'text-muted-foreground border-b-transparent hover:text-foreground'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Output
                  </button>

                  <div className="flex-1" />

                  <div className="flex items-center gap-0.5 pr-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            addTerminalLine({ id: generateId(), text: '$ bun run dev', type: 'input', timestamp: Date.now() });
                            setTimeout(() => {
                              addTerminalLine({ id: generateId(), text: '  ▲ Next.js 16.1.1', type: 'info', timestamp: Date.now() });
                              addTerminalLine({ id: generateId(), text: '  - Local: http://localhost:3000', type: 'success', timestamp: Date.now() });
                              addTerminalLine({ id: generateId(), text: '  ✓ Ready in 1.8s', type: 'success', timestamp: Date.now() });
                            }, 500);
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Run Task</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            clearTerminal();
                          }}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear Terminal</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Terminal content area */}
                <div className="flex-1 min-h-0">
                  {terminalTab === 'terminal' && (
                    <TerminalPanel
                      lines={terminalLines}
                      input={terminalInput}
                      onInputChange={setTerminalInput}
                      onCommandSubmit={handleTerminalSubmit}
                    />
                  )}
                  {terminalTab === 'problems' && (
                    <ScrollArea className="h-full">
                      <div className="p-2">
                        {MOCK_PROBLEMS.map((problem) => (
                          <div
                            key={problem.id}
                            className="flex items-start gap-2 px-2 py-1.5 rounded text-[13px] hover:bg-accent/30 transition-colors cursor-pointer"
                          >
                            {problem.type === 'warning' ? (
                              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-foreground truncate">{problem.message}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {problem.file}:{problem.line}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  {terminalTab === 'output' && (
                    <ScrollArea className="h-full">
                      <div className="p-3 font-mono text-[13px]">
                        {MOCK_OUTPUT.map((item) => (
                          <div
                            key={item.id}
                            className="text-muted-foreground whitespace-pre-wrap"
                          >
                            {item.text}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Status Bar                                                        */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between h-6 bg-[#1a1b26] border-t px-2 shrink-0 select-none">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <GitBranch className="h-3 w-3" />
                <span>main</span>
                <Badge
                  variant="outline"
                  className="h-3.5 px-1 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-0.5"
                >
                  0↓ 3↑
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>Branch: main (0 incoming, 3 outgoing)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span>0 errors, 1 warning</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Problems: 0 errors, 1 warning</TooltipContent>
          </Tooltip>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {activeFile && (
            <>
              <span className="text-[11px] text-muted-foreground">
                Ln {cursorLine}, Col {cursorCol}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Spaces: 2
              </span>
              <span className="text-[11px] text-muted-foreground">
                UTF-8
              </span>
              <span className="text-[11px] text-muted-foreground">
                {getFileLanguageLabel(activeFile.path)}
              </span>
            </>
          )}

          <div className="w-px h-3 bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 cursor-pointer">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <Bot className="h-3 w-3" />
                <span>3 agents active</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>3 agents currently running</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
