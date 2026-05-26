

// =============================================================================
// StoreCraft AI — Core Security Infrastructure
// =============================================================================
// Production-grade security module providing HTML sanitization (DOMPurify),
// SSRF protection with DNS resolution, Content Security Policy generation,
// prompt injection detection, and input validation utilities.
// =============================================================================

import crypto from 'node:crypto';
import dns from 'node:dns';
import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';

// =============================================================================
// Security Configuration
// =============================================================================

/**
 * Centralized security configuration constants.
 * Adjust these values to tune security boundaries across the application.
 */
export const SECURITY_CONFIG = {
  /** Maximum allowed size for generated HTML output (500 KB) */
  MAX_HTML_SIZE: 500_000,

  /** Maximum allowed length for general text inputs */
  MAX_INPUT_LENGTH: 5_000,

  /** Maximum allowed size for business profile payloads */
  MAX_BUSINESS_PROFILE_SIZE: 10_000,

  /** Maximum number of retries for website generation jobs */
  MAX_GENERATION_RETRIES: 3,

  /** DNS cache TTL in milliseconds (5 minutes) */
  DNS_CACHE_TTL_MS: 300_000,

  /** Allowed ports for outbound HTTP requests (SSRF protection) */
  ALLOWED_PORTS: [80, 443, 8080, 8443, 3000, 3001] as const,

  /** Blocked IP ranges for SSRF protection (CIDR notation) */
  BLOCKED_IP_RANGES: [
    // IPv4 private ranges (RFC 1918)
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    // Loopback
    '127.0.0.0/8',
    '0.0.0.0/8',
    // Link-local
    '169.254.0.0/16',
    // IPv6 loopback and link-local
    '::1/128',
    'fe80::/10',
    'fc00::/7',
    // Cloud metadata endpoints
    '100.100.100.200/32',
  ] as const,

  /** Blocked hostname patterns for SSRF protection */
  BLOCKED_HOSTNAME_PATTERNS: [
    /^localhost$/i,
    /^metadata\.google\.internal$/i,
    /^metadata\.google\.com$/i,
    /^instance-data$/i,
    /^consul$/i,
    /^etcd$/i,
    /^zookeeper$/i,
    /^kubernetes\.default$/i,
    /\.local$/i,
    /\.internal$/i,
    /\.corp$/i,
    /\.private$/i,
  ] as const,
} as const;

// =============================================================================
// DOMPurify Configuration
// =============================================================================

/** Strict allow-list of HTML tags permitted in sanitized output. */
const DOMPURIFY_ALLOWED_TAGS = [
  // Structural
  'html', 'head', 'body', 'title', 'meta', 'link',
  // Sections
  'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Block
  'p', 'br', 'hr', 'blockquote', 'pre', 'details', 'summary',
  // Inline
  'strong', 'em', 'b', 'i', 'small', 'code', 'mark', 'sub', 'sup', 'u', 's',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Links & media
  'a', 'img', 'figure', 'figcaption', 'picture', 'source',
  // Tables
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  // Forms (restricted — no external actions)
  'form', 'input', 'textarea', 'select', 'option', 'button', 'label',
] as const;

/** Allowed attributes mapped per tag (undefined = allowed on all tags). */
const DOMPURIFY_ALLOWED_ATTR = [
  // Global
  'alt', 'class', 'id', 'style', 'title', 'role', 'aria-*',
  // Link
  'href', 'target', 'rel',
  // Image
  'src', 'srcset', 'sizes', 'width', 'height', 'loading', 'decoding',
  // Media
  'type', 'media', 'controls',
  // Table
  'colspan', 'rowspan', 'scope', 'headers',
  // Form
  'name', 'value', 'placeholder', 'required', 'disabled', 'readonly',
  'type', 'min', 'max', 'step', 'pattern', 'maxlength', 'autocomplete',
  'for', 'action', 'method',
  // Meta
  'charset', 'content', 'http-equiv', 'name',
  // Details
  'open',
] as const;

/** Allowed URI schemes for href attributes. */
const HREF_ALLOWED_SCHEMES = ['https:', 'http:', 'mailto:', 'tel:', ''] as const;

/** Allowed URI schemes for img src attributes. */
const IMG_SRC_ALLOWED_SCHEMES = ['https:', 'http:', 'data:image/', ''] as const;

