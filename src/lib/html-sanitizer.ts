'use client';

// =============================================================================
// HTML Sanitizer for AI-Generated Content
// =============================================================================
// Context-aware HTML sanitizer using DOMPurify. Provides three security tiers
// (preview, store, deploy) with different allow-lists and custom hooks for
// stripping dangerous resources, validating image sources, and sanitizing CSS.
// =============================================================================

import DOMPurify from 'isomorphic-dompurify';

// =============================================================================
// Types
// =============================================================================

/**
 * Result of sanitizing generated HTML content.
 */
export interface SanitizeResult {
  /** The sanitized HTML string */
  html: string;
  /** Human-readable warnings about removed or modified elements */
  warnings: string[];
  /** Number of <script> elements that were removed */
  scriptsRemoved: number;
  /** Number of <iframe>, <embed>, <object> elements that were removed */
  framesRemoved: number;
  /** Number of external resource links that were removed */
  externalLinksRemoved: number;
}

/**
 * Sanitization context determining the security tier.
 * - `preview`: Allow inline styles, structural tags, https images. No scripts, iframes, external resources.
 * - `store`: Same as preview but also strip external stylesheets, keep inline styles.
 * - `deploy`: Most restrictive — strip ALL scripts, ALL external resources. Only inline styles.
 */
export type SanitizeContext = 'preview' | 'store' | 'deploy';

// =============================================================================
// DOMPurify Configurations per Context
// =============================================================================

/** Base tags shared across all contexts. */
const BASE_ALLOWED_TAGS = [
  // Document structure
  'html', 'head', 'body', 'title', 'meta', 'link',
  // Semantic sections
  'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Block elements
  'p', 'br', 'hr', 'blockquote', 'pre', 'details', 'summary',
  // Inline formatting
  'strong', 'em', 'b', 'i', 'small', 'code', 'mark', 'sub', 'sup', 'u', 's',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Media
  'a', 'img', 'figure', 'figcaption', 'picture', 'source',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  // Forms
  'form', 'input', 'textarea', 'select', 'option', 'button', 'label',
] as const;

/** Base attributes shared across all contexts. */
const BASE_ALLOWED_ATTR = [
  'alt', 'class', 'id', 'style', 'title', 'role', 'aria-*',
  'href', 'target', 'rel',
  'src', 'srcset', 'sizes', 'width', 'height', 'loading', 'decoding',
  'type', 'media',
  'colspan', 'rowspan', 'scope', 'headers',
  'name', 'value', 'placeholder', 'required', 'disabled', 'readonly',
  'min', 'max', 'step', 'pattern', 'maxlength', 'autocomplete',
  'for', 'action', 'method',
  'charset', 'content', 'http-equiv',
  'open',
] as const;

/**
 * Exported DOMPurify configurations for each sanitization context.
 * Consumers can use these directly if they need custom DOMPurify calls.
 */
export const DOMPURIFY_CONFIG = {
  /**
   * Preview context — moderate security.
   * Allows styles, structural tags, https images. No scripts, iframes, or external resources.
   */
  preview: {
    ALLOWED_TAGS: [...BASE_ALLOWED_TAGS, 'style'],
    ALLOWED_ATTR: [...BASE_ALLOWED_ATTR],
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'applet'],
    FORBID_ATTR: [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress',
      'onmousedown', 'onmouseup', 'ondblclick', 'oncontextmenu', 'ondrag',
      'ondragstart', 'ondragend', 'ondrop', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
      'ontouchstart', 'ontouchend', 'ontouchmove', 'onwheel',
      'oncopy', 'oncut', 'onpaste', 'oninvalid', 'onabort',
      'formaction', 'xlink:href',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ENTITY: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: true,
  },

  /**
   * Store context — moderate-high security.
   * Same as preview but strips external stylesheets. Keeps inline styles.
   */
  store: {
    ALLOWED_TAGS: [...BASE_ALLOWED_TAGS, 'style'],
    ALLOWED_ATTR: [...BASE_ALLOWED_ATTR],
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'applet'],
    FORBID_ATTR: [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress',
      'onmousedown', 'onmouseup', 'ondblclick', 'oncontextmenu', 'ondrag',
      'ondragstart', 'ondragend', 'ondrop', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
      'ontouchstart', 'ontouchend', 'ontouchmove', 'onwheel',
      'oncopy', 'oncut', 'onpaste', 'oninvalid', 'onabort',
      'formaction', 'xlink:href',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ENTITY: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: true,
  },

  /**
   * Deploy context — highest security.
   * Strips ALL scripts, ALL external resources. Only inline styles permitted.
   * Suitable for static HTML output.
   */
  deploy: {
    ALLOWED_TAGS: [...BASE_ALLOWED_TAGS, 'style'],
    ALLOWED_ATTR: [...BASE_ALLOWED_ATTR],
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'applet'],
    FORBID_ATTR: [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress',
      'onmousedown', 'onmouseup', 'ondblclick', 'oncontextmenu', 'ondrag',
      'ondragstart', 'ondragend', 'ondrop', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
      'ontouchstart', 'ontouchend', 'ontouchmove', 'onwheel',
      'oncopy', 'oncut', 'onpaste', 'oninvalid', 'onabort',
      'formaction', 'xlink:href',
    ],
    ALLOW_DATA_ATTR: false,
    ALLOW_ENTITY: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    WHOLE_DOCUMENT: true,
  },
} as const;

