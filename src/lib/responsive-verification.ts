// =============================================================================
// StoreCraft AI — Responsive Verification Engine
// =============================================================================

// =============================================================================
// Types
// =============================================================================

interface ResponsiveIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix?: string;
}

interface ResponsiveReport {
  score: number;
  passed: boolean;
  isMobileFirst: boolean;
  breakpointsUsed: string[];
  missingBreakpoints: string[];
  issues: ResponsiveIssue[];
  recommendations: string[];
}

// =============================================================================
// Constants
// =============================================================================

const STANDARD_BREAKPOINTS = [
  { name: 'sm', value: 640 },
  { name: 'md', value: 768 },
  { name: 'lg', value: 1024 },
  { name: 'xl', value: 1280 },
  { name: '2xl', value: 1536 },
];

// =============================================================================
// Responsive Analyzer
// =============================================================================

class ResponsiveAnalyzer {

  /** Generate full responsive verification report */
  generateReport(html: string): ResponsiveReport {
    const issues: ResponsiveIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Extract CSS from <style> tags
    const css = this.extractCSS(html);

    // 1. Media query analysis
    const mqAnalysis = this.analyzeMediaQueries(css);
    issues.push(...mqAnalysis.issues);

    // 2. Fixed size analysis
    const fixedAnalysis = this.analyzeFixedSizes(html, css);
    issues.push(...fixedAnalysis.issues);

    // 3. Overflow risk analysis
    const overflowAnalysis = this.analyzeOverflowRisks(html);
    issues.push(...overflowAnalysis.issues);

    // 4. Touch target analysis
    const touchAnalysis = this.analyzeTouchTargets(html, css);
    issues.push(...touchAnalysis.issues);

    // 5. Responsive image analysis
    const imageAnalysis = this.analyzeResponsiveImages(html);
    issues.push(...imageAnalysis.issues);

    // 6. Breakpoint completeness
    const usedBreakpoints = mqAnalysis.breakpoints;
    const allBpNames = STANDARD_BREAKPOINTS.map(b => b.name);
    const missingBreakpoints = allBpNames.filter(b => !usedBreakpoints.includes(b));

    if (missingBreakpoints.length > 0 && usedBreakpoints.length > 0) {
      issues.push({ severity: 'info', category: 'breakpoints', message: `Missing standard breakpoints: ${missingBreakpoints.join(', ')}` });
    }

    // Calculate score
    score -= issues.filter(i => i.severity === 'error').length * 10;
    score -= issues.filter(i => i.severity === 'warning').length * 5;
    score -= issues.filter(i => i.severity === 'info').length * 1;

    // Bonus for mobile-first
    if (mqAnalysis.isMobileFirst) score += 5;

    // Recommendations
    if (!mqAnalysis.hasAnyMediaQuery) recommendations.push('Add responsive media queries for different screen sizes');
    if (!mqAnalysis.isMobileFirst && mqAnalysis.hasAnyMediaQuery) recommendations.push('Switch to mobile-first approach (min-width instead of max-width)');
    if (missingBreakpoints.includes('md') || missingBreakpoints.includes('lg')) recommendations.push('Add tablet breakpoint (768px) and desktop breakpoint (1024px)');
    if (imageAnalysis.totalImages > 3 && !imageAnalysis.hasLazyLoading) recommendations.push('Add loading="lazy" to below-fold images');
    if (overflowAnalysis.hasTables) recommendations.push('Wrap tables in overflow-x: auto container for mobile');

    return {
      score: Math.max(0, Math.min(100, score)),
      passed: score >= 70,
      isMobileFirst: mqAnalysis.isMobileFirst,
      breakpointsUsed: usedBreakpoints,
      missingBreakpoints,
      issues,
      recommendations,
    };
  }