// =============================================================================
// HTML Sanitization (DOMPurify-based)
// =============================================================================

/**
 * Build the DOMPurify configuration with strict allow-list policies.
 *
 * @param options - Optional configuration overrides
 * @returns DOMPurify configuration object
 */
function buildDOMPurifyConfig(options?: { allowStyles?: boolean }): Record<string, unknown> {
  const allowedTags: string[] = [...DOMPURIFY_ALLOWED_TAGS];

  // Optionally include <style> tags for generated website contexts
  if (options?.allowStyles) {
    if (!allowedTags.includes('style')) {
      allowedTags.push('style');
    }
  }

  return {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [...DOMPURIFY_ALLOWED_ATTR],

    // Block dangerous elements entirely
    FORBID_TAGS: ['script', 'iframe', 'embed', 'object', 'base', 'applet'],

    // Block all event handlers and dangerous attributes
    FORBID_ATTR: [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur',
      'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress',
      'onmousedown', 'onmouseup', 'ondblclick', 'oncontextmenu', 'ondrag',
      'ondragstart', 'ondragend', 'ondrop', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
      'ontouchstart', 'ontouchend', 'ontouchmove', 'onwheel',
      'oncopy', 'oncut', 'onpaste', 'oninvalid', 'onabort',
      'onbeforeunload', 'oncanplay', 'oncanplaythrough', 'ondurationchange',
      'onemptied', 'onended', 'onformdata', 'ongotpointercapture',
      'onlostpointercapture', 'onmouseenter', 'onmouseleave', 'onmousemove',
      'onmouseout', 'onpointerdown', 'onpointermove', 'onpointerup',
      'onplay', 'onplaying', 'onprogress', 'onratechange', 'onreset',
      'onsearch', 'onseeked', 'onseeking', 'onselect', 'onstalled',
      'onsuspend', 'ontimeupdate', 'ontoggle', 'onvolumechange', 'onwaiting',
      'onwheel', 'onauxclick',
      'formaction', 'xlink:href', 'data',
    ],

    // Only allow specific URI schemes
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

    // Keep HTML entities
    ALLOW_ENTITY: true,

    // Custom hooks for additional validation
    HOOKS: {
      uponSanitizeAttribute: (node: Element, data: { attrName: string; attrValue: string; keepAttr: boolean }) => {
        const attrName = data.attrName.toLowerCase();
        const attrValue = data.attrValue;

        // Block javascript: URIs universally
        if (attrValue && /^\s*javascript\s*:/i.test(attrValue)) {
          data.keepAttr = false;
          return;
        }

        // Block data:text/html URIs
        if (attrValue && /^\s*data\s*:\s*text\/html/i.test(attrValue)) {
          data.keepAttr = false;
          return;
        }

        // Validate href attributes
        if (attrName === 'href' && attrValue) {
          const trimmed = attrValue.trim().toLowerCase();
          const isAllowedScheme = HREF_ALLOWED_SCHEMES.some(
            (scheme) => trimmed.startsWith(scheme)
          );
          // Also allow relative URLs (no colon, or starting with # or /)
          const isRelative = !trimmed.includes(':') || trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('?');
          if (!isAllowedScheme && !isRelative) {
            data.keepAttr = false;
            return;
          }
        }

        // Validate img src attributes
        if (attrName === 'src' && attrValue) {
          const trimmed = attrValue.trim().toLowerCase();
          const isAllowedScheme = IMG_SRC_ALLOWED_SCHEMES.some(
            (scheme) => trimmed.startsWith(scheme)
          );
          const isRelative = !trimmed.includes(':') || trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('?');
          if (!isAllowedScheme && !isRelative) {
            data.keepAttr = false;
            return;
          }
        }

        // Strip form actions pointing to external URLs
        if (attrName === 'action' && attrValue) {
          const trimmed = attrValue.trim().toLowerCase();
          if (trimmed.startsWith('http') || /^\s*javascript\s*:/i.test(trimmed)) {
            data.keepAttr = false;
            return;
          }
        }
      },
    },

    // Allow data attributes (for frameworks) but not data-text/html
    ALLOW_DATA_ATTR: false,

    // Return DOM as string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    WHOLE_DOCUMENT: true,
  } as Record<string, unknown>;
}

