'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Shield, Download, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeGeneratedHtml, type SanitizeResult } from '@/lib/html-sanitizer';
import { toast } from '@/hooks/use-toast';

// =============================================================================
// Props
// =============================================================================

interface SandboxedPreviewProps {
  /** Raw HTML content to render inside the sandbox */
  html: string;
  /** Title for the iframe */
  title?: string;
  /** iframe height */
  height?: string | number;
  /** Additional CSS classes for the iframe wrapper */
  className?: string;
  /** Business name for the filename */
  businessName?: string;
}

// =============================================================================
// Component
// =============================================================================

export function SandboxedPreview({
  html,
  title = 'Sandbox Preview',
  height,
  className,
  businessName = 'storecraft-website',
}: SandboxedPreviewProps) {
  const [showWarnings, setShowWarnings] = useState(false);

  // Sanitize the HTML before rendering
  const { sanitizedHtml, sanitizeResult } = useMemo(() => {
    const result: SanitizeResult = sanitizeGeneratedHtml(html);
    return {
      sanitizedHtml: result.html,
      sanitizeResult: result,
    };
  }, [html]);

  // Total issues count
  const totalIssues = useMemo(
    () =>
      sanitizeResult.scriptsRemoved +
      sanitizeResult.framesRemoved +
      sanitizeResult.externalLinksRemoved,
    [sanitizeResult]
  );

  // Download handler
  const handleDownload = useCallback(() => {
    try {
      // Create a clean version with DOCTYPE for download
      let downloadHtml = sanitizedHtml;
      if (!downloadHtml.trim().toLowerCase().startsWith('<!doctype')) {
        downloadHtml = `<!DOCTYPE html>\n${downloadHtml}`;
      }

      const blob = new Blob([downloadHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${businessName.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `${businessName}.html is being downloaded.`,
      });
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Could not generate the HTML file. Please try again.',
        variant: 'destructive',
      });
    }
  }, [sanitizedHtml, businessName]);

  // Dismiss warnings
  const handleDismissWarnings = useCallback(() => {
    setShowWarnings(false);
  }, []);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Security Banner */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-emerald-500/5 border-b border-emerald-500/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
            Sandbox Preview Mode
          </span>
          {totalIssues > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 border-amber-400/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 cursor-pointer select-none"
              onClick={() => setShowWarnings(!showWarnings)}
            >
              {totalIssues} item{totalIssues !== 1 ? 's' : ''} sanitized
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
            onClick={handleDownload}
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">Download HTML</span>
          </Button>
        </div>
      </div>

      {/* Sanitization Warnings Panel */}
      <AnimatePresence>
        {showWarnings && sanitizeResult.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2 bg-amber-500/5 border-b border-amber-500/10">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Security Sanitization Report
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={handleDismissWarnings}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {sanitizeResult.warnings.map((warning, idx) => (
                  <p
                    key={idx}
                    className="text-[10px] text-amber-600/70 dark:text-amber-400/70 leading-relaxed"
                  >
                    &bull; {warning}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sandboxed iframe */}
      <iframe
        srcDoc={sanitizedHtml}
        title={title}
        className="w-full border-0 flex-1"
        style={{
          height: height || 'calc(100vh - 180px)',
        }}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
