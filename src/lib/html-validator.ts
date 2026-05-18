// =============================================================================
// HTML Validation Engine
// =============================================================================

export interface ValidationResult {
  score: number; // 0-100
  passed: boolean; // score >= 70
  checks: ValidationCheck[];
  issues: ValidationIssue[];
  summary: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  line?: number;
}

/**
 * Comprehensive HTML validation for generated storefront pages.
 */
export function validateHtml(html: string): ValidationResult {
  const checks: ValidationCheck[] = [];
  const issues: ValidationIssue[] = [];

  // --- Structural Checks ---
  const hasDoctype = /<!doctype\s+html/i.test(html);
  checks.push({
    name: 'DOCTYPE',
    passed: hasDoctype,
    detail: hasDoctype ? 'HTML5 DOCTYPE present' : 'Missing <!DOCTYPE html>',
  });
  if (!hasDoctype) issues.push({ severity: 'error', category: 'structure', message: 'Missing DOCTYPE declaration' });

  const hasHtmlTag = /<html[\s>]/i.test(html);
  checks.push({
    name: '<html> tag',
    passed: hasHtmlTag,
    detail: hasHtmlTag ? '<html> tag found' : 'Missing <html> tag',
  });
  if (!hasHtmlTag) issues.push({ severity: 'error', category: 'structure', message: 'Missing <html> tag' });

  const hasHead = /<head[\s>]/i.test(html);
  const hasCloseHead = /<\/head>/i.test(html);
  checks.push({
    name: '<head> section',
    passed: hasHead && hasCloseHead,
    detail: (hasHead && hasCloseHead) ? 'Head section complete' : 'Missing or unclosed <head>',
  });

  const hasBody = /<body[\s>]/i.test(html);
  const hasCloseBody = /<\/body>/i.test(html);
  checks.push({
    name: '<body> section',
    passed: hasBody && hasCloseBody,
    detail: (hasBody && hasCloseBody) ? 'Body section complete' : 'Missing or unclosed <body>',
  });
  if (!hasBody) issues.push({ severity: 'error', category: 'structure', message: 'Missing <body> tag' });

  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  checks.push({
    name: '<title>',
    passed: hasTitle,
    detail: hasTitle ? 'Page title found' : 'Missing <title> tag',
  });
  if (!hasTitle) issues.push({ severity: 'warning', category: 'seo', message: 'Missing page title (SEO impact)' });

  const hasViewport = /<meta[^>]+viewport/i.test(html);
  checks.push({
    name: 'Viewport meta',
    passed: hasViewport,
    detail: hasViewport ? 'Mobile viewport configured' : 'Missing viewport meta tag',
  });
  if (!hasViewport) issues.push({ severity: 'error', category: 'responsive', message: 'Missing viewport meta tag (critical for mobile)' });

  const hasCharset = /<meta[^>]+charset/i.test(html);
  checks.push({
    name: 'Charset',
    passed: hasCharset,
    detail: hasCharset ? 'Character encoding set' : 'Missing charset declaration',
  });

  // --- SEO Checks ---
  const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]+content=/i.test(html) ||
    /<meta[^>]+content=[^>]+name=["']description["']/i.test(html);
  checks.push({
    name: 'Meta description',
    passed: hasMetaDescription,
    detail: hasMetaDescription ? 'SEO meta description found' : 'Missing meta description',
  });
  if (!hasMetaDescription) issues.push({ severity: 'warning', category: 'seo', message: 'Missing meta description tag' });

  // --- Content Quality Checks ---
  const textContent = stripTags(html);
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  checks.push({
    name: 'Content depth',
    passed: wordCount >= 100,
    detail: `${wordCount} words of content (recommended: 100+)`,
  });
  if (wordCount < 50) issues.push({ severity: 'warning', category: 'content', message: `Very little content (${wordCount} words). Consider adding more text for better SEO.` });

  // Check for headings
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  checks.push({
    name: 'H1 heading',
    passed: h1Count === 1,
    detail: h1Count === 1 ? 'Exactly one H1 heading' : h1Count === 0 ? 'Missing H1 heading' : `Multiple H1 headings (${h1Count})`,
  });
  if (h1Count === 0) issues.push({ severity: 'error', category: 'seo', message: 'Missing H1 heading (critical for SEO)' });
  else if (h1Count > 1) issues.push({ severity: 'warning', category: 'seo', message: `Multiple H1 headings (${h1Count}). Should have exactly one.` });

  const hasH2 = /<h2[\s>]/i.test(html);
  checks.push({
    name: 'H2 headings',
    passed: hasH2,
    detail: hasH2 ? 'H2 headings found' : 'No H2 headings (recommended for content structure)',
  });

  // --- Responsive Design Checks ---
  const hasMediaQuery = html.includes('@media') || html.includes('media=');
  checks.push({
    name: 'Responsive CSS',
    passed: hasMediaQuery,
    detail: hasMediaQuery ? 'Media queries detected' : 'No responsive breakpoints found',
  });
  if (!hasMediaQuery) issues.push({ severity: 'warning', category: 'responsive', message: 'No CSS media queries found. May not be mobile-responsive.' });

  const hasFlexboxOrGrid = html.includes('flex') || html.includes('grid');
  checks.push({
    name: 'Modern layout',
    passed: hasFlexboxOrGrid,
    detail: hasFlexboxOrGrid ? 'Uses flexbox/grid' : 'May use outdated layout methods',
  });

  // --- Accessibility Checks ---
  const hasImgAlt = !/<img(?![^>]*alt=)/i.test(html) || !/<img[\s>]/i.test(html);
  checks.push({
    name: 'Image alt text',
    passed: hasImgAlt,
    detail: hasImgAlt ? 'Images have alt attributes' : 'Some images missing alt text',
  });

  const hasLangAttr = /<html[^>]+lang=/i.test(html);
  checks.push({
    name: 'Language attribute',
    passed: hasLangAttr,
    detail: hasLangAttr ? 'HTML lang attribute set' : 'Missing lang attribute on <html>',
  });
  if (!hasLangAttr) issues.push({ severity: 'info', category: 'accessibility', message: 'Missing lang attribute on <html> element' });

  // --- Performance Checks ---
  const hasInlineStyles = /<style[\s>]/i.test(html) || /style="/i.test(html);
  checks.push({
    name: 'Inline styles',
    passed: true, // Inline styles are expected for standalone pages
    detail: hasInlineStyles ? 'Uses inline/embedded styles' : 'No styles detected',
  });

  const hasExternalResources = html.includes('http://') || html.includes('https://');
  checks.push({
    name: 'External dependencies',
    passed: true,
    detail: hasExternalResources ? 'Contains external references' : 'Fully self-contained (no external deps)',
  });

  // --- Calculate Score ---
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  // Weight: errors -5pts each, warnings -2pts each, base = (passed/total)*100
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const baseScore = Math.round((passedChecks / totalChecks) * 100);
  const penalty = errorCount * 5 + warningCount * 2;
  const score = Math.max(0, Math.min(100, baseScore - penalty));

  const passed = score >= 70;

  let summary: string;
  if (score >= 90) summary = 'Excellent quality — production ready';
  else if (score >= 70) summary = 'Good quality — minor improvements recommended';
  else if (score >= 50) summary = 'Acceptable quality — several issues need attention';
  else summary = 'Poor quality — significant issues found';

  return { score, passed, checks, issues, summary };
}

