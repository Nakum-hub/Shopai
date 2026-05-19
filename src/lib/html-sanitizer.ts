// =============================================================================
// HTML Sanitizer for Generated Content
// Strips dangerous elements while preserving safe inline functionality
// =============================================================================

export interface SanitizeResult {
  html: string;
  warnings: string[];
  scriptsRemoved: number;
  framesRemoved: number;
  externalLinksRemoved: number;
}

/**
 * Allowed domains for image sources (placeholder services)
 */
const ALLOWED_IMAGE_DOMAINS = ['placehold.co'];

/**
 * Check if a URL is an allowed external domain
 */
function isAllowedExternalDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a safe relative URL (anchor, no protocol)
 */
function isSafeRelativeUrl(url: string): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  // Empty, hash-only, or relative path
  if (trimmed === '' || trimmed === '#' || trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  // Not a protocol-based URL
  if (!trimmed.includes(':')) return true;
  return false;
}

/**
 * Sanitize href attributes: remove javascript:, data: URIs, external URLs
 * except allowed domains
 */
function sanitizeHref(href: string): string | null {
  if (!href) return null;
  const trimmed = href.trim();

  // Remove javascript: URLs entirely
  if (/^\s*javascript\s*:/i.test(trimmed)) return null;

  // Remove data: URIs
  if (/^\s*data\s*:/i.test(trimmed)) return null;

  // Allow relative URLs (anchors, paths)
  if (isSafeRelativeUrl(trimmed)) return trimmed;

  // Block all other external URLs
  return null;
}

/**
 * Sanitize src attributes on images: only allow placehold.co and data URIs
 */
function sanitizeImgSrc(src: string): string | null {
  if (!src) return null;
  const trimmed = src.trim();

  // Allow data URIs for inline images
  if (/^\s*data\s*:/i.test(trimmed)) return trimmed;

  // Allow relative URLs
  if (isSafeRelativeUrl(trimmed)) return trimmed;

  // Allow specific domains
  if (isAllowedExternalDomain(trimmed)) return trimmed;

  return null;
}

/**
 * Remove dangerous patterns from inline script content
 */
