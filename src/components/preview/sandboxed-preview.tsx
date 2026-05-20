'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Shield, Download, AlertTriangle, X } from 'lucide-react';
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
// Helpers
// =============================================================================

/**
 * Inject a `<base>` tag into HTML so relative resources resolve correctly
 * inside a sandboxed iframe (which lacks `allow-same-origin`).
 * Uses `about:blank` as a safe origin that won't leak parent context.
 */
function injectBaseTag(html: string): string {
  // If a <base> tag already exists, skip injection
  if (/<base\s[^>]*>/i.test(html)) return html;

  const baseTag = '<base href="about:blank" target="_self">';

  if (/<head[^>]*>/i.test(html)) {
    // Insert right after <head>
    return html.replace(/(<head[^>]*>)/i, `$1${baseTag}`);
  }

  if (/<html[^>]*>/i.test(html)) {
    // Insert a <head> with the base tag after <html>
    return html.replace(/(<html[^>]*>)/i, `$1<head>${baseTag}</head>`);
  }

  // No <html> or <head> — prepend a minimal head
  return `<head>${baseTag}</head>${html}`;
}

// =============================================================================
// SecurityBadge — small overlay shown in the iframe corner
// =============================================================================

function SecurityBadge() {
  return (
    <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white/80 select-none pointer-events-none">
      <span className="text-xs" role="img" aria-label="Locked">
        🔒
      </span>
      <span className="text-[10px] font-medium leading-none">Sandboxed</span>
    </div>
  );
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
  const [warningsDismissed, setWarningsDismissed] = useState(false);

  // Sanitize the HTML before rendering and inject <base> tag
  const { sanitizedHtml, sanitizeResult } = useMemo(() => {
    const result: SanitizeResult = sanitizeGeneratedHtml(html);
    const withBase = injectBaseTag(result.html);
    return {
      sanitizedHtml: withBase,
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

  // Dismiss warnings — persists for the session
  const handleDismissWarnings = useCallback(() => {
    setShowWarnings(false);
    setWarningsDismissed(true);
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

      {/* Warning Banner — shown when sanitization removed scripts/frames */}
      <AnimatePresence>
        {!warningsDismissed && totalIssues > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/10">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Security sanitization applied
                </p>
                <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                  {sanitizeResult.scriptsRemoved > 0 && (
                    <span>{sanitizeResult.scriptsRemoved} script{sanitizeResult.scriptsRemoved !== 1 ? 's' : ''} removed.{' '}
                    </span>
                  )}
                  {sanitizeResult.framesRemoved > 0 && (
                    <span>{sanitizeResult.framesRemoved} frame{sanitizeResult.framesRemoved !== 1 ? 's' : ''} removed.{' '}
                    </span>
                  )}
                  {sanitizeResult.externalLinksRemoved > 0 && (
                    <span>{sanitizeResult.externalLinksRemoved} unsafe link{sanitizeResult.externalLinksRemoved !== 1 ? 's' : ''} removed.</span>
                  )}
                </p>
                <button
                  type="button"
                  className="text-[10px] text-amber-500 hover:text-amber-600 mt-1 underline underline-offset-2"
                  onClick={() => setShowWarnings(!showWarnings)}
                >
                  {showWarnings ? 'Hide' : 'Show'} details
                </button>
              </div>
              <button
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                onClick={handleDismissWarnings}
                aria-label="Dismiss warnings"
              >
                <X className="h-3 w-3" />
              </button>
            </div>

            {/* Detailed warnings list */}
            {showWarnings && sanitizeResult.warnings.length > 0 && (
              <div className="px-3 py-2 bg-amber-500/5 border-b border-amber-500/10">
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sandboxed iframe — allow-scripts only, NO allow-same-origin for security */}
      <div className="relative flex-1">
        <iframe
          srcDoc={sanitizedHtml}
          title={title}
          className="w-full border-0 flex-1"
          style={{
            height: height || 'calc(100vh - 180px)',
          }}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
        />
        <SecurityBadge />
      </div>
    </div>
  );
}
