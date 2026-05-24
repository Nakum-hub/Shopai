// =============================================================================
// StoreCraft AI — Hydration Mismatch Protection System
// =============================================================================

// =============================================================================
// Types
// =============================================================================

type HydrationRiskType = 'date' | 'client-api' | 'random' | 'state' | 'storage' | 'conditional';
type HydrationSeverity = 'critical' | 'high' | 'medium' | 'low';

interface HydrationRisk {
  type: HydrationRiskType;
  severity: HydrationSeverity;
  location: string;
  description: string;
  fix: string;
}

interface HydrationFix {
  type: HydrationRiskType;
  description: string;
}

interface HydrationReport {
  riskScore: number;
  safe: boolean;
  risks: HydrationRisk[];
  fixes: HydrationFix[];
}

// =============================================================================
// Risk Patterns
// =============================================================================

const DATE_PATTERNS = [
  { pattern: /\bnew\s+Date\(\s*\)/g, desc: 'new Date() — non-deterministic across server/client', fix: 'Use static date strings or pass date from server' },
  { pattern: /\bDate\.now\(\)/g, desc: 'Date.now() — different values on server vs client', fix: 'Generate timestamps server-side and pass as props' },
  { pattern: /\bgetTime\(\)/g, desc: 'getTime() — depends on Date object creation time', fix: 'Use static time values' },
  { pattern: /\btoLocaleDateString\(/g, desc: 'toLocaleDateString() — locale may differ server/client', fix: 'Specify locale explicitly or use server-rendered strings' },
  { pattern: /\btoLocaleString\(/g, desc: 'toLocaleString() — locale-dependent', fix: 'Use fixed format or server-rendered value' },
  { pattern: /\bgetHours\(\)|getMinutes\(\)|getSeconds\(\)/g, desc: 'Time methods — timezone-dependent', fix: 'Pass time as static string from server' },
];

const CLIENT_API_PATTERNS = [
  { pattern: /\bwindow\b/g, desc: 'window access — undefined on server', fix: 'Use typeof window !== "undefined" guard or useEffect' },
  { pattern: /\bdocument\b(?!\.createElement)/g, desc: 'document access — undefined on server', fix: 'Use typeof document !== "undefined" guard or useEffect' },
  { pattern: /\bnavigator\b/g, desc: 'navigator access — undefined on server', fix: 'Check typeof navigator !== "undefined" before access' },
  { pattern: /\blocalStorage\b/g, desc: 'localStorage — unavailable during SSR', fix: 'Wrap in useEffect or typeof check' },
  { pattern: /\bsessionStorage\b/g, desc: 'sessionStorage — unavailable during SSR', fix: 'Wrap in useEffect or typeof check' },
  { pattern: /\blocation\b(?!\.href\s*=\s*["'])/g, desc: 'location access — differs server/client', fix: 'Use Next.js router or typeof check' },
  { pattern: /\bgeolocation\b/g, desc: 'geolocation API — client-only', fix: 'Wrap in useEffect with client-only guard' },
  { pattern: /\bmatchMedia\b/g, desc: 'matchMedia — client-only API', fix: 'Use CSS media queries or useEffect' },
  { pattern: /\bIntersectionObserver\b/g, desc: 'IntersectionObserver — client-only', fix: 'Initialize in useEffect' },
  { pattern: /\bResizeObserver\b/g, desc: 'ResizeObserver — client-only', fix: 'Initialize in useEffect' },
];

const RANDOM_PATTERNS = [
  { pattern: /\bMath\.random\(\)/g, desc: 'Math.random() — different values server/client', fix: 'Generate on client-side only via useEffect' },
  { pattern: /\bcrypto\.randomUUID\(\)/g, desc: 'crypto.randomUUID() — client-only random', fix: 'Generate in useEffect or server-side' },
  { pattern: /\buuid\b(?!\s*\()/gi, desc: 'UUID library usage — may produce different values', fix: 'Ensure consistent UUID generation' },
];

const STORAGE_PATTERNS = [
  { pattern: /\blocalStorage\.getItem\b/g, desc: 'localStorage.getItem — SSR unsafe', fix: 'Use useEffect or SSR-safe wrapper' },
  { pattern: /\blocalStorage\.setItem\b/g, desc: 'localStorage.setItem — SSR unsafe', fix: 'Use useEffect or SSR-safe wrapper' },
  { pattern: /\bsessionStorage\.getItem\b/g, desc: 'sessionStorage.getItem — SSR unsafe', fix: 'Use useEffect or SSR-safe wrapper' },
  { pattern: /\bcookie\b/gi, desc: 'document.cookie access — SSR unsafe', fix: 'Use Next.js cookies() or SSR-safe method' },
];

// =============================================================================
// Hydration Guard
// =============================================================================

class HydrationGuard {

  /** Full hydration safety analysis */
  guard(html: string): HydrationReport {
    const risks: HydrationRisk[] = [];
    const fixes: HydrationFix[] = [];

    // Check all risk categories
    this.checkDatePatterns(html, risks, fixes);
    this.checkClientAPIs(html, risks, fixes);
    this.checkRandomPatterns(html, risks, fixes);
    this.checkStoragePatterns(html, risks, fixes);
    this.checkConditionalRendering(html, risks, fixes);

    // Calculate risk score
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let riskScore = 0;
    for (const risk of risks) {
      riskScore += severityWeights[risk.severity];
    }
    riskScore = Math.min(100, riskScore);

    return { riskScore, safe: riskScore < 30, risks, fixes };
  }

  /** Auto-fix hydration issues */
  autoFix(html: string): { html: string; fixes: string[] } {
    const fixes: string[] = [];
    let fixed = html;

    // Fix window/document access
    if (/\bwindow\b/.test(fixed) && !/typeof\s+window/.test(fixed)) {
      // Add a comment noting the issue (can't auto-fix generated HTML safely)
      fixes.push('NOTE: window access detected — ensure client-only rendering');
    }

    // Fix localStorage/sessionStorage
    if (/\blocalStorage\b|\bsessionStorage\b/.test(fixed)) {
      fixes.push('NOTE: Web Storage access detected — wrap in client-only code');
    }

    // Fix Math.random
    if (/\bMath\.random\(\)/.test(fixed)) {
      fixes.push('NOTE: Math.random() detected — should be client-only');
    }

    return { html: fixed, fixes };
  }

  // ─── Private Check Methods ──────────────────────────────────────────

  private checkDatePatterns(html: string, risks: HydrationRisk[], fixes: HydrationFix[]) {
    for (const dp of DATE_PATTERNS) {
      const matches = [...html.matchAll(dp.pattern)];
      if (matches.length > 0) {
        risks.push({
          type: 'date',
          severity: matches.length > 2 ? 'high' : 'medium',
          location: `Line context: ${this.getContext(html, matches[0].index!)}`,
          description: dp.desc,
          fix: dp.fix,
        });
        fixes.push({ type: 'date', description: dp.fix });
      }
    }
  }

  private checkClientAPIs(html: string, risks: HydrationRisk[], fixes: HydrationFix[]) {
    for (const cap of CLIENT_API_PATTERNS) {
      const matches = [...html.matchAll(cap.pattern)];
      if (matches.length > 0) {
        // Filter out false positives (CSS content, comments, strings)
        const realMatches = matches.filter(m => !this.isFalsePositive(html, m.index!));
        if (realMatches.length > 0) {
          risks.push({
            type: 'client-api',
            severity: 'critical',
            location: `${realMatches.length} occurrences of ${cap.pattern.source.replace(/\\b/g, '')}`,
            description: cap.desc,
            fix: cap.fix,
          });
          fixes.push({ type: 'client-api', description: cap.fix });
        }
      }
    }
  }

  private checkRandomPatterns(html: string, risks: HydrationRisk[], fixes: HydrationFix[]) {
    for (const rp of RANDOM_PATTERNS) {
      const matches = [...html.matchAll(rp.pattern)];
      if (matches.length > 0) {
        risks.push({
          type: 'random',
          severity: 'high',
          location: `${matches.length} occurrences of ${rp.pattern.source}`,
          description: rp.desc,
          fix: rp.fix,
        });
        fixes.push({ type: 'random', description: rp.fix });
      }
    }
  }

  private checkStoragePatterns(html: string, risks: HydrationRisk[], fixes: HydrationFix[]) {
    for (const sp of STORAGE_PATTERNS) {
      const matches = [...html.matchAll(sp.pattern)];
      if (matches.length > 0) {
        risks.push({
          type: 'storage',
          severity: 'high',
          location: `${matches.length} occurrences`,
          description: sp.desc,
          fix: sp.fix,
        });
        fixes.push({ type: 'storage', description: sp.fix });
      }
    }
  }

  private checkConditionalRendering(html: string, risks: HydrationRisk[], fixes: HydrationFix[]) {
    // Check for inline script tags (common hydration issue source)
    const scriptTags = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const script of scriptTags) {
      const content = script[1].trim();
      if (content.length > 0) {
        risks.push({
          type: 'conditional',
          severity: 'medium',
          location: 'Inline <script> block',
          description: 'Inline scripts may cause hydration mismatches if they modify DOM',
          fix: 'Move to useEffect or external script with defer',
        });
        fixes.push({ type: 'conditional', description: 'Move inline scripts to useEffect or deferred external scripts' });
      }
    }

    // Check for classList manipulation patterns
    const classListPatterns = /\bclassList\b\.(add|remove|toggle)\b/g;
    const clMatches = [...html.matchAll(classListPatterns)];
    if (clMatches.length > 0) {
      risks.push({
        type: 'conditional',
        severity: 'low',
        location: `${clMatches.length} classList modifications`,
        description: 'Dynamic class modifications may cause visual flash during hydration',
        fix: 'Use CSS-in-JS or CSS custom properties instead',
      });
    }

    // Check for dynamic style modifications
    const styleModPattern = /\.style\.(display|visibility|opacity|transform)/g;
    const styleMatches = [...html.matchAll(styleModPattern)];
    if (styleMatches.length > 0) {
      risks.push({
        type: 'conditional',
        severity: 'low',
        location: `${styleMatches.length} dynamic style modifications`,
        description: 'Dynamic style changes during render may cause hydration flash',
        fix: 'Use CSS classes or CSS custom properties for conditional styling',
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private getContext(html: string, index: number): string {
    const start = Math.max(0, index - 30);
    const end = Math.min(html.length, index + 30);
    return `...${html.substring(start, end).replace(/\n/g, ' ')}...`;
  }

  private isFalsePositive(html: string, index: number): boolean {
    // Check if the match is inside a comment
    const before = html.substring(Math.max(0, index - 100), index);
    if (before.includes('<!--')) {
      const commentEnd = html.indexOf('-->', index);
      if (commentEnd !== -1 && commentEnd < index + 100) return true;
    }
    return false;
  }
}

export const hydrationGuard = new HydrationGuard();
export type { HydrationReport, HydrationRisk, HydrationFix, HydrationRiskType, HydrationSeverity };