// =============================================================================
// Helpers
// =============================================================================

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempt to auto-repair common HTML issues.
 * Returns the (possibly modified) HTML and a list of repairs made.
 */
export function repairHtml(html: string): { html: string; repairs: string[] } {
  const repairs: string[] = [];
  let repaired = html;

  // Ensure DOCTYPE
  if (!/<!doctype\s+html/i.test(repaired)) {
    repaired = '<!DOCTYPE html>\n' + repaired;
    repairs.push('Added DOCTYPE declaration');
  }

  // Ensure viewport meta
  if (!/<meta[^>]+viewport/i.test(repaired)) {
    if (repaired.includes('<head>')) {
      repaired = repaired.replace('<head>', '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    } else if (repaired.includes('<html')) {
      repaired = repaired.replace(/(<html[^>]*>)/i, '$1\n<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>');
    }
    repairs.push('Added viewport meta tag for mobile responsiveness');
  }

  // Ensure lang attribute
  if (/<html(?![^>]+lang=)/i.test(repaired)) {
    repaired = repaired.replace(/<html/i, '<html lang="en"');
    repairs.push('Added lang="en" attribute to <html>');
  }

  // Ensure charset
  if (!/<meta[^>]+charset/i.test(repaired)) {
    if (repaired.includes('<head>')) {
      repaired = repaired.replace('<head>', '<head>\n    <meta charset="UTF-8">');
    }
    repairs.push('Added UTF-8 charset declaration');
  }

  // Fix unclosed img tags (common LLM mistake)
  repaired = repaired.replace(/<img([^>]*)(?<!\/)>/gi, '<img$1 />');

  return { html: repaired, repairs };
}