/**
 * Sanitize HTML output using DOMPurify with strict allow-list configuration.
 * Blocks all scripts, iframes, embeds, objects, base tags, event handlers,
 * javascript: URIs, and data:text/html payloads.
 *
 * @param html - The raw HTML string to sanitize
 * @param options - Optional settings (allowStyles enables `<style>` tags)
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtmlOutput(html: string, options?: { allowStyles?: boolean }): string {
  if (!html || typeof html !== 'string') return '';
  if (html.length > SECURITY_CONFIG.MAX_HTML_SIZE) {
    return '<!-- HTML truncated: exceeds maximum allowed size -->';
  }

  const config = buildDOMPurifyConfig(options);
  return DOMPurify.sanitize(html, config);
}

/**
 * Extract all URLs from href and src attributes in an HTML string.
 * Returns an array of URLs for SSRF safety checking.
 *
 * @param html - The HTML string to scan
 * @returns Array of URL strings found in href and src attributes
 */
export function extractUrlsFromHtml(html: string): string[] {
  if (!html || typeof html !== 'string') return [];

  const urls: string[] = [];

  // Match href="..." and href='...' and href=... patterns
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1].trim();
    if (url && !url.startsWith('#') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      urls.push(url);
    }
  }

  // Match src="..." and src='...' patterns
  const srcRegex = /src\s*=\s*["']([^"']+)["']/gi;
  while ((match = srcRegex.exec(html)) !== null) {
    const url = match[1].trim();
    // Skip data: URIs and relative paths for SSRF checking
    if (url && !url.startsWith('data:') && (url.startsWith('http://') || url.startsWith('https://'))) {
      urls.push(url);
    }
  }

  // Match srcset attribute values (multiple URLs)
  const srcsetRegex = /srcset\s*=\s*["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const srcsetValue = match[1].trim();
    const parts = srcsetValue.split(/\s*,\s*/);
    for (const part of parts) {
      const url = part.split(/\s+/)[0]; // URL is before the descriptor
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        urls.push(url);
      }
    }
  }

  return urls;
}

// =============================================================================
// Content Security Policy
// =============================================================================

/**
 * Generate Content Security Policy headers.
 * When a nonce is provided, 'unsafe-inline' and 'unsafe-eval' are removed
 * in favor of nonce-based script execution. Without a nonce, they are
 * included with a warning comment in dev environments.
 *
 * @param nonce - Optional cryptographic nonce for script-src
 * @returns Record of CSP-related header names and values
 */
