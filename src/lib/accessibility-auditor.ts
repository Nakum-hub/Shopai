// =============================================================================
// StoreCraft AI — Accessibility Auditor (WCAG 2.1 AA)
// =============================================================================

// =============================================================================
// Types
// =============================================================================

type A11yImpact = 'critical' | 'serious' | 'moderate' | 'minor';

interface A11yViolation {
  rule: string;
  impact: A11yImpact;
  element: string;
  description: string;
  wcagCriteria: string;
  helpUrl: string;
}

interface A11yWarning {
  rule: string;
  element: string;
  description: string;
}

interface A11yPass {
  rule: string;
  description: string;
}

interface AccessibilityReport {
  score: number;
  passed: boolean;
  wcagLevel: 'A' | 'AA' | 'AAA' | 'fail';
  violations: A11yViolation[];
  warnings: A11yWarning[];
  passes: A11yPass[];
  summary: string;
  impactCounts: { critical: number; serious: number; moderate: number; minor: number };
}

// =============================================================================
// Helpers
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 1;
  const l1 = luminance(c1.r, c1.g, c1.b);
  const l2 = luminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// =============================================================================
// Accessibility Auditor
// =============================================================================

class AccessibilityAuditor {

  /** Full WCAG 2.1 AA audit */
  audit(html: string, css?: string): AccessibilityReport {
    const violations: A11yViolation[] = [];
    const warnings: A11yWarning[] = [];
    const passes: A11yPass[] = [];
    const extractedCss = css || this.extractCSS(html);

    // A. Semantic HTML
    this.checkHeadingHierarchy(html, violations, passes);
    this.checkLandmarkRegions(html, violations, warnings, passes);
    this.checkImageAltText(html, violations, passes);
    this.checkLinkText(html, warnings, passes);
    this.checkIframeTitle(html, violations, passes);
    this.checkButtonAccessibility(html, violations, passes);
    this.checkFormLabels(html, violations, passes);

    // B. Color & Contrast
    this.checkColorContrast(html, extractedCss, violations, passes);

    // C. Language & Meta
    this.checkLangAttribute(html, violations, passes);
    this.checkDocumentTitle(html, violations, passes);

    // D. ARIA
    this.checkAriaHidden(html, violations);
    this.checkPositiveTabindex(html, warnings);

    // E. Skip Navigation
    this.checkSkipLinks(html, warnings, passes);

    // F. Deprecated Elements
    this.checkDeprecatedTags(html, violations, passes);

    // Calculate score
    const impactWeights = { critical: 20, serious: 10, moderate: 5, minor: 2 };
    let deduction = 0;
    for (const v of violations) {
      deduction += impactWeights[v.impact] ?? 5;
    }
    const score = Math.max(0, Math.min(100, 100 - deduction));

    // Determine WCAG level
    const hasCritical = violations.some(v => v.impact === 'critical');
    const hasSerious = violations.some(v => v.impact === 'serious');
    let wcagLevel: 'A' | 'AA' | 'AAA' | 'fail' = 'AAA';
    if (hasCritical) wcagLevel = 'fail';
    else if (hasSerious) wcagLevel = 'fail';
    else if (score >= 90) wcagLevel = 'AAA';
    else if (score >= 70) wcagLevel = 'AA';
    else wcagLevel = 'A';

    const impactCounts = {
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
    };

    let summary: string;
    if (score >= 90) summary = 'Excellent accessibility — exceeds WCAG AA';
    else if (score >= 70) summary = 'Good accessibility — meets WCAG AA requirements';
    else if (score >= 50) summary = 'Moderate accessibility — improvements needed for WCAG AA';
    else summary = 'Poor accessibility — significant issues found';

    return { score, passed: score >= 70, wcagLevel, violations, warnings, passes, summary, impactCounts };
  }

  // ─── A. Semantic HTML Checks ─────────────────────────────────────────

