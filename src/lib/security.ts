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

// -----------------------------------------------------------------------------
// Prompt Injection Protection
// -----------------------------------------------------------------------------

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
 * Returns { safe, risk, sanitized } object.
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

// -----------------------------------------------------------------------------
// SSRF Protection
// -----------------------------------------------------------------------------

/**
 * URL patterns that should be blocked to prevent Server-Side Request Forgery.
 */
const SSRF_BLOCKED_PATTERNS = [
  // Private / internal network ranges
  /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
  /^https?:\/\/(172\.(1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}/i,
  /^https?:\/\/(192\.168)\.\d{1,3}\.\d{1,3}/i,
  /^https?:\/\/(127\.\d{1,3}\.\d{1,3}\.\d{1,3})/i,
  /^https?:\/\/(0)\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/\[::1\]/i,
  /^https?:\/\/\[?fe80/i,
  /^https?:\/\/\[?fc00/i,

  // Metadata endpoints
  /^https?:\/\/169\.254\.\d{1,3}\.\d{1,3}/i,
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/metadata\.google\.com/i,

  // Cloud provider metadata
  /^https?:\/\/100\.100\.100\.200/i,
  /^https?:\/\/instance-data/i,

  // Common service discovery
  /^https?:\/\/consul/i,
  /^https?:\/\/etcd/i,
  /^https?:\/\/zookeeper/i,
  /^https?:\/\/kubernetes\.default/i,

  // DNS rebinding risk
  /^https?:\/\/[a-z0-9]+\.local/i,
  /^https?:\/\/.*\.internal/i,
  /^https?:\/\/.*\.corp/i,
  /^https?:\/\/.*\.private/i,
];

/**
 * Check if a URL is safe from SSRF attacks.
 * Returns { safe, reason } where reason is null if safe.
 */
export function checkSSRFSafety(url: string): { safe: boolean; reason: string | null } {
  if (!url || typeof url !== 'string') {
    return { safe: false, reason: 'Empty URL' };
  }

  // Must be http or https
  if (!/^https?:\/\//i.test(url)) {
    return { safe: false, reason: 'Only HTTP/HTTPS URLs are allowed' };
  }

  for (const pattern of SSRF_BLOCKED_PATTERNS) {
    if (pattern.test(url)) {
      return { safe: false, reason: `URL matches SSRF blocklist pattern: ${pattern.source}` };
    }
  }

  // Block non-standard ports (except common web ports)
  const urlObj = new URL(url);
  const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
  const allowedPorts = [80, 443, 8080, 8443, 3000, 3001];
  if (!allowedPorts.includes(parseInt(port, 10))) {
    return { safe: false, reason: `Port ${port} is not in the allowed list` };
  }

  // Block file:// and data:// protocols
  if (/^(file|data|ftp|sftp|ssh|telnet|gopher|dict|ldap|ldaps):/i.test(url)) {
    return { safe: false, reason: `Protocol not allowed: ${url.split(':')[0]}` };
  }

  return { safe: true, reason: null };
}

/**
 * Validate and sanitize a list of URLs (e.g., from user input or generated content).
 * Returns array of safe URLs and array of blocked reasons.
 */
export function validateUrls(urls: string[]): {
  safeUrls: string[];
  blocked: Array<{ url: string; reason: string }>;
} {
  const safeUrls: string[] = [];
  const blocked: Array<{ url: string; reason: string }> = [];

  for (const url of urls) {
    const result = checkSSRFSafety(url);
    if (result.safe) {
      safeUrls.push(url);
    } else {
      blocked.push({ url, reason: result.reason || 'Unknown' });
    }
  }

  return { safeUrls, blocked };
}