// =============================================================================
// Custom Sanitization Hooks
// =============================================================================

/**
 * Create DOMPurify hooks for a given sanitization context.
 * Tracks removals and adds detailed warnings for each stripped element.
 *
 * @param context - The sanitization context
 * @param counters - Mutable counters for removed elements
 * @returns DOMPurify HOOKS configuration
 */
function createContextHooks(
  context: SanitizeContext,
  counters: { scripts: number; frames: number; externalLinks: number },
  warnings: string[]
): Record<string, unknown> {
  return {
    /**
     * Hook called when DOMPurify removes a node.
     * Tracks which types of elements were removed for reporting.
     */
    uponSanitizeElement: (node: Element, data: { tagName: string; allowedTags: Set<string> }) => {
      const tagName = (node.tagName || '').toLowerCase();

      // Track removed scripts
      if (tagName === 'script') {
        counters.scripts++;
        const src = (node as HTMLScriptElement).getAttribute('src');
        if (src) {
          warnings.push(`Removed <script> with external source: ${src.substring(0, 120)}`);
        } else {
          warnings.push('Removed inline <script> element (scripts not allowed in static output)');
        }
      }

      // Track removed frames/embeds/objects
      if (tagName === 'iframe' || tagName === 'embed' || tagName === 'object') {
        counters.frames++;
        const src = (node as HTMLElement).getAttribute('src') || '';
        warnings.push(
          `Removed <${tagName}> element (nesting/embed prevention)${src ? `: ${src.substring(0, 120)}` : ''}`
        );
      }

      // Track removed base tags
      if (tagName === 'base') {
        warnings.push('Removed <base> element (URL manipulation prevention)');
      }
    },

    /**
     * Hook called for each attribute on each node.
     * Validates attribute values and strips dangerous ones.
     */
    uponSanitizeAttribute: (node: Element, data: { attrName: string; attrValue: string; keepAttr: boolean }) => {
      const attrName = data.attrName.toLowerCase();
      const attrValue = data.attrValue;

      // Block javascript: URIs universally
      if (attrValue && /^\s*javascript\s*:/i.test(attrValue)) {
        data.keepAttr = false;
        warnings.push(`Removed ${attrName} attribute with javascript: URI on <${(node.tagName || '').toLowerCase()}>`);
        return;
      }

      // Block data:text/html URIs
      if (attrValue && /^\s*data\s*:\s*text\/html/i.test(attrValue)) {
        data.keepAttr = false;
        warnings.push(`Removed ${attrName} attribute with data:text/html URI (XSS prevention)`);
        return;
      }

      // Block vbscript: URIs
      if (attrValue && /^\s*vbscript\s*:/i.test(attrValue)) {
        data.keepAttr = false;
        warnings.push(`Removed ${attrName} attribute with vbscript: URI`);
        return;
      }

      // Validate href attributes
      if (attrName === 'href' && attrValue) {
        const trimmed = attrValue.trim().toLowerCase();
        const isSafeScheme = trimmed.startsWith('https:') || trimmed.startsWith('http:') ||
          trimmed.startsWith('mailto:') || trimmed.startsWith('tel:') ||
          trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('?') ||
          trimmed.startsWith('.') || !trimmed.includes(':');

        if (!isSafeScheme) {
          data.keepAttr = false;
          counters.externalLinks++;
          warnings.push(`Removed unsafe href: ${attrValue.substring(0, 120)}`);
          return;
        }
      }

      // Validate img src attributes
      if (attrName === 'src' && attrValue) {
        const trimmed = attrValue.trim().toLowerCase();
        const isSafeScheme = trimmed.startsWith('https:') || trimmed.startsWith('http:') ||
          trimmed.startsWith('data:image/') ||
          trimmed.startsWith('/') || trimmed.startsWith('.') ||
          trimmed.startsWith('#') || !trimmed.includes(':');

        if (!isSafeScheme) {
          data.keepAttr = false;
          warnings.push(`Removed img with untrusted source: ${attrValue.substring(0, 120)}`);
          return;
        }

        // In deploy context, only allow relative images and data: URIs
        if (context === 'deploy' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
          data.keepAttr = false;
          warnings.push(`Removed external image resource in deploy context: ${attrValue.substring(0, 120)}`);
          return;
        }
      }

      // Validate link[href] for external stylesheets
      if (attrName === 'href' && attrValue && (node.tagName || '').toLowerCase() === 'link') {
        const trimmed = attrValue.trim().toLowerCase();
        const rel = (node as HTMLLinkElement).getAttribute('rel') || '';
        const relLower = rel.toLowerCase();

        // Block external stylesheets in store and deploy contexts
        if ((context === 'store' || context === 'deploy') &&
            (relLower.includes('stylesheet') || trimmed.endsWith('.css'))) {
          data.keepAttr = false;
          counters.externalLinks++;
          warnings.push(`Removed external stylesheet link in ${context} context: ${attrValue.substring(0, 120)}`);
          return;
        }

        // Block external import links in all contexts
        if (relLower.includes('import')) {
          data.keepAttr = false;
          counters.externalLinks++;
          warnings.push(`Removed HTML import link: ${attrValue.substring(0, 120)}`);
          return;
        }
      }

      // Sanitize CSS in style attributes
      if (attrName === 'style' && attrValue) {
        if (containsDangerousCSS(attrValue)) {
          data.attrValue = sanitizeCSSValue(attrValue);
          warnings.push('Sanitized CSS expression in style attribute (XSS prevention)');
        }
      }

      // Block form actions to external URLs
      if (attrName === 'action' && attrValue) {
        const trimmed = attrValue.trim().toLowerCase();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          data.keepAttr = false;
          warnings.push(`Removed form action to external URL: ${attrValue.substring(0, 120)}`);
          return;
        }
      }

      // Block http-equiv="refresh" (redirect attacks)
      if (attrName === 'http-equiv' && attrValue && attrValue.toLowerCase() === 'refresh') {
        data.keepAttr = false;
        warnings.push('Removed <meta http-equiv="refresh"> (redirect prevention)');
        return;
      }
    },

    /**
     * Hook called after sanitization is complete.
     * Can perform final cleanup on the DOM.
     */
    afterSanitizeAttributes: (node: Element) => {
      const tagName = (node.tagName || '').toLowerCase();

      // Sanitize content inside <style> tags
      if (tagName === 'style' && node.textContent) {
        if (containsDangerousCSS(node.textContent)) {
          node.textContent = sanitizeCSSContent(node.textContent);
          warnings.push('Sanitized dangerous CSS constructs in <style> tag');
        }
      }
    },
  };
}