  private checkHeadingHierarchy(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const pattern = /<(h[1-6])[\s>]/gi;
    const matches = [...html.matchAll(pattern)];
    if (matches.length === 0) {
      passes.push({ rule: 'heading-order', description: 'No headings found (appropriate for simple pages)' });
      return;
    }

    let lastLevel = 0;
    let h1Count = 0;
    for (const match of matches) {
      const level = parseInt(match[1][1]);
      if (level === 1) h1Count++;

      if (level > lastLevel + 1 && lastLevel > 0) {
        violations.push({
          rule: 'heading-order', impact: 'serious', element: `<${match[1]}>`,
          description: `Heading level skipped: h${lastLevel} → h${level}`,
          wcagCriteria: '1.3.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        });
      }
      lastLevel = level;
    }

    if (h1Count > 1) {
      violations.push({
        rule: 'heading-order', impact: 'serious', element: 'h1',
        description: `Multiple H1 headings found (${h1Count}). Use only one H1 per page.`,
        wcagCriteria: '1.3.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      });
    } else if (h1Count === 1) {
      passes.push({ rule: 'heading-order', description: 'Exactly one H1 heading found' });
    }
  }

  private checkLandmarkRegions(html: string, violations: A11yViolation[], warnings: A11yWarning[], passes: A11yPass[]) {
    const hasMain = /<main[\s>]/i.test(html);
    const hasNav = /<nav[\s>]/i.test(html);
    const hasHeader = /<header[\s>]/i.test(html);
    const hasFooter = /<footer[\s>]/i.test(html);

    if (!hasMain) {
      violations.push({
        rule: 'landmark-one-main', impact: 'critical', element: '<main>',
        description: 'Page missing <main> landmark region',
        wcagCriteria: '1.3.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      });
    } else {
      passes.push({ rule: 'landmark-one-main', description: 'Main landmark region found' });
    }

    if (!hasNav) {
      warnings.push({ rule: 'landmark-navigation', element: '<nav>', description: 'No <nav> landmark found' });
    } else {
      passes.push({ rule: 'landmark-navigation', description: 'Navigation landmark found' });
    }

    if (hasHeader) passes.push({ rule: 'landmark-banner', description: 'Header/banner landmark found' });
    if (hasFooter) passes.push({ rule: 'landmark-contentinfo', description: 'Footer/contentinfo landmark found' });
  }

  private checkImageAltText(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const imgPattern = /<img([^>]*)>/gi;
    const images = [...html.matchAll(imgPattern)];
    if (images.length === 0) {
      passes.push({ rule: 'image-alt', description: 'No images found' });
      return;
    }

    for (const img of images) {
      const attrs = img[1];
      const hasAlt = /alt\s*=/i.test(attrs);
      const altValue = attrs.match(/alt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const altContent = altValue ? (altValue[1] || altValue[2] || '').trim() : null;
      const isDecorative = altContent === '' || altContent === null;

      if (!hasAlt) {
        violations.push({
          rule: 'image-alt', impact: 'critical', element: '<img>',
          description: 'Image missing alt attribute',
          wcagCriteria: '1.1.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        });
      } else if (isDecorative) {
        // Decorative images should have empty alt — that's correct
        passes.push({ rule: 'image-alt', description: 'Decorative image has empty alt attribute' });
      } else {
        passes.push({ rule: 'image-alt', description: `Image has alt text: "${altContent}"` });
      }
    }
  }

  private checkLinkText(html: string, warnings: A11yWarning[], passes: A11yPass[]) {
    const linkPattern = /<a[^>]*>([\s\S]*?)<\/a>/gi;
    const links = [...html.matchAll(linkPattern)];
    const poorLinkTexts = /^(click here|read more|learn more|here|more|link|go|this|details)$/i;

    let poorCount = 0;
    for (const link of links) {
      const text = link[1].trim();
      if (text.length > 0 && text.length < 15 && poorLinkTexts.test(text)) {
        poorCount++;
        warnings.push({ rule: 'link-name', element: `<a>${text}</a>`, description: `Link text "${text}" is not descriptive` });
      }
    }

    if (poorCount === 0 && links.length > 0) {
      passes.push({ rule: 'link-name', description: 'All links have descriptive text' });
    }
  }

  private checkIframeTitle(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const iframePattern = /<iframe([^>]*)>/gi;
    const iframes = [...html.matchAll(iframePattern)];

    for (const iframe of iframes) {
      const attrs = iframe[1];
      if (!/title\s*=/i.test(attrs)) {
        violations.push({
          rule: 'frame-title', impact: 'serious', element: '<iframe>',
          description: 'Iframe missing title attribute',
          wcagCriteria: '2.4.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
        });
      }
    }

    if (iframes.length === 0) {
      passes.push({ rule: 'frame-title', description: 'No iframes found' });
    }
  }

  private checkButtonAccessibility(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const btnPattern = /<button([^>]*)>([\s\S]*?)<\/button>/gi;
    const buttons = [...html.matchAll(btnPattern)];

    for (const btn of buttons) {
      const attrs = btn[1];
      const content = btn[2].trim();
      const hasAriaLabel = /aria-label\s*=/i.test(attrs);
      const hasAriaLabelledBy = /aria-labelledby\s*=/i.test(attrs);
      const hasContent = content.length > 0;

      if (!hasContent && !hasAriaLabel && !hasAriaLabelledBy) {
        violations.push({
          rule: 'button-name', impact: 'critical', element: '<button>',
          description: 'Button has no accessible name',
          wcagCriteria: '4.1.2', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
        });
      }
    }

    if (buttons.length > 0 && violations.every(v => v.rule !== 'button-name')) {
      passes.push({ rule: 'button-name', description: 'All buttons have accessible names' });
    }
  }

  private checkFormLabels(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const inputPattern = /<input([^>]*)>/gi;
    const inputs = [...html.matchAll(inputPattern)];
    if (inputs.length === 0) {
      passes.push({ rule: 'label', description: 'No form inputs found' });
      return;
    }

    const labeledInputs = inputs.filter(inp => {
      const attrs = inp[1];
      const hasLabel = /aria-label\s*=/i.test(attrs) || /aria-labelledby\s*=/i.test(attrs);
      const isHidden = /type\s*=\s*["']hidden["']/i.test(attrs);
      return hasLabel || isHidden;
    });

    if (labeledInputs.length < inputs.length) {
      violations.push({
        rule: 'label', impact: 'serious', element: '<input>',
        description: `${inputs.length - labeledInputs.length} form inputs may be missing labels`,
        wcagCriteria: '1.3.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      });
    } else {
      passes.push({ rule: 'label', description: 'All form inputs have associated labels' });
    }
  }

  // ─── B. Color & Contrast ─────────────────────────────────────────────

  private checkColorContrast(html: string, css: string, violations: A11yViolation[], passes: A11yPass[]) {
    // Extract inline color declarations
    const colorPattern = /(?:color|background-color|background)\s*:\s*(#[0-9a-fA-F]{6})/gi;
    const cssColors = [...css.matchAll(colorPattern)].map(m => m[1]);

    if (cssColors.length < 2) {
      passes.push({ rule: 'color-contrast', description: 'Not enough color declarations to check contrast' });
      return;
    }

    // Check primary/secondary pair
    for (let i = 0; i < cssColors.length - 1; i += 2) {
      const fg = cssColors[i], bg = cssColors[i + 1];
      const ratio = contrastRatio(fg, bg);
      if (ratio < 3.0) {
        violations.push({
          rule: 'color-contrast', impact: 'serious', element: `${fg} on ${bg}`,
          description: `Low contrast ratio ${ratio.toFixed(2)}:1 (minimum 4.5:1 for normal text)`,
          wcagCriteria: '1.4.3', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        });
      } else if (ratio < 4.5) {
        violations.push({
          rule: 'color-contrast', impact: 'moderate', element: `${fg} on ${bg}`,
          description: `Contrast ratio ${ratio.toFixed(2)}:1 — passes large text (3:1) but may fail normal text (4.5:1)`,
          wcagCriteria: '1.4.3', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
        });
      }
    }

    if (violations.filter(v => v.rule === 'color-contrast').length === 0) {
      passes.push({ rule: 'color-contrast', description: 'Color contrast meets WCAG AA minimum' });
    }
  }

  // ─── C. Language & Meta ──────────────────────────────────────────────

  private checkLangAttribute(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const hasLang = /<html[^>]+lang\s*=\s*["'][a-z]{2,}["']/i.test(html);
    if (!hasLang) {
      violations.push({
        rule: 'html-lang', impact: 'serious', element: '<html>',
        description: 'Missing lang attribute on <html> element',
        wcagCriteria: '3.1.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
      });
    } else {
      passes.push({ rule: 'html-lang', description: 'HTML lang attribute present' });
    }
  }

  private checkDocumentTitle(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (!titleMatch || titleMatch[1].trim().length === 0) {
      violations.push({
        rule: 'document-title', impact: 'serious', element: '<title>',
        description: 'Missing or empty <title> element',
        wcagCriteria: '2.4.2', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html',
      });
    } else {
      passes.push({ rule: 'document-title', description: `Document title: "${titleMatch[1].trim()}"` });
    }
  }

  // ─── D. ARIA Checks ──────────────────────────────────────────────────

  private checkAriaHidden(html: string, violations: A11yViolation[]) {
    const hiddenPattern = /<([a-z]+)[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/\1>/gi;
    const hidden = [...html.matchAll(hiddenPattern)];

    for (const match of hidden) {
      const content = match[2];
      if (/<a[\s>]|<button[\s>]|<input[\s>]|<select[\s>]|<textarea[\s>]/i.test(content)) {
        violations.push({
          rule: 'aria-hidden-focus', impact: 'critical', element: `<${match[1]} aria-hidden>`,
          description: 'aria-hidden element contains focusable children',
          wcagCriteria: '4.1.2', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
        });
      }
    }
  }

  private checkPositiveTabindex(html: string, warnings: A11yWarning[]) {
    const tabIndexPattern = /tabindex\s*=\s*["']([1-9]\d*)["']/gi;
    const matches = [...html.matchAll(tabIndexPattern)];
    for (const match of matches) {
      warnings.push({ rule: 'tabindex', element: `tabindex="${match[1]}"`, description: `Positive tabindex (${match[1]}) disrupts natural tab order` });
    }
  }

  // ─── E. Skip Navigation ──────────────────────────────────────────────

  private checkSkipLinks(html: string, warnings: A11yWarning[], passes: A11yPass[]) {
    const hasSkipLink = /<a[^>]*(?:skip|jump|nav|main|content)[^>]*href\s*=\s*["']#(?!$)[^"']+["'][^>]*>/i.test(html);
    if (!hasSkipLink) {
      warnings.push({ rule: 'skip-link', element: '<a>', description: 'No skip navigation link found' });
    } else {
      passes.push({ rule: 'skip-link', description: 'Skip navigation link found' });
    }
  }

  // ─── F. Deprecated Elements ──────────────────────────────────────────

  private checkDeprecatedTags(html: string, violations: A11yViolation[], passes: A11yPass[]) {
    const deprecated = [
      { tag: 'center', replacement: 'CSS text-align: center' },
      { tag: 'font', replacement: 'CSS font properties' },
      { tag: 'marquee', replacement: 'CSS animations' },
      { tag: 'blink', replacement: 'CSS animations' },
      { tag: 'big', replacement: 'CSS font-size' },
      { tag: 'strike', replacement: '<del> or CSS text-decoration' },
    ];

    for (const dep of deprecated) {
      if (new RegExp(`<${dep.tag}[\\s>]`, 'i').test(html)) {
        violations.push({
          rule: 'no-deprecated-tags', impact: 'moderate', element: `<${dep.tag}>`,
          description: `Deprecated <${dep.tag}> element — use ${dep.replacement}`,
          wcagCriteria: '1.3.1', helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        });
      }
    }

    if (violations.filter(v => v.rule === 'no-deprecated-tags').length === 0) {
      passes.push({ rule: 'no-deprecated-tags', description: 'No deprecated HTML elements found' });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private extractCSS(html: string): string {
    const matches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    return matches.map(m => m[1]).join('\n');
  }
}

export const accessibilityAuditor = new AccessibilityAuditor();
export type { AccessibilityReport, A11yViolation, A11yWarning, A11yPass, A11yImpact };