  /** Analyze @media rules in CSS */
  private analyzeMediaQueries(css: string): { breakpoints: string[]; isMobileFirst: boolean; hasAnyMediaQuery: boolean; issues: ResponsiveIssue[] } {
    const issues: ResponsiveIssue[] = [];
    const mediaQueryRegex = /@media\s*\(?([^)]+)\)?\s*\{/gi;
    const matches = [...css.matchAll(mediaQueryRegex)];

    if (matches.length === 0) {
      return { breakpoints: [], isMobileFirst: false, hasAnyMediaQuery: false, issues: [{ severity: 'warning', category: 'media-query', message: 'No media queries found — page may not be responsive' }] };
    }

    let minCount = 0, maxCount = 0;
    const breakpoints: string[] = [];

    for (const match of matches) {
      const condition = match[1].trim();
      const minMatch = condition.match(/min-width\s*:\s*(\d+)px/i);
      const maxMatch = condition.match(/max-width\s*:\s*(\d+)px/i);

      if (minMatch) {
        minCount++;
        const val = parseInt(minMatch[1]);
        const standard = STANDARD_BREAKPOINTS.find(b => Math.abs(b.value - val) <= 20);
        if (standard) breakpoints.push(standard.name);
      }
      if (maxMatch) {
        maxCount++;
        const val = parseInt(maxMatch[1]);
        const standard = STANDARD_BREAKPOINTS.find(b => Math.abs(b.value - val) <= 20);
        if (standard) breakpoints.push(standard.name);
      }
    }

    const isMobileFirst = minCount > maxCount;
    const uniqueBp = [...new Set(breakpoints)];

    if (!isMobileFirst && maxCount > 0) {
      issues.push({ severity: 'info', category: 'media-query', message: 'Uses desktop-first (max-width) approach. Mobile-first (min-width) is recommended.' });
    }

    return { breakpoints: uniqueBp, isMobileFirst, hasAnyMediaQuery: true, issues };
  }

  /** Find fixed pixel widths that break responsive */
  private analyzeFixedSizes(html: string, css: string): { issues: ResponsiveIssue[] } {
    const issues: ResponsiveIssue[] = [];

    // Check CSS for fixed widths
    const widthPattern = /width\s*:\s*(\d+)px/gi;
    const cssWidths = [...css.matchAll(widthPattern)];
    for (const match of cssWidths) {
      const val = parseInt(match[1]);
      if (val > 576) {
        issues.push({ severity: 'warning', category: 'fixed-width', message: `Fixed CSS width ${val}px may overflow on mobile (max viewport: 320px)`, fix: `Use max-width: ${val}px; width: 100% instead` });
      }
    }

    // Check inline styles
    const inlineWidthPattern = /style="[^"]*width\s*:\s*(\d+)px[^"]*"/gi;
    const inlineWidths = [...html.matchAll(inlineWidthPattern)];
    for (const match of inlineWidths) {
      const val = parseInt(match[1]);
      if (val > 320) {
        issues.push({ severity: 'warning', category: 'fixed-width', message: `Inline fixed width ${val}px will overflow on small screens` });
      }
    }

    return { issues };
  }

  /** Detect horizontal overflow risks */
  private analyzeOverflowRisks(html: string): { issues: ResponsiveIssue[]; hasTables: boolean; hasCodeBlocks: boolean } {
    const issues: ResponsiveIssue[] = [];

    // Tables without responsive wrapper
    const hasTables = /<table[\s>]/i.test(html);
    if (hasTables && !html.includes('overflow') && !html.includes('responsive')) {
      issues.push({ severity: 'warning', category: 'overflow', message: 'Table without overflow handling may break on mobile', fix: 'Wrap in <div style="overflow-x: auto">' });
    }

    // Code/pre blocks without overflow
    const hasCodeBlocks = /<(pre|code)[\s>]/i.test(html);
    if (hasCodeBlocks) {
      const preWithOverflow = /<pre[^>]*overflow/i.test(html);
      if (!preWithOverflow) {
        issues.push({ severity: 'info', category: 'overflow', message: '<pre> blocks may overflow on mobile — add overflow-x: auto' });
      }
    }

    // Images without max-width
    const imgWithoutMaxWidth = /<img(?![^>]*max-width)[^>]*>/gi;
    const imgMatches = [...html.matchAll(imgWithoutMaxWidth)];
    if (imgMatches.length > 0) {
      issues.push({ severity: 'info', category: 'overflow', message: `${imgMatches.length} images without max-width: 100%`, fix: 'Add style="max-width: 100%; height: auto;" to images' });
    }

    // Flex without wrap
    if (html.includes('display:flex') && !html.includes('flex-wrap')) {
      issues.push({ severity: 'info', category: 'overflow', message: 'Flexbox without flex-wrap may overflow on mobile', fix: 'Add flex-wrap: wrap' });
    }

    return { issues, hasTables, hasCodeBlocks };
  }