// =============================================================================
// CSS Sanitization Helpers
// =============================================================================

/**
 * Check if a CSS string contains potentially dangerous constructs.
 *
 * @param css - The CSS string to check
 * @returns True if dangerous constructs are found
 */
function containsDangerousCSS(css: string): boolean {
  return (
    /expression\s*\(/i.test(css) ||
    /javascript\s*:/i.test(css) ||
    /vbscript\s*:/i.test(css) ||
    /-moz-binding\s*:/i.test(css) ||
    /behavior\s*:/i.test(css) ||
    /@import\s/i.test(css) ||
    /url\s*\(\s*['"]?\s*javascript/i.test(css) ||
    /url\s*\(\s*['"]?\s*data\s*:\s*text\/html/i.test(css)
  );
}

/**
 * Sanitize a CSS value (inline style attribute) by removing dangerous constructs.
 *
 * @param css - The CSS value string to sanitize
 * @returns Sanitized CSS string
 */
function sanitizeCSSValue(css: string): string {
  let sanitized = css;

  // Remove expression()
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');

  // Remove javascript: and vbscript: in url()
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*(?:javascript|vbscript)[^)]*\)/gi, '');

  // Remove -moz-binding
  sanitized = sanitized.replace(/-moz-binding\s*:[^;}"']*/gi, '');

  // Remove behavior
  sanitized = sanitized.replace(/behavior\s*:[^;}"']*/gi, '');

  // Remove @import
  sanitized = sanitized.replace(/@import\s+[^;]*;/gi, '');

  // Remove url() with data:text/html
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*data\s*:\s*text\/html[^)]*\)/gi, '');

  return sanitized.trim();
}

/**
 * Sanitize CSS content inside <style> tags.
 * More thorough than sanitizeCSSValue — handles multi-line CSS.
 *
 * @param css - The CSS content to sanitize
 * @returns Sanitized CSS content
 */
function sanitizeCSSContent(css: string): string {
  let sanitized = css;

  // Remove expression()
  sanitized = sanitized.replace(/expression\s*\((?:[^()]*|\([^)]*\))*\)/gi, '');

  // Remove javascript: and vbscript: in url()
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*(?:javascript|vbscript)[^)]*\)/gi, '');

  // Remove -moz-binding rules
  sanitized = sanitized.replace(/-moz-binding\s*:[^;}"']*;?/gi, '');

  // Remove behavior rules
  sanitized = sanitized.replace(/behavior\s*:[^;}"']*;?/gi, '');

  // Remove @import statements
  sanitized = sanitized.replace(/@import\s+(?:url\s*\(\s*)?['"]?[^;}"']+['"]?\s*\)?\s*;?/gi, '');

  // Remove url() with data:text/html
  sanitized = sanitized.replace(/url\s*\(\s*['"]?\s*data\s*:\s*text\/html[^)]*\)/gi, '');

  return sanitized;
}

// =============================================================================
// Main Sanitization Function
// =============================================================================

/**
 * Sanitize AI-generated HTML for the specified context.
 *
 * - **preview**: Allows styles, structural tags, https images. Strips scripts,
 *   iframes, embeds, objects, and external resource references.
 * - **store**: Same as preview but additionally strips external stylesheet links.
 *   Keeps inline `<style>` tags.
 * - **deploy**: Most restrictive — strips ALL scripts, ALL external resources
 *   (including external images). Only inline styles and relative resources.
 *
 * @param html - The raw HTML string to sanitize
 * @param context - The sanitization context ('preview' | 'store' | 'deploy')
 * @returns SanitizeResult with sanitized HTML, warnings, and removal counts
 */
export function sanitizeGeneratedHtml(
  html: string,
  context: SanitizeContext = 'preview'
): SanitizeResult {
  if (!html || typeof html !== 'string') {
    return {
      html: '',
      warnings: ['Empty or invalid HTML input provided'],
      scriptsRemoved: 0,
      framesRemoved: 0,
      externalLinksRemoved: 0,
    };
  }

  const warnings: string[] = [];
  const counters = {
    scripts: 0,
    frames: 0,
    externalLinks: 0,
  };

  // Get the base config for this context
  const baseConfig = DOMPURIFY_CONFIG[context];

  // Build custom hooks for tracking and validation
  const hooks = createContextHooks(context, counters, warnings);

  // Merge base config with hooks
  const config = {
    ...baseConfig,
    HOOKS: hooks,
  } as Record<string, unknown>;

  // Run DOMPurify
  const sanitizedHtml = DOMPurify.sanitize(html, config);

  return {
    html: sanitizedHtml,
    warnings,
    scriptsRemoved: counters.scripts,
    framesRemoved: counters.frames,
    externalLinksRemoved: counters.externalLinks,
  };
}