export function createContentSecurityPolicy(nonce?: string): Record<string, string> {
  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' https:`
    // WARNING: 'unsafe-inline' and 'unsafe-eval' are used because no nonce was provided.
    // This is less secure. Pass a nonce for production deployments.
    : `'self' 'unsafe-inline' 'unsafe-eval' https:`;

  const styleSrc = nonce
    ? `'self' 'nonce-${nonce}' https:`
    : `'self' 'unsafe-inline' https:`;

  return {
    'Content-Security-Policy': [
      `default-src 'self'`,
      `script-src ${scriptSrc}`,
      `style-src ${styleSrc}`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data: https:`,
      `connect-src 'self' ws: wss: https:`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `object-src 'none'`,
    ].join('; '),
  };
}

// =============================================================================
// SSRF Protection with DNS Resolution
// =============================================================================

/**
 * Simple DNS cache to avoid repeated lookups for the same hostname.
 * Entries expire after DNS_CACHE_TTL_MS milliseconds.
 */
const dnsCache = new Map<string, { timestamp: number; isPrivate: boolean }>();

/**
 * Check if an IPv4 address falls within a private/internal range.
 * Supports CIDR notation for range matching.
 *
 * @param ip - The IP address to check
 * @returns True if the IP is private or internal
 */
function isPrivateIP(ip: string): boolean {
  // Parse numeric IP value
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Invalid IP — treat as unsafe
  }
  const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];

  // Check against CIDR ranges
  const ranges: Array<{ start: number; end: number }> = [
    // 10.0.0.0/8
    { start: 0x0A000000, end: 0x0AFFFFFF },
    // 172.16.0.0/12
    { start: 0xAC100000, end: 0xAC1FFFFF },
    // 192.168.0.0/16
    { start: 0xC0A80000, end: 0xC0A8FFFF },
    // 127.0.0.0/8
    { start: 0x7F000000, end: 0x7FFFFFFF },
    // 0.0.0.0/8
    { start: 0x00000000, end: 0x000000FF },
    // 169.254.0.0/16 (link-local)
    { start: 0xA9FE0000, end: 0xA9FEFFFF },
    // 100.100.100.200/32 (cloud metadata)
    { start: 0x646464C8, end: 0x646464C8 },
  ];

  return ranges.some((range) => ipNum >= range.start && ipNum <= range.end);
}

/**
 * Check if an IPv6 address is private/internal.
 *
 * @param ip - The IPv6 address to check
 * @returns True if the IPv6 address is private or internal
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === '::1' || normalized === '::') return true;
  // Link-local fe80::/10
  if (normalized.startsWith('fe80:')) return true;
  // Unique local fc00::/7
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // IPv4-mapped IPv6 ::ffff:0.0.0.0/96
  if (normalized.startsWith('::ffff:')) return true;
  return false;
}

/**
 * Validate a URL's safety against SSRF attacks.
 *
 * This performs two-layer validation:
 * 1. Pattern matching against blocked hostnames and non-HTTP protocols
 * 2. DNS resolution to verify the resolved IP is not a private/internal address
 *
 * DNS results are cached with a TTL to avoid repeated lookups.
 * DNS resolution happens AFTER pattern validation to mitigate DNS rebinding.
 *
 * @param url - The URL to validate
 * @returns Object with `safe` boolean and optional `reason` string
 */
export async function checkSSRFSafety(
  url: string
): Promise<{ safe: boolean; reason: string | null }> {
  if (!url || typeof url !== 'string') {
    return { safe: false, reason: 'Empty URL' };
  }

  // Layer 1: Pattern validation
  // Must be http or https
  if (!/^https?:\/\//i.test(url)) {
    return { safe: false, reason: 'Only HTTP/HTTPS URLs are allowed' };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  const hostname = urlObj.hostname;

  // Check blocked hostname patterns
  for (const pattern of SECURITY_CONFIG.BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, reason: `Hostname matches blocked pattern: ${pattern.source}` };
    }
  }

  // Block raw IP addresses in URL that are private
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isPrivateIP(hostname)) {
      return { safe: false, reason: 'URL contains a private IP address' };
    }
  }

  // Block IPv6 addresses in URL that are private
  if (hostname.includes(':')) {
    if (isPrivateIPv6(hostname)) {
      return { safe: false, reason: 'URL contains a private IPv6 address' };
    }
  }

  // Block non-standard ports
  const port = parseInt(urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'), 10);
  if (!SECURITY_CONFIG.ALLOWED_PORTS.includes(port as (typeof SECURITY_CONFIG.ALLOWED_PORTS)[number])) {
    return { safe: false, reason: `Port ${port} is not in the allowed list` };
  }

  // Layer 2: DNS resolution (mitigates DNS rebinding)
  // Check cache first
  const cached = dnsCache.get(hostname);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < SECURITY_CONFIG.DNS_CACHE_TTL_MS) {
      if (cached.isPrivate) {
        return { safe: false, reason: 'Resolved IP address is private/internal (cached)' };
      }
      return { safe: true, reason: null };
    }
    // Cache expired — remove and re-resolve
    dnsCache.delete(hostname);
  }

  // Resolve DNS
  try {
    const addresses = await dns.promises.resolve4(hostname);

    for (const ip of addresses) {
      if (isPrivateIP(ip)) {
        dnsCache.set(hostname, { timestamp: Date.now(), isPrivate: true });
        return { safe: false, reason: `DNS resolves to private IP: ${ip}` };
      }
    }

    // Also check IPv6 addresses
    try {
      const ipv6Addresses = await dns.promises.resolve6(hostname);
      for (const ip of ipv6Addresses) {
        if (isPrivateIPv6(ip)) {
          dnsCache.set(hostname, { timestamp: Date.now(), isPrivate: true });
          return { safe: false, reason: `DNS resolves to private IPv6: ${ip}` };
        }
      }
    } catch {
      // No IPv6 records — that's fine
    }

    dnsCache.set(hostname, { timestamp: Date.now(), isPrivate: false });
    return { safe: true, reason: null };
  } catch (err) {
    // DNS resolution failed — could be a blocked/restricted domain
    const message = err instanceof Error ? err.message : 'Unknown DNS error';
    return { safe: false, reason: `DNS resolution failed: ${message}` };
  }
}

/**
 * Validate and sanitize a list of URLs for SSRF safety.
 * Returns arrays of safe URLs and blocked URLs with reasons.
 *
 * @param urls - Array of URL strings to validate
 * @returns Object containing safe URLs and blocked URLs with reasons
 */
export async function validateUrls(
  urls: string[]
): Promise<{ safeUrls: string[]; blocked: Array<{ url: string; reason: string }> }> {
  const safeUrls: string[] = [];
  const blocked: Array<{ url: string; reason: string }> = [];

  // Resolve all checks in parallel
  const results = await Promise.all(urls.map(async (url) => {
    const result = await checkSSRFSafety(url);
    return { url, ...result };
  }));

  for (const { url, safe, reason } of results) {
    if (safe) {
      safeUrls.push(url);
    } else {
      blocked.push({ url, reason: reason || 'Unknown' });
    }
  }

  return { safeUrls, blocked };
}

// =============================================================================
// String Sanitization
// =============================================================================

/**
 * Validate and sanitize a business profile string field.
 * - Trims whitespace
 * - Removes null bytes
 * - Limits length to maxLength
 * - Strips control characters (except tabs, newlines)
 * - Returns empty string if input is invalid
 *
 * @param input - The raw input string
 * @param maxLength - Maximum allowed length (0 = unlimited)
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number): string {
  if (typeof input !== 'string') return '';

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Strip control characters (keep \t, \n, \r)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Collapse multiple spaces/newlines
  sanitized = sanitized.replace(/ {2,}/g, ' ');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Enforce max length
  if (maxLength > 0 && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// =============================================================================
// Nonce Generation
// =============================================================================

/**
 * Generate a cryptographically secure nonce for Content Security Policy headers.
 * Uses 16 bytes (128 bits) of randomness, base64url-encoded.
 *
 * @returns Base64url-encoded nonce string
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64url');
}

// =============================================================================
// Security Headers
// =============================================================================

/**
 * Standard security headers to apply to all API responses.
 * These can be merged into NextResponse headers.
 *
 * @returns Record of security header names and values
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: wss: https:;",
  };
}

/**
 * Apply security headers to a NextResponse object.
 * Convenience wrapper around getSecurityHeaders().
 *
 * @param response - The NextResponse object to apply headers to
 * @returns The same response with security headers applied
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

// =============================================================================
// Input Validation Helpers
// =============================================================================

/**
 * Validate that a string is a safe ID (alphanumeric, hyphens, underscores, CUID-safe).
 *
 * @param id - The ID string to validate
 * @returns True if the ID is valid
 */
export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 1 && id.length <= 100;
}

/**
 * Sanitize an email address (lowercase, trim).
 *
 * @param email - The email address to sanitize
 * @returns Sanitized email string
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email, 254).toLowerCase();
}

/**
 * Sanitize a phone number (keep digits, +, -, spaces, parentheses).
 *
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone string
 */
export function sanitizePhone(phone: string): string {
  const cleaned = sanitizeString(phone, 30);
  return cleaned.replace(/[^0-9+\-() .]/g, '');
}

// =============================================================================
// Prompt Injection Protection
// =============================================================================

/**
 * Patterns commonly used in prompt injection attacks against LLM integrations.
 * These are checked in user-facing text inputs that will be sent to the AI.
 */
const PROMPT_INJECTION_PATTERNS = [
  // Direct override attempts
  /\bignore\s+(previous|all|above|everything)\b/gi,
  /\bforget\s+(everything|all|previous|your instructions)\b/gi,
  /\bnew\s+instructions?\b/gi,
  /\bdisregard\s+(previous|all|above|your)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bpretend\s+(you\s+are|to\s+be|that)\b/gi,
  /\bact\s+as\s+(if|a|an)\b/gi,
  /\broleplay\s+as\b/gi,
  /\bfrom\s+now\s+on\b/gi,
  /\bsystem\s*:\s*/gi,

  // Context extraction
  /\breveal\s+(your|the|hidden|secret)\b/gi,
  /\bshow\s+(me\s+)?your\b/gi,
  /\bwhat\s+(are\s+)?your\s+(instructions?|rules?|prompts?|system)\b/gi,
  /\bprint\s+(your|the|all)\b/gi,
  /\boutput\s+(your|the|all)\b/gi,
  /\bdump\s+(your|the|all)\b/gi,

  // Instruction manipulation
  /\btranslate\s+(this|the|your|following)\b/gi,
  /\brepeat\s+(this|the|your|following)\b/gi,
  /\bconvert\s+(this|the|your)\b/gi,
  /\bsummarize\s+(this|the|your)\b/gi,

  // Delimiter injection
  /```[^`]*system[^`]*```/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,

  // Encoding tricks
  /base64/gi,
  /unicode\s+escape/gi,
  /html\s*entity/gi,

  // Chain-of-thought manipulation
  /\bthink\s+step\s+by\s+step\b/gi,
  /\bchain\s+of\s+thought\b/gi,
];

/**
 * Score a text input for prompt injection risk.
 * Returns a risk score from 0 (safe) to 1 (very likely injection).
 *
 * @param text - The text to analyze
 * @returns Risk score between 0 and 1
 */
export function calculatePromptInjectionRisk(text: string): number {
  if (!text || typeof text !== 'string') return 0;

  let matches = 0;
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      matches++;
    }
  }

  // Normalize: 3+ matches = high risk
  if (matches >= 3) return 1.0;
  if (matches === 2) return 0.7;
  if (matches === 1) return 0.3;
  return 0;
}

/**
 * Sanitize text before sending to LLM to reduce prompt injection risk.
 * Strips known injection patterns while preserving legitimate business content.
 *
 * @param text - The text to sanitize
 * @returns Sanitized text safe for LLM processing
 */
export function sanitizeForLLM(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Remove instruction override attempts
  sanitized = sanitized.replace(/\bignore\s+(previous|all|above|everything)\b[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\bforget\s+(everything|all|previous|your instructions)\b[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\bnew\s+instructions?\s*[::].*/gi, '');
  sanitized = sanitized.replace(/\bdisregard\s+(previous|all|above|your)\b[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\byou\s+are\s+now\s+\w+[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\bpretend\s+(you\s+are|to\s+be|that)\s+\w+[^.!?]*/gi, '');

  // Remove system prompt extraction attempts
  sanitized = sanitized.replace(/\breveal\s+(your|the|hidden|secret)\s+\w+[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\bshow\s+(me\s+)?your\s+\w+[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\bprint\s+(your|the|all)\s*\w*[^.!?]*/gi, '');
  sanitized = sanitized.replace(/\boutput\s+(your|the|all)\s*\w*[^.!?]*/gi, '');

  // Remove delimiter injection
  sanitized = sanitized.replace(/```[^`]*system[^`]*```/g, '');
  sanitized = sanitized.replace(/<\|im_start\|>[\s\S]*?<\|im_end\|>/g, '');
  sanitized = sanitized.replace(/\[INST\][\s\S]*?\[\/INST\]/g, '');

  // Remove repetitive commands that might be injection chains
  sanitized = sanitized.replace(/(?:ignore|forget|disregard|reveal|show|print|output)(?:\s+\w+){3,}/gi, '');

  return sanitized.trim();
}

/**
 * Validate that user input is safe for LLM processing.
 * Returns an object with safety status, risk score, sanitized text, and warnings.
 *
 * @param text - The input text to validate
 * @returns Validation result with safe flag, risk score, sanitized text, and warnings
 */
export function validateForLLM(text: string): {
  safe: boolean;
  risk: number;
  sanitized: string;
  warnings: string[];
} {
  const risk = calculatePromptInjectionRisk(text);
  const sanitized = sanitizeForLLM(text);
  const warnings: string[] = [];

  if (risk >= 1.0) {
    warnings.push('Input contains strong indicators of prompt injection attempt');
  } else if (risk >= 0.7) {
    warnings.push('Input may contain prompt injection patterns — sanitized for safety');
  } else if (risk >= 0.3) {
    warnings.push('Minor injection risk detected — text was cleaned');
  }

  return {
    safe: risk < 0.7,
    risk,
    sanitized,
    warnings,
  };
}