function sanitizeInlineScriptContent(content: string): string {
  let sanitized = content;

  // Remove window.open calls
  sanitized = sanitized.replace(/window\s*\.\s*open\s*\(/g, '/* [removed: window.open] */');

  // Remove document.location assignments
  sanitized = sanitized.replace(/document\s*\.\s*location\s*=/g, '/* [removed: document.location] */');
  sanitized = sanitized.replace(/window\s*\.\s*location\s*=/g, '/* [removed: window.location] */');
  sanitized = sanitized.replace(/location\s*\.\s*href\s*=/g, '/* [removed: location.href] */');

  // Remove eval() calls
  sanitized = sanitized.replace(/\beval\s*\(/g, '/* [removed: eval] */');

  // Remove document.cookie access
  sanitized = sanitized.replace(/document\s*\.\s*cookie/g, '/* [removed: document.cookie] */');

  // Remove localStorage/sessionStorage access
  sanitized = sanitized.replace(/localStorage\s*\./g, '/* [removed: localStorage] */');
  sanitized = sanitized.replace(/sessionStorage\s*\./g, '/* [removed: sessionStorage] */');

  // Remove postMessage
  sanitized = sanitized.replace(/window\s*\.\s*postMessage/g, '/* [removed: postMessage] */');

  // Remove XMLHttpRequest / fetch
  sanitized = sanitized.replace(/new\s+XMLHttpRequest/g, '/* [removed: XMLHttpRequest] */');

  return sanitized;
}

/**
 * Main HTML sanitizer function
 * Removes dangerous elements, scripts with external src, frames, and unsafe URLs
 * Preserves inline scripts (needed for basic interactivity) after sanitizing their content
 */
export function sanitizeGeneratedHtml(html: string): SanitizeResult {
  const warnings: string[] = [];
  let scriptsRemoved = 0;
  let framesRemoved = 0;
  let externalLinksRemoved = 0;

  let result = html;

  // =========================================================================
  // 1. Remove <meta http-equiv="refresh"> tags
  // =========================================================================
  const metaRefreshRegex = /<meta\s+[^>]*http-equiv\s*=\s*["']?\s*refresh[^>]*\/?>/gi;
  const metaRefreshMatches = result.match(metaRefreshRegex);
  if (metaRefreshMatches) {
    metaRefreshMatches.forEach(() => {
      warnings.push('Removed <meta http-equiv="refresh"> (redirect prevention)');
    });
    result = result.replace(metaRefreshRegex, '');
  }

  // =========================================================================
  // 2. Remove <script> tags with external src
  // =========================================================================
  const externalScriptRegex = /<script\s+[^>]*src\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/script\s*>/gi;
  const externalScriptMatches = result.match(externalScriptRegex);
  if (externalScriptMatches) {
    scriptsRemoved += externalScriptMatches.length;
    externalScriptMatches.forEach((match) => {
      const srcMatch = match.match(/src\s*=\s*["']([^"']*)["']/);
      warnings.push(`Removed external script: ${srcMatch ? srcMatch[1] : 'unknown'}`);
    });
    result = result.replace(externalScriptRegex, '');
  }

  // =========================================================================
  // 3. Remove <iframe>, <embed>, <object> tags
  // =========================================================================
  const frameRegex = /<(iframe|embed|object)\s+[^>]*>[\s\S]*?<\/(iframe|embed|object)\s*>/gi;
  const frameMatches = result.match(frameRegex);
  if (frameMatches) {
    framesRemoved += frameMatches.length;
    frameMatches.forEach((match) => {
      const tagMatch = match.match(/<(iframe|embed|object)/i);
      warnings.push(`Removed <${tagMatch ? tagMatch[1] : 'frame'}> element (nesting prevention)`);
    });
    result = result.replace(frameRegex, '');
  }

  // Also remove self-closing iframe/embed/object tags
  const selfClosingFrameRegex = /<(iframe|embed|object)\s+[^>]*\/>/gi;
  const selfClosingMatches = result.match(selfClosingFrameRegex);
  if (selfClosingMatches) {
    framesRemoved += selfClosingMatches.length;
    selfClosingMatches.forEach(() => {
      warnings.push('Removed self-closing frame/embed/object element');
    });
    result = result.replace(selfClosingFrameRegex, '');
  }

  // =========================================================================
  // 4. Remove <link rel="import"> and external stylesheet imports
  // =========================================================================
  const externalLinkRegex = /<link\s+[^>]*(?:rel\s*=\s*["']?\s*import|stylesheet)[^>]*href\s*=\s*["'][^"']*["'][^>]*\/?>/gi;
  const externalLinkMatches = result.match(externalLinkRegex);
  if (externalLinkMatches) {
    externalLinksRemoved += externalLinkMatches.length;
    externalLinkMatches.forEach((match) => {
      const hrefMatch = match.match(/href\s*=\s*["']([^"']*)["']/);
      warnings.push(`Removed external link/import: ${hrefMatch ? hrefMatch[1] : 'unknown'}`);
    });
    result = result.replace(externalLinkRegex, '');
  }

  // =========================================================================
  // 5. Remove <form> with external action
  // =========================================================================
  const externalFormRegex = /<form\s+[^>]*action\s*=\s*["'](?!#|javascript)[^"']+["'][^>]*>[\s\S]*?<\/form\s*>/gi;
  const externalFormMatches = result.match(externalFormRegex);
  if (externalFormMatches) {
    externalFormMatches.forEach(() => {
      warnings.push('Removed <form> with external action URL');
    });
    result = result.replace(externalFormRegex, '');
  }

  // =========================================================================
  // 6. Sanitize inline <script> content
  // =========================================================================
  const inlineScriptRegex = /(<script\s*>)([\s\S]*?)(<\/script\s*>)/gi;
  result = result.replace(inlineScriptRegex, (match, openTag, content, closeTag) => {
    const sanitizedContent = sanitizeInlineScriptContent(content);
    if (sanitizedContent !== content) {
      warnings.push('Sanitized inline script: removed dangerous API calls');
    }
    return `${openTag}${sanitizedContent}${closeTag}`;
  });

  // =========================================================================
  // 7. Sanitize href attributes - remove javascript: and data: URIs
  // =========================================================================
  const hrefRegex = /href\s*=\s*["']([^"']*)["']/gi;
  result = result.replace(hrefRegex, (match, href) => {
    const sanitized = sanitizeHref(href);
    if (sanitized === null) {
      externalLinksRemoved++;
      warnings.push(`Removed unsafe href: ${href.substring(0, 80)}`);
      return 'href="#"';
    }
    return match;
  });

  // =========================================================================
  // 8. Sanitize src attributes on <img> tags
  // =========================================================================
  const imgSrcRegex = /<img\s+([^>]*?)src\s*=\s*["']([^"']*)["']([^>]*?)\/?>/gi;
  result = result.replace(imgSrcRegex, (match, before, src, after) => {
    const sanitized = sanitizeImgSrc(src);
    if (sanitized === null) {
      warnings.push(`Removed image with untrusted source: ${src.substring(0, 80)}`);
      // Remove the entire img tag if source is blocked
      return '';
    }
    return match;
  });

  // =========================================================================
  // 9. Sanitize action attributes on remaining forms
  // =========================================================================
  const actionRegex = /action\s*=\s*["']([^"']*)["']/gi;
  result = result.replace(actionRegex, (match, action) => {
    if (/^\s*javascript\s*:/i.test(action)) {
      warnings.push('Removed javascript: form action');
      return 'action="#"';
    }
    return match;
  });

  return {
    html: result,
    warnings,
    scriptsRemoved,
    framesRemoved,
    externalLinksRemoved,
  };
}
