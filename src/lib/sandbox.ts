// =============================================================================
// Sandbox Validation System
// =============================================================================
// Provides HTML rendering validation without requiring Playwright/Docker:
// - Static HTML analysis (structure, links, images, forms)
// - Accessibility compliance checks (WCAG simplified)
// - Mobile responsiveness validation (CSS breakpoint analysis)
// - SEO compliance verification
// - Performance estimation (file size, external deps, render-blocking resources)
// - Security scanning (XSS vectors, insecure protocols, data URIs)
// =============================================================================

import { validateHtml } from '@/lib/html-validator';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SandboxReport {
  /** Overall pass/fail — all critical checks must pass */
  passed: boolean;
  /** 0-100 composite score */
  score: number;
  /** Detailed results from each validator */
  results: SandboxCheck[];
  /** Critical issues that must be fixed */
  criticalIssues: string[];
  /** Warnings that should be addressed */
  warnings: string[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Timestamp of the report */
  timestamp: string;
}

export interface SandboxCheck {
  name: string;
  category: 'structure' | 'accessibility' | 'responsive' | 'seo' | 'performance' | 'security';
  passed: boolean;
  score: number; // 0-100
  details: string;
  issues: string[];
}

// -----------------------------------------------------------------------------
// Validator Functions
// -----------------------------------------------------------------------------

function checkStructure(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;

  // Check for required document structure
  if (!/<!doctype\s+html/i.test(html)) { issues.push('Missing DOCTYPE declaration'); score -= 10; }
  if (!/<html[\s>]/i.test(html)) { issues.push('Missing <html> tag'); score -= 15; }
  if (!/<head[\s>]/i.test(html)) { issues.push('Missing <head> tag'); score -= 10; }
  if (!/<body[\s>]/i.test(html)) { issues.push('Missing <body> tag'); score -= 15; }
  if (!/<\/html>/i.test(html)) { issues.push('Unclosed <html> tag'); score -= 10; }
  if (!/<\/body>/i.test(html)) { issues.push('Unclosed <body> tag'); score -= 10; }
  if (!/<\/head>/i.test(html)) { issues.push('Unclosed <head> tag'); score -= 5; }

  // Check for viewport
  if (!/<meta[^>]+viewport/i.test(html)) { issues.push('Missing viewport meta tag — critical for mobile'); score -= 15; }

  // Check for charset
  if (!/<meta[^>]+charset/i.test(html)) { issues.push('Missing charset declaration'); score -= 5; }

  // Check for lang attribute
  if (!/<html[^>]+lang=/i.test(html)) { issues.push('Missing lang attribute on <html>'); score -= 5; }

  // Check for proper title
  if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) { issues.push('Missing or empty <title> tag'); score -= 10; }

  // Check heading hierarchy
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) { issues.push('Missing H1 heading'); score -= 10; }
  else if (h1Count > 1) { issues.push(`Multiple H1 headings found (${h1Count}) — should have exactly one`); score -= 5; }

  // Check for semantic landmarks
  const hasMain = /<main[\s>]/i.test(html);
  const hasNav = /<nav[\s>]/i.test(html);
  const hasFooter = /<footer[\s>]/i.test(html);
  const hasHeader = /<header[\s>]/i.test(html);
  if (!hasMain) { issues.push('Missing <main> landmark'); score -= 3; }
  if (!hasNav) { issues.push('Missing <nav> landmark'); score -= 2; }
  if (!hasFooter) { issues.push('Missing <footer> element'); score -= 2; }
  if (!hasHeader) { issues.push('Missing <header> element'); score -= 2; }

  return {
    name: 'HTML Structure',
    category: 'structure',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `${issues.length === 0 ? 'All structural checks passed' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

function checkAccessibility(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;

  // Image alt text
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsWithoutAlt = imgTags.filter(img => !/alt\s*=/i.test(img));
  if (imgsWithoutAlt.length > 0) {
    issues.push(`${imgsWithoutAlt.length} image(s) missing alt text`);
    score -= imgsWithoutAlt.length * 10;
  }

  // Form labels
  const inputs = html.match(/<input[^>]*>/gi) || [];
  const inputsWithoutLabels = inputs.filter(input =>
    !/type=["'](?:hidden|submit|button|reset)["']/i.test(input)
  );
  if (inputsWithoutLabels.length > 0 && !/<label/i.test(html)) {
    issues.push('Form inputs exist but no <label> elements found');
    score -= 10;
  }

  // ARIA attributes on interactive elements
  const buttons = html.match(/<button[^>]*>/gi) || [];
  const links = html.match(/<a[^>]*>/gi) || [];
  if (buttons.length === 0 && links.length === 0 && inputs.length > 0) {
    issues.push('Form exists but no submit button or action link found');
    score -= 10;
  }

  // Color contrast — check if CSS defines very light text on light bg or vice versa
  const hasLowContrastRisk = /color:\s*#f{3,6}[;\s]/i.test(html) || /color:\s*#fff[a-f0-9]?[;\s]/i.test(html);
  if (hasLowContrastRisk && /background(-color)?:\s*#fff[a-f0-9]?[;\s]/i.test(html)) {
    issues.push('Possible low contrast: white text on white background detected');
    score -= 15;
  }

  // Focus indicators
  if (!/focus/i.test(html) && (buttons.length > 0 || links.length > 0)) {
    issues.push('No focus indicators defined for interactive elements');
    score -= 5;
  }

  // Skip to content link
  if (/<nav[\s>]/i.test(html) && !/skip/i.test(html)) {
    issues.push('No "skip to content" link found for keyboard navigation');
    score -= 3;
  }

  // Reduced motion respect
  if (/@keyframes/i.test(html) && !/(prefers-reduced-motion|prefers-reduced)/i.test(html)) {
    issues.push('Animations defined without prefers-reduced-motion media query');
    score -= 5;
  }

  return {
    name: 'Accessibility',
    category: 'accessibility',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `${issues.length === 0 ? 'All accessibility checks passed' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

function checkResponsive(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;

  // Media queries
  const mediaQueryCount = (html.match(/@media[^{]+\{/gi) || []).length;
  if (mediaQueryCount === 0) {
    issues.push('No CSS media queries found — site may not be mobile-responsive');
    score -= 30;
  } else if (mediaQueryCount === 1) {
    issues.push('Only 1 media query — consider adding breakpoints for tablet/desktop');
    score -= 10;
  }

  // Check for responsive units
  const hasVw = /vw/i.test(html);
  const hasVh = /vh/i.test(html);
  const hasPercent = /width:\s*\d+%/.test(html) || /max-width:\s*\d+%/.test(html);
  const hasRem = /rem/.test(html);
  if (!hasPercent && !hasVw && !hasRem && !hasVh) {
    issues.push('No responsive units (%/vw/vh/rem) detected — layout may not adapt to screen sizes');
    score -= 15;
  }

  // Check for fixed width that could cause horizontal scroll
  const fixedWidths = html.match(/width:\s*\d{3,5}px/gi) || [];
  if (fixedWidths.length > 0) {
    issues.push(`${fixedWidths.length} fixed-width element(s) found — may cause overflow on mobile`);
    score -= fixedWidths.length * 5;
  }

  // Check for viewport meta (already in structure but critical for responsive)
  if (!/<meta[^>]+viewport/i.test(html)) {
    issues.push('Missing viewport meta tag');
    score -= 20;
  }

  // Check for modern layout techniques
  const hasFlexbox = /display:\s*flex/i.test(html) || /flex-/.test(html);
  const hasGrid = /display:\s*grid/i.test(html) || /grid-/.test(html);
  if (!hasFlexbox && !hasGrid) {
    issues.push('No flexbox or grid layout detected — may struggle with responsive design');
    score -= 15;
  }

  // Check for overflow handling
  if (!/overflow/.test(html) && /min-width:\s*\d{4,}px/i.test(html)) {
    issues.push('Min-width constraint without overflow handling');
    score -= 10;
  }

  return {
    name: 'Responsive Design',
    category: 'responsive',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `${issues.length === 0 ? 'Fully responsive' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

function checkSEO(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!titleMatch) {
    issues.push('Missing <title> tag — critical for SEO');
    score -= 20;
  } else if (titleMatch[1].length > 60) {
    issues.push(`Title too long (${titleMatch[1].length} chars, max 60 recommended)`);
    score -= 5;
  } else if (titleMatch[1].length < 10) {
    issues.push('Title too short — should be descriptive (10-60 chars)');
    score -= 5;
  }

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (!metaDescMatch) {
    issues.push('Missing meta description — important for search result snippets');
    score -= 15;
  } else if (metaDescMatch[1].length > 160) {
    issues.push(`Meta description too long (${metaDescMatch[1].length} chars, max 160)`);
    score -= 5;
  }

  // Meta keywords
  if (!/<meta[^>]+name=["']keywords["']/i.test(html)) {
    issues.push('Missing meta keywords');
    score -= 3;
  }

  // Open Graph tags
  if (!/<meta[^>]+property=["']og:/i.test(html)) {
    issues.push('Missing Open Graph tags — social sharing will use defaults');
    score -= 5;
  }

  // Canonical URL
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) {
    issues.push('Missing canonical URL — risk of duplicate content issues');
    score -= 5;
  }

  // Heading hierarchy
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
  if (h1Count !== 1) { issues.push(`Expected exactly 1 H1, found ${h1Count}`); score -= 10; }
  if (h2Count === 0) { issues.push('No H2 headings — poor content structure for search engines'); score -= 5; }

  // Content depth
  const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 100) {
    issues.push(`Thin content (${wordCount} words) — aim for 300+ words for better SEO`);
    score -= 15;
  } else if (wordCount < 300) {
    issues.push(`Content could be richer (${wordCount} words) — 300+ words recommended`);
    score -= 5;
  }

  // Robots meta
  if (!/<meta[^>]+name=["']robots["']/i.test(html)) {
    issues.push('No robots meta tag — search engines will use defaults');
    score -= 3;
  }

  return {
    name: 'SEO Compliance',
    category: 'seo',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `${issues.length === 0 ? 'All SEO checks passed' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

function checkPerformance(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;
  const htmlSizeBytes = Buffer.byteLength(html, 'utf-8');

  // File size check
  if (htmlSizeBytes > 500_000) {
    issues.push(`HTML is very large (${(htmlSizeBytes / 1024).toFixed(0)}KB) — consider lazy loading sections`);
    score -= 15;
  } else if (htmlSizeBytes > 200_000) {
    issues.push(`HTML is large (${(htmlSizeBytes / 1024).toFixed(0)}KB) — may impact load time`);
    score -= 5;
  }

  // External resources
  const externalScripts = (html.match(/<script[^>]+src=["']https?:\/\//gi) || []).length;
  const externalStylesheets = (html.match(/<link[^>]+href=["']https?:\/\/[^"']+\.css["']/gi) || []).length;
  const externalImages = (html.match(/<img[^>]+src=["']https?:\/\//gi) || []).length;

  if (externalScripts > 3) {
    issues.push(`${externalScripts} external scripts — consider inlining or combining`);
    score -= externalScripts * 3;
  }

  if (externalStylesheets > 2) {
    issues.push(`${externalStylesheets} external stylesheets — render-blocking resources`);
    score -= externalStylesheets * 5;
  }

  // Render-blocking resources in head
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const headContent = headMatch[1];
    const renderBlockingScripts = (headContent.match(/<script[^>]+src=/gi) || []).length;
    if (renderBlockingScripts > 0) {
      issues.push(`${renderBlockingScripts} render-blocking script(s) in <head> — add defer/async`);
      score -= renderBlockingScripts * 8;
    }
  }

  // Large inline styles
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  for (const block of styleBlocks) {
    if (block.length > 20_000) {
      issues.push('Large inline style block (>20KB) — consider splitting into sections');
      score -= 5;
    }
  }

  // Image optimization hints
  const largeImages = (html.match(/<img[^>]+src=["']https?:\/\/[^"']{200,}/gi) || []).length;
  if (largeImages > 0) {
    issues.push('Consider using optimized image formats (WebP/AVIF) and srcset');
    score -= 5;
  }

  // No lazy loading
  if (externalImages > 3 && !/loading=["']lazy["']/i.test(html)) {
    issues.push('Multiple images without lazy loading — add loading="lazy" to below-fold images');
    score -= 5;
  }

  return {
    name: 'Performance',
    category: 'performance',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `HTML size: ${(htmlSizeBytes / 1024).toFixed(1)}KB — ${issues.length === 0 ? 'Optimized' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

function checkSecurity(html: string): SandboxCheck {
  const issues: string[] = [];
  let score = 100;

  // JavaScript URIs
  if (/javascript\s*:/gi.test(html)) {
    issues.push('javascript: URIs detected — XSS vulnerability');
    score -= 25;
  }

  // Event handlers (inline JS)
  const eventHandlers = (html.match(/\bon\w+\s*=/gi) || []).length;
  if (eventHandlers > 0) {
    issues.push(`${eventHandlers} inline event handler(s) — potential XSS vectors`);
    score -= eventHandlers * 5;
  }

  // data: URIs (potential XSS)
  if (/data\s*:\s*text\/html/gi.test(html)) {
    issues.push('data:text/html URIs detected — XSS risk');
    score -= 20;
  }

  // Insecure HTTP resources
  const httpResources = (html.match(/src=["']http:\/\//gi) || []).length
    + (html.match(/href=["']http:\/\//gi) || []).length;
  if (httpResources > 0) {
    issues.push(`${httpResources} resource(s) using insecure HTTP — should use HTTPS`);
    score -= httpResources * 5;
  }

  // eval() or Function()
  if (/\beval\s*\(/i.test(html) || /new\s+Function\s*\(/i.test(html)) {
    issues.push('eval() or new Function() detected — code injection risk');
    score -= 20;
  }

  // <embed>, <object>, <base> tags
  if (/<\s*embed\b/i.test(html)) { issues.push('<embed> tag detected — potential security risk'); score -= 10; }
  if (/<\s*object\b/i.test(html)) { issues.push('<object> tag detected — potential security risk'); score -= 10; }
  if (/<\s*base\b/i.test(html)) { issues.push('<base> tag detected — can hijack relative URLs'); score -= 15; }

  // iframe without sandbox
  const iframes = html.match(/<iframe[^>]*>/gi) || [];
  for (const iframe of iframes) {
    if (!/sandbox/i.test(iframe)) {
      issues.push('iframe without sandbox attribute');
      score -= 10;
    }
  }

  // External form actions
  if (/action=["']https?:\/\/(?!localhost|127\.0\.0\.1)/i.test(html)) {
    issues.push('Form action pointing to external URL — verify destination is trusted');
    score -= 10;
  }

  return {
    name: 'Security Scan',
    category: 'security',
    passed: score >= 70,
    score: Math.max(0, score),
    details: `${issues.length === 0 ? 'No security issues found' : `${issues.length} issue(s) found`}`,
    issues,
  };
}

// -----------------------------------------------------------------------------
// Main Sandbox Validator
// -----------------------------------------------------------------------------

/**
 * Run a comprehensive sandbox validation on generated HTML.
 * Checks: structure, accessibility, responsive design, SEO, performance, security.
 * Returns a detailed report with scores, issues, and recommendations.
 */
export function runSandboxValidation(html: string): SandboxReport {
  // Also run the existing 15-check validator
  const baseValidation = validateHtml(html);

  // Run all sandbox checks
  const results: SandboxCheck[] = [
    checkStructure(html),
    checkAccessibility(html),
    checkResponsive(html),
    checkSEO(html),
    checkPerformance(html),
    checkSecurity(html),
  ];

  // Collect critical issues and warnings
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const result of results) {
    for (const issue of result.issues) {
      if (result.score < 50 || result.category === 'security') {
        criticalIssues.push(`[${result.category}] ${issue}`);
      } else {
        warnings.push(`[${result.category}] ${issue}`);
      }
    }
  }

  // Also include base validation issues
  for (const issue of baseValidation.issues) {
    if (issue.severity === 'error') {
      criticalIssues.push(`[validation] ${issue.message}`);
    } else if (issue.severity === 'warning') {
      warnings.push(`[validation] ${issue.message}`);
    }
  }

  // Generate recommendations
  if (criticalIssues.length === 0 && warnings.length <= 2) {
    recommendations.push('Generated HTML meets quality standards — ready for deployment');
  }

  const failedCategories = results.filter(r => !r.passed);
  for (const fc of failedCategories) {
    switch (fc.category) {
      case 'structure':
        recommendations.push('Fix structural HTML issues: ensure proper DOCTYPE, head, body, and heading hierarchy');
        break;
      case 'accessibility':
        recommendations.push('Improve accessibility: add alt text to images, ensure proper form labels, add ARIA attributes');
        break;
      case 'responsive':
        recommendations.push('Add responsive breakpoints (@media queries) and use flexible units (%, vw, rem)');
        break;
      case 'seo':
        recommendations.push('Improve SEO: add descriptive title, meta description, Open Graph tags, and canonical URL');
        break;
      case 'performance':
        recommendations.push('Optimize performance: reduce file size, defer scripts, lazy-load images');
        break;
      case 'security':
        recommendations.push('Fix security issues: remove inline event handlers, use HTTPS, sandbox iframes');
        break;
    }
  }

  // Calculate composite score
  const weights: Record<string, number> = {
    structure: 0.25,
    accessibility: 0.15,
    responsive: 0.20,
    seo: 0.20,
    performance: 0.10,
    security: 0.10,
  };

  const compositeScore = Math.round(
    results.reduce((sum, r) => sum + r.score * (weights[r.category] || 0.1), 0),
  );

  return {
    passed: criticalIssues.length === 0 && compositeScore >= 60,
    score: compositeScore,
    results,
    criticalIssues,
    warnings,
    recommendations,
    timestamp: new Date().toISOString(),
  };
}