  /** Check touch target sizes */
  private analyzeTouchTargets(html: string, css: string): { issues: ResponsiveIssue[] } {
    const issues: ResponsiveIssue[] = [];

    // Check CSS for small padding on interactive elements
    const smallPaddingPattern = /(?:button|a|\.btn)[^{]*\{[^}]*(?:padding\s*:\s*(\d+)px)[^}]*\}/gi;
    const paddingMatches = [...css.matchAll(smallPaddingPattern)];
    for (const match of paddingMatches) {
      const pad = parseInt(match[1]);
      if (pad < 12) {
        issues.push({ severity: 'info', category: 'touch-target', message: `Small padding (${pad}px) on interactive element — minimum 12px recommended for touch` });
      }
    }

    // Check for small fixed-size buttons
    const smallButtonPattern = /<(?:button|a)[^>]*(?:width\s*:\s*(\d+)px|height\s*:\s*(\d+)px)[^>]*/gi;
    const btnMatches = [...html.matchAll(smallButtonPattern)];
    for (const match of btnMatches) {
      const w = parseInt(match[1] || '44');
      const h = parseInt(match[2] || '44');
      if (w < 44 || h < 44) {
        issues.push({ severity: 'warning', category: 'touch-target', message: `Button ${w}x${h}px — minimum touch target is 44x44px`, fix: 'Increase button size to at least 44x44px' });
      }
    }

    return { issues };
  }

  /** Check responsive image setup */
  private analyzeResponsiveImages(html: string): { issues: ResponsiveIssue[]; totalImages: number; hasLazyLoading: boolean; hasSrcset: boolean } {
    const issues: ResponsiveIssue[] = [];
    const allImages = [...html.matchAll(/<img[^>]*>/gi)];
    const totalImages = allImages.length;

    if (totalImages === 0) return { issues, totalImages: 0, hasLazyLoading: true, hasSrcset: true };

    let hasLazyLoading = false;
    let hasSrcset = false;

    for (const img of allImages) {
      const tag = img[0];
      if (tag.includes('loading="lazy"') || tag.includes("loading='lazy'")) {
        hasLazyLoading = true;
      }
      if (tag.includes('srcset')) {
        hasSrcset = true;
      }
    }

    if (totalImages > 3 && !hasLazyLoading) {
      issues.push({ severity: 'info', category: 'images', message: `${totalImages} images without lazy loading — add loading="lazy" to improve performance` });
    }

    if (totalImages > 5 && !hasSrcset) {
      issues.push({ severity: 'info', category: 'images', message: `Consider adding srcset/sizes for ${totalImages} images to serve optimized versions` });
    }

    return { issues, totalImages, hasLazyLoading, hasSrcset };
  }

  /** Extract CSS from <style> tags */
  private extractCSS(html: string): string {
    const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    return styleMatches.map(m => m[1]).join('\n');
  }
}

export const responsiveAnalyzer = new ResponsiveAnalyzer();
export type { ResponsiveReport, ResponsiveIssue };
export { STANDARD_BREAKPOINTS };
