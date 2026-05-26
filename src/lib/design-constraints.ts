// =============================================================================
// StoreCraft AI — Design Constraints Engine
// =============================================================================
import type { BrandStyle, StorefrontSection } from '@/lib/types';

// =============================================================================
// Color Constraints
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 1;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function isValidHex(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

// =============================================================================
// Typography Constraints
// =============================================================================

const SAFE_FONT_STACKS: Record<string, string> = {
  sans: "'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  serif: "'Playfair Display', 'Merriweather', Georgia, serif",
  mono: "'Fira Code', 'JetBrains Mono', monospace",
  display: "'Space Grotesk', 'Montserrat', sans-serif",
  body: "'DM Sans', 'Open Sans', 'Lato', sans-serif",
};

const APPROVED_FONTS = new Set([
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
  'Nunito', 'Playfair Display', 'Merriweather', 'Oswald', 'DM Sans', 'Space Grotesk',
  'Lora', 'Cormorant Garamond', 'Fredoka', 'Rajdhani', 'SF Pro Display', 'Noto Serif JP',
  'Roboto Condensed', 'DM Serif Display', 'Libre Baskerville', 'Source Sans 3',
  'Work Sans', 'Plus Jakarta Sans', 'Outfit', 'Sora', 'Manrope', 'Fira Code',
  'JetBrains Mono', 'Crimson Pro', 'Bitter', 'Josefin Sans', 'Quicksand', 'Karla',
  'Ubuntu', 'PT Sans', 'PT Serif', 'EB Garamond', 'Cabin', 'Bebas Neue',
  'Lobster', 'Pacifico', 'Dancing Script', 'Comfortaa', 'Barlow', 'Rubik',
]);

const MODULAR_SCALES = [1.067, 1.125, 1.2, 1.25, 1.333, 1.414, 1.5, 1.618];

// =============================================================================
// Layout Constraints
// =============================================================================

const LAYOUT_CONSTRAINTS = {
  maxSectionDepth: 5,
  maxCtaPerSection: 3,
  maxImagePerSection: 10,
  minTouchTarget: 44,
  maxContentWidth: 1400,
  minContentWidth: 320,
  minSectionCount: 3,
  maxSectionCount: 12,
};

const STANDARD_BREAKPOINTS = [
  { name: 'sm', value: 640 },
  { name: 'md', value: 768 },
  { name: 'lg', value: 1024 },
  { name: 'xl', value: 1280 },
  { name: '2xl', value: 1536 },
];

// =============================================================================
// Content Constraints
// =============================================================================

const CONTENT_CONSTRAINTS = {
  maxHeadlineLength: 80,
  maxDescriptionLength: 500,
  maxTitleLength: 100,
  maxContentPerSection: 5000,
  maxProductNameLength: 200,
  maxPhoneLength: 30,
  maxEmailLength: 254,
  maxUrlLength: 2048,
};

// =============================================================================
// Validation Result Types
// =============================================================================

interface ConstraintViolation {
  severity: 'error' | 'warning' | 'info';
  category: string;
  rule: string;
  message: string;
  suggestion?: string;
}

interface ContrastResult {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  passLargeAA: boolean;
}

interface ConstraintsReport {
  score: number;
  passed: boolean;
  violations: ConstraintViolation[];
  colorAnalysis: ContrastResult | null;
  typographyAnalysis: { fontFamilyValid: boolean; lineHeightsValid: boolean } | null;
  layoutAnalysis: { maxDepthOk: boolean; touchTargetsOk: boolean; widthsOk: boolean } | null;
  contentAnalysis: { headlinesOk: boolean; descriptionsOk: boolean; totalSectionsOk: boolean } | null;
}

// =============================================================================
// Design Constraints Engine
// =============================================================================

class DesignConstraintsEngine {
  // ─── Color Constraints ────────────────────────────────────────────────

  validateColorContrast(fg: string, bg: string): ContrastResult {
    if (!isValidHex(fg) || !isValidHex(bg)) {
      return { ratio: 0, passAA: false, passAAA: false, passLargeAA: false };
    }
    const ratio = contrastRatio(fg, bg);
    return {
      ratio: Math.round(ratio * 100) / 100,
      passAA: ratio >= 4.5,
      passAAA: ratio >= 7.0,
      passLargeAA: ratio >= 3.0,
    };
  }

  validateColorHarmony(colors: string[]): { harmonious: boolean; type: string; details: string } {
    const valid = colors.filter(c => isValidHex(c));
    if (valid.length < 2) return { harmonious: true, type: 'insufficient', details: 'Need at least 2 colors to check harmony' };

    const rgbs = valid.map(c => hexToRgb(c)).filter(Boolean) as { r: number; g: number; b: number }[];

    // Convert to HSL for harmony check
    const hues = rgbs.map(c => {
      const r = c.r / 255, g = c.g / 255, b = c.b / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const l = (max + min) / 2;
      if (max === min) return { h: 0, s: 0, l: l * 100 };
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h = 0;
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
      return { h, s: s * 100, l: l * 100 };
    });

    if (hues.length < 2) return { harmonious: true, type: 'monochrome', details: 'Single hue detected' };

    const hA = hues[0].h ?? 0;
    const hB = hues[1].h ?? 0;
    const hueDiff = Math.abs(hA - hB);
    const hueDist = hueDiff > 180 ? 360 - hueDiff : hueDiff;

    let type = 'analogous';
    let harmonious = true;
    if (hueDist >= 150 && hueDist <= 210) { type = 'complementary'; harmonious = true; }
    else if (hueDist >= 90 && hueDist <= 150) { type = 'triadic-adjacent'; harmonious = true; }
    else if (hueDist >= 30 && hueDist <= 60) { type = 'analogous'; harmonious = true; }
    else if (hueDist < 15) { type = 'monochrome'; harmonious = true; }
    else if (hueDist > 60 && hueDist < 90) { type = 'split-complementary'; harmonious = true; }

    return { harmonious, type, details: `Hue difference: ${Math.round(hueDist)}° (${type})` };
  }

  getAccessibleAlternatives(color: string): { foregrounds: string[]; backgrounds: string[] } {
    if (!isValidHex(color)) return { foregrounds: [], backgrounds: [] };
    const alternatives = ['#000000', '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f', '#162447', '#1f4068', '#e8e8e8', '#f5f5f5', '#ffffff'];
    return {
      foregrounds: alternatives.filter(a => contrastRatio(color, a) >= 4.5),
      backgrounds: alternatives.filter(a => contrastRatio(a, color) >= 4.5),
    };
  }

  // ─── Typography Constraints ──────────────────────────────────────────

  validateFontStack(fontFamily: string): { valid: boolean; approved: boolean; suggestion: string } {
    const primary = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    const approved = APPROVED_FONTS.has(primary);
    return {
      valid: true,
      approved,
      suggestion: approved ? '' : `Consider using an approved font. Closest matches: ${this.findClosestFont(primary)}`,
    };
  }

  validateFontSizeScale(sizes: number[]): { valid: boolean; ratio: number | null; message: string } {
    if (sizes.length < 3) return { valid: true, ratio: null, message: 'Not enough sizes to determine scale' };
    const sorted = [...sizes].sort((a, b) => a - b);
    const ratios: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1] > 0) ratios.push(sorted[i] / sorted[i - 1]);
    }
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    const closestScale = MODULAR_SCALES.reduce((best, s) =>
      Math.abs(s - avgRatio) < Math.abs(best - avgRatio) ? s : (best as number), 1.25);
    const isClose = Math.abs(avgRatio - closestScale) / closestScale < 0.15;
    return {
      valid: isClose,
      ratio: Math.round(avgRatio * 1000) / 1000,
      message: isClose ? `Follows ~${closestScale} modular scale` : `Average ratio ${avgRatio.toFixed(3)} doesn't match standard modular scales. Closest: ${closestScale}`,
    };
  }

  validateLineHeight(fontSize: number, lineHeight: number): { valid: boolean; recommendation: string } {
    const ratio = lineHeight / fontSize;
    const isHeading = fontSize >= 20;
    const minRatio = isHeading ? 1.1 : 1.4;
    const maxRatio = isHeading ? 1.3 : 1.8;
    const valid = ratio >= minRatio && ratio <= maxRatio;
    return {
      valid,
      recommendation: valid ? '' : `${isHeading ? 'Heading' : 'Body'} line-height ratio ${ratio.toFixed(2)} should be ${minRatio}-${maxRatio}`,
    };
  }

  validateFontWeightPair(headingWeight: number, bodyWeight: number): { valid: boolean; message: string } {
    const valid = headingWeight >= bodyWeight;
    return {
      valid,
      message: valid ? '' : `Heading weight (${headingWeight}) should be >= body weight (${bodyWeight})`,
    };
  }

  private findClosestFont(input: string): string {
    const normalized = input.toLowerCase();
    for (const font of APPROVED_FONTS) {
      if (font.toLowerCase().startsWith(normalized.substring(0, 4))) return font;
    }
    return 'Inter';
  }

  // ─── Layout Constraints ──────────────────────────────────────────────

  validateLayoutRules(html: string): { maxDepthOk: boolean; touchTargetsOk: boolean; ctaCountOk: boolean; imageCountOk: boolean; issues: ConstraintViolation[] } {
    const issues: ConstraintViolation[] = [];

    // Check nesting depth
    let maxDepth = 0, currentDepth = 0;
    const openTags = (html.match(/<(div|section|article|main|aside|nav|header|footer)[\s>]/gi) || []).length;
    maxDepth = Math.max(maxDepth, openTags);
    if (openTags > LAYOUT_CONSTRAINTS.maxSectionDepth * 5) {
      issues.push({ severity: 'warning', category: 'layout', rule: 'nesting', message: `Deep HTML nesting detected (${openTags} block-level elements). Consider flattening.` });
    }

    // Check CTA count per section-like pattern
    const ctaButtons = (html.match(/<a[^>]*>(?:Get Started|Sign Up|Book Now|Order Now|Contact Us|Learn More|Call Now|Visit Us|Shop Now|Reserve|Book a Consultation)<\/a>/gi) || []).length;
    if (ctaButtons > LAYOUT_CONSTRAINTS.maxCtaPerSection * 3) {
      issues.push({ severity: 'warning', category: 'layout', rule: 'cta-count', message: `High CTA count (${ctaButtons}). Consider reducing for better conversion.` });
    }

    // Check image count
    const imgCount = (html.match(/<img[\s>]/gi) || []).length;
    if (imgCount > LAYOUT_CONSTRAINTS.maxImagePerSection) {
      issues.push({ severity: 'warning', category: 'layout', rule: 'image-count', message: `Many images (${imgCount}). Consider lazy loading and optimization.` });
    }

    // Check for overflow risks
    if (html.includes('<table') && !html.includes('overflow') && !html.includes('responsive')) {
      issues.push({ severity: 'info', category: 'layout', rule: 'table-overflow', message: 'Table without overflow handling may break on mobile' });
    }

    return {
      maxDepthOk: issues.filter(i => i.rule === 'nesting').length === 0,
      touchTargetsOk: true,
      ctaCountOk: issues.filter(i => i.rule === 'cta-count').length === 0,
      imageCountOk: issues.filter(i => i.rule === 'image-count').length === 0,
      issues,
    };
  }

  validateSpacingConsistency(spacings: number[]): { consistent: boolean; baseUnit: number | null; issues: string[] } {
    if (spacings.length < 3) return { consistent: true, baseUnit: null, issues: [] };
    const sorted = [...new Set(spacings)].sort((a, b) => a - b);
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) diffs.push(sorted[i] - sorted[i - 1]);
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const baseUnit = diffs.reduce((a, b) => a !== 0 ? gcd(a, b) : b, 0);
    const issues: string[] = [];
    const validBases = [4, 8];
    if (baseUnit > 0 && !validBases.includes(baseUnit) && baseUnit % 4 !== 0) {
      issues.push(`Base spacing unit ${baseUnit}px doesn't follow 4px/8px grid`);
    }
    return { consistent: issues.length === 0, baseUnit, issues };
  }

  validateResponsiveBreakpoints(breakpoints: number[]): { complete: boolean; missing: string[]; extra: number[] } {
    const standard = STANDARD_BREAKPOINTS.map(b => b.value);
    const missing = standard.filter(b => !breakpoints.includes(b));
    const extra = breakpoints.filter(b => !standard.includes(b));
    return {
      complete: missing.length === 0,
      missing: missing.map(v => STANDARD_BREAKPOINTS.find(b => b.value === v)?.name || `${v}px`),
      extra,
    };
  }

  // ─── Content Constraints ─────────────────────────────────────────────

  validateContentQuality(sections: StorefrontSection[]): ConstraintViolation[] {
    const issues: ConstraintViolation[] = [];

    for (const section of sections) {
      if (section.title.length > CONTENT_CONSTRAINTS.maxHeadlineLength) {
        issues.push({ severity: 'warning', category: 'content', rule: 'headline-length', message: `Section "${section.type}" title too long (${section.title.length}/${CONTENT_CONSTRAINTS.maxHeadlineLength} chars)` });
      }
      if (section.content.length > CONTENT_CONSTRAINTS.maxDescriptionLength) {
        issues.push({ severity: 'warning', category: 'content', rule: 'description-length', message: `Section "${section.type}" content too long (${section.content.length}/${CONTENT_CONSTRAINTS.maxDescriptionLength} chars)` });
      }
      if (section.content.length < 10) {
        issues.push({ severity: 'info', category: 'content', rule: 'content-empty', message: `Section "${section.type}" has very little content (${section.content.length} chars)` });
      }
    }

    return issues;
  }

  validateHeadingHierarchy(html: string): ConstraintViolation[] {
    const issues: ConstraintViolation[] = [];
    const headingPattern = /<(h[1-6])[\s>]/gi;
    const matches = [...html.matchAll(headingPattern)];
    if (matches.length === 0) {
      issues.push({ severity: 'error', category: 'content', rule: 'no-headings', message: 'No headings found in HTML' });
      return issues;
    }

    let lastLevel = 0;
    for (const match of matches) {
      const level = parseInt(match[1][1]);
      if (level > lastLevel + 1 && lastLevel > 0) {
        issues.push({ severity: 'warning', category: 'content', rule: 'heading-skip', message: `Heading level skip: h${lastLevel} → h${level}` });
      }
      if (level === 1 && lastLevel > 0) {
        issues.push({ severity: 'error', category: 'content', rule: 'multiple-h1', message: 'Multiple H1 headings detected' });
      }
      lastLevel = level;
    }

    return issues;
  }

  validateSEOContent(html: string): ConstraintViolation[] {
    const issues: ConstraintViolation[] = [];

    if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) {
      issues.push({ severity: 'error', category: 'seo', rule: 'missing-title', message: 'Missing <title> tag (critical for SEO)' });
    }
    if (!/<meta[^>]+name=["']description["']/i.test(html)) {
      issues.push({ severity: 'warning', category: 'seo', rule: 'missing-meta-desc', message: 'Missing meta description' });
    }
    if (!/<meta[^>]+name=["']keywords["']/i.test(html)) {
      issues.push({ severity: 'info', category: 'seo', rule: 'missing-keywords', message: 'Missing meta keywords' });
    }

    // Check images have alt
    const imgsWithoutAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;
    if (imgsWithoutAlt > 0) {
      issues.push({ severity: 'warning', category: 'seo', rule: 'missing-alt', message: `${imgsWithoutAlt} images missing alt text` });
    }

    return issues;
  }

  // ─── Full Design Constraints Report ──────────────────────────────────

  validateAll(style: BrandStyle, html: string, sections: StorefrontSection[]): ConstraintsReport {
    const violations: ConstraintViolation[] = [];
    let score = 100;

    // Color analysis
    const colorResult = this.validateColorContrast(style.primaryColor, style.secondaryColor);
    if (!colorResult.passLargeAA) {
      violations.push({ severity: 'error', category: 'color', rule: 'contrast', message: `Primary/secondary contrast too low: ${colorResult.ratio}:1`, suggestion: 'Use colors with at least 3:1 contrast' });
      score -= 15;
    }

    // Typography
    const fontResult = this.validateFontStack(style.fontFamily);
    if (!fontResult.approved && fontResult.suggestion) {
      violations.push({ severity: 'info', category: 'typography', rule: 'font-approval', message: fontResult.suggestion });
    }

    // Layout
    const layoutResult = this.validateLayoutRules(html);
    violations.push(...layoutResult.issues);
    score -= layoutResult.issues.filter(i => i.severity === 'warning').length * 3;

    // Content
    const contentIssues = this.validateContentQuality(sections);
    violations.push(...contentIssues);
    score -= contentIssues.filter(i => i.severity === 'warning').length * 3;

    // Headings
    const headingIssues = this.validateHeadingHierarchy(html);
    violations.push(...headingIssues);
    score -= headingIssues.filter(i => i.severity === 'error').length * 8;
    score -= headingIssues.filter(i => i.severity === 'warning').length * 3;

    // SEO
    const seoIssues = this.validateSEOContent(html);
    violations.push(...seoIssues);
    score -= seoIssues.filter(i => i.severity === 'error').length * 8;
    score -= seoIssues.filter(i => i.severity === 'warning').length * 3;

    return {
      score: Math.max(0, Math.min(100, score)),
      passed: score >= 70,
      violations,
      colorAnalysis: colorResult,
      typographyAnalysis: { fontFamilyValid: fontResult.approved, lineHeightsValid: true },
      layoutAnalysis: { maxDepthOk: layoutResult.maxDepthOk, touchTargetsOk: layoutResult.touchTargetsOk, widthsOk: true },
      contentAnalysis: { headlinesOk: contentIssues.filter(i => i.rule === 'headline-length').length === 0, descriptionsOk: contentIssues.filter(i => i.rule === 'description-length').length === 0, totalSectionsOk: sections.length >= 3 && sections.length <= 12 },
    };
  }
}

export const designConstraints = new DesignConstraintsEngine();
export type { ConstraintsReport, ConstraintViolation, ContrastResult };
export { LAYOUT_CONSTRAINTS, CONTENT_CONSTRAINTS, STANDARD_BREAKPOINTS, SAFE_FONT_STACKS, MODULAR_SCALES, APPROVED_FONTS, contrastRatio, hexToRgb, relativeLuminance, isValidHex };
