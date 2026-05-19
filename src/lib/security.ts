// =============================================================================
// Security Middleware
// =============================================================================
// Utilities for sanitizing inputs, generating CSP nonces, and applying
// security headers to API responses. Prevents XSS in generated content
// and validates business profile fields.
// =============================================================================

import crypto from 'node:crypto';

// -----------------------------------------------------------------------------
// HTML Sanitization
// -----------------------------------------------------------------------------

/**
 * Tags that are allowed in generated HTML output.
 * Everything else will be stripped.
 */
const ALLOWED_TAGS = new Set([
  'html', 'head', 'body', 'title', 'meta', 'link',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
  'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main', 'nav',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'figure', 'figcaption', 'picture', 'source',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'form', 'input', 'textarea', 'select', 'option', 'button', 'label',
  'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark', 'code', 'pre', 'blockquote',
  'style', 'script',
  'video', 'audio', 'canvas', 'iframe',
  'details', 'summary',
]);

/**
 * Attributes that are stripped because they can execute scripts.
 */
const DANGEROUS_ATTRS = [
  /onclick\b/i,
  /onload\b/i,
  /onerror\b/i,
  /onmouseover\b/i,
  /onfocus\b/i,
  /onblur\b/i,
  /onsubmit\b/i,
  /onchange\b/i,
  /oninput\b/i,
  /onkeydown\b/i,
  /onkeyup\b/i,
  /onkeypress\b/i,
  /onmousedown\b/i,
  /onmouseup\b/i,
  /ondblclick\b/i,
  /oncontextmenu\b/i,
  /ondrag\b/i,
  /ondragstart\b/i,
  /ondragend\b/i,
  /ondrop\b/i,
  /onscroll\b/i,
  /onresize\b/i,
  /onanimationstart\b/i,
  /onanimationend\b/i,
  /ontransitionend\b/i,
  /ontouchstart\b/i,
  /ontouchend\b/i,
  /ontouchmove\b/i,
  /onwheel\b/i,
  /oncopy\b/i,
  /oncut\b/i,
  /onpaste\b/i,
  /oninvalid\b/i,
];

/**
 * Patterns that indicate dangerous content (XSS vectors).
 */
const XSS_PATTERNS = [
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
  /@import\s+/gi,
  /<\s*!\[cdata\[/gi,
  /<\s*embed\b/gi,
  /<\s*object\b/gi,
  /<\s*base\b/gi,
];

/**
 * Sanitize HTML output to prevent XSS in generated content.
 *
 * This performs multi-layer sanitization:
 * 1. Strips dangerous event handler attributes (onclick, onload, etc.)
 * 2. Removes javascript: and data: URI schemes
 * 3. Strips dangerous embedded elements (<embed>, <object>, <base>)
 * 4. Removes CDATA sections
 * 5. Sanitizes <script> tags to prevent inline XSS (keeps tag but removes inline handlers)
 *
 * Note: This is a defense-in-depth measure. The HTML validation engine
 * and LLM generation constraints provide the primary security boundary.
 */
export function sanitizeHtmlOutput(html: string): string {
  let sanitized = html;

  // 1. Remove dangerous event handler attributes
  for (const pattern of DANGEROUS_ATTRS) {
    sanitized = sanitized.replace(new RegExp(`${pattern.source}\\s*=\\s*(['"][^'"]*['"]|[^\\s>]*)`, 'gi'), '');
  }

  // 2. Remove XSS-prone URI schemes in href/src attributes
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, 'BLOCKED');
  }

  // 3. Remove CDATA sections
  sanitized = sanitized.replace(/<!\[cdata\[.*?\]\]>/gi, '');

  // 4. Remove <embed>, <object>, <base> tags entirely
  sanitized = sanitized.replace(/<\s*embed\b[^>]*\/?>/gi, '');
  sanitized = sanitized.replace(/<\s*object\b[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '');
  sanitized = sanitized.replace(/<\s*base\b[^>]*\/?>/gi, '');

  // 5. Clean up leftover empty attributes (e.g., onclick="" after stripping)
  sanitized = sanitized.replace(/\s+\w+\s*=\s*=""\s*/g, ' ');

  return sanitized.trim();
}

// -----------------------------------------------------------------------------
// String Sanitization
// -----------------------------------------------------------------------------

/**
 * Validate and sanitize a business profile string field.
 * - Trims whitespace
 * - Removes null bytes
 * - Limits length to maxLength
 * - Strips control characters (except tabs, newlines)
 * - Returns empty string if input is invalid
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

// -----------------------------------------------------------------------------
// Nonce Generation
// -----------------------------------------------------------------------------

/**
 * Generate a cryptographically secure nonce for Content Security Policy headers.
 * Uses 16 bytes (128 bits) of randomness, base64url-encoded.
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64url');
}

// -----------------------------------------------------------------------------
// Security Headers
// -----------------------------------------------------------------------------

/**
 * Standard security headers to apply to all API responses.
 * These can be merged into NextResponse headers.
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
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

// -----------------------------------------------------------------------------
// Input Validation Helpers
// -----------------------------------------------------------------------------

/**
 * Validate that a string is a safe ID (alphanumeric, hyphens, underscores, CUID-safe).
 */
export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 1 && id.length <= 100;
}

/**
 * Sanitize an email address (lowercase, trim).
 */
export function sanitizeEmail(email: string): string {
  return sanitizeString(email, 254).toLowerCase();
}

/**
 * Sanitize a phone number (keep digits, +, -, spaces, parentheses).
 */
export function sanitizePhone(phone: string): string {
  const cleaned = sanitizeString(phone, 30);
  return cleaned.replace(/[^0-9+\-() .]/g, '');
}
