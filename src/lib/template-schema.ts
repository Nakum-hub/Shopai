// =============================================================================
// StoreCraft AI — Template Schema Validation Engine (Zod-based)
// =============================================================================
import { z } from 'zod';
import type { BusinessCategory, BrandStyle } from '@/lib/types';

// =============================================================================
// Constants
// =============================================================================

const APPROVED_FONT_FAMILIES = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway',
  'Nunito', 'Playfair Display', 'Merriweather', 'Oswald', 'DM Sans', 'Space Grotesk',
  'Lora', 'Cormorant Garamond', 'Fredoka', 'Rajdhani', 'SF Pro Display', 'Noto Serif JP',
  'Roboto Condensed', 'DM Serif Display', 'Libre Baskerville', 'Source Sans 3',
  'Work Sans', 'Plus Jakarta Sans', 'Outfit', 'Sora', 'Manrope', 'Fira Code',
  'JetBrains Mono', 'IBMPlexSans', 'IBMPlexSerif', 'Crimson Pro', 'Bitter',
  'Josefin Sans', 'Quicksand', 'Karla', 'Mulish', 'Inconsolata', 'Fira Sans',
  'Ubuntu', 'PT Sans', 'PT Serif', 'EB Garamond', 'Cabin', 'Bebas Neue',
  'Anton', 'Lobster', 'Pacifico', 'Dancing Script', 'Satisfy', 'Permanent Marker',
  'Righteous', 'Bungee', 'Press Start 2P', 'Shadows Into Light', 'Amatic SC',
  'Great Vibes', 'Courgette', 'Cookie', 'Caveat', 'Patua One', 'Abril Fatface',
  'Architects Daughter', 'Comfortaa', 'Exo 2', 'Signika', 'Catamaran', 'Titillium Web',
  'Varela Round', 'Barlow', 'Rubik', 'Arimo', 'Tinos', 'Noto Sans', 'Cairo',
];

const MOOD_VOCABULARY = [
  'warm', 'cool', 'elegant', 'modern', 'classic', 'minimal', 'bold', 'playful',
  'sophisticated', 'luxurious', 'rustic', 'refined', 'energetic', 'serene', 'fresh',
  'powerful', 'creative', 'professional', 'friendly', 'feminine', 'masculine',
  'chic', 'natural', 'nostalgic', 'premium', 'industrial', 'intense', 'fun',
  'innovative', 'trendy', 'futuristic',
];

const SECTION_TYPES = [
  'hero', 'about', 'products', 'services', 'testimonials', 'contact',
  'gallery', 'hours', 'map', 'footer', 'cta', 'team', 'faq', 'features',
  'pricing', 'events',
] as const;

const CATEGORY_SECTION_REQUIREMENTS: Record<BusinessCategory, string[]> = {
  restaurant: ['hours', 'products'],
  bakery: ['products', 'gallery'],
  salon: ['services'],
  clothing: ['products'],
  electronics: ['products'],
  grocery: ['products'],
  hardware: ['products', 'services'],
  medical: ['services', 'team'],
  boutique: ['products', 'gallery'],
  service: ['services', 'contact'],
  other: ['contact'],
};

const CATEGORY_RECOMMENDED: Record<BusinessCategory, string[]> = {
  restaurant: ['hero', 'about', 'products', 'testimonials', 'hours', 'gallery', 'contact'],
  bakery: ['hero', 'about', 'products', 'gallery', 'testimonials', 'contact'],
  salon: ['hero', 'about', 'services', 'team', 'gallery', 'testimonials', 'pricing', 'contact'],
  clothing: ['hero', 'about', 'products', 'gallery', 'testimonials', 'contact'],
  electronics: ['hero', 'about', 'products', 'features', 'testimonials', 'contact'],
  grocery: ['hero', 'about', 'products', 'features', 'contact'],
  hardware: ['hero', 'about', 'products', 'services', 'features', 'contact'],
  medical: ['hero', 'about', 'services', 'team', 'testimonials', 'faq', 'contact'],
  boutique: ['hero', 'about', 'products', 'gallery', 'testimonials', 'cta', 'contact'],
  service: ['hero', 'about', 'services', 'features', 'testimonials', 'faq', 'contact'],
  other: ['hero', 'about', 'products', 'testimonials', 'contact'],
};

// =============================================================================
// Zod Schemas
// =============================================================================

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid 6-digit hex color');

const themeSchema = z.enum(['modern', 'classic', 'minimal', 'bold', 'elegant']);

const brandStyleSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  fontFamily: z.string().max(100),
  theme: themeSchema,
  mood: z.string().max(200),
});

const sectionTypeSchema = z.enum(SECTION_TYPES);

const sectionSchema = z.object({
  id: z.string().min(1),
  type: sectionTypeSchema,
  title: z.string().max(200),
  content: z.string().max(5000),
  order: z.number().int().min(0).max(20),
  visible: z.boolean(),
  config: z.record(z.string(), z.unknown()).default({}),
});

const templateIdSchema = z.string().regex(/^tpl-[a-z]+-\d+$/, 'ID must follow pattern: tpl-{category}-{number}');

const templateNameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be under 100 characters')
  .regex(/^[a-zA-Z0-9\s&'./-]+$/, 'Name contains invalid characters');

const templateDescriptionSchema = z.string()
  .min(20, 'Description must be at least 20 characters')
  .max(500, 'Description must be under 500 characters');

const previewUrlSchema = z.string()
  .regex(/^\/templates\/[a-z0-9-]+\.(jpg|jpeg|png|webp|svg)$/i, 'Preview must be /templates/{name}.{ext}');

const businessCategorySchema = z.enum([
  'bakery', 'restaurant', 'clothing', 'electronics', 'salon',
  'grocery', 'hardware', 'medical', 'boutique', 'service', 'other',
]);

const fullTemplateSchema = z.object({
  id: templateIdSchema,
  name: templateNameSchema,
  description: templateDescriptionSchema,
  category: businessCategorySchema,
  preview: previewUrlSchema,
  sections: z.array(sectionSchema).min(1).max(12),
  style: brandStyleSchema,
  popular: z.boolean(),
  featured: z.boolean(),
  downloadCount: z.number().int().min(0),
});

// =============================================================================
// Helper Functions
// =============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 1;
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// =============================================================================
// Validation Result Types
// =============================================================================

interface SchemaValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field?: string;
}

interface SchemaValidationReport {
  valid: boolean;
  score: number;
  issues: SchemaValidationIssue[];
  sectionAnalysis: {
    total: number;
    types: Record<string, number>;
    hasHero: boolean;
    hasContact: boolean;
    hasFooter: boolean;
    orderCorrect: boolean;
    issues: SchemaValidationIssue[];
  };
  styleAnalysis: {
    contrastRatio: number;
    contrastPass: boolean;
    fontFamilyApproved: boolean;
    moodApproved: boolean;
    themeValid: boolean;
  };
  categoryAnalysis: {
    category: string;
    requiredSections: string[];
    missingRequired: string[];
    recommendedSections: string[];
    missingRecommended: string[];
  };
}

// =============================================================================
// Template Schema Validator
// =============================================================================

class TemplateSchemaValidator {
  // ─── Full Template Validation ───────────────────────────────────────────

  validateTemplate(template: unknown): SchemaValidationReport {
    const issues: SchemaValidationIssue[] = [];
    let score = 100;

    // Zod structural validation
    const zodResult = fullTemplateSchema.safeParse(template);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        issues.push({
          severity: 'error',
          category: 'schema',
          message: issue.message,
          field: issue.path.join('.'),
        });
        score -= 8;
      }
      return {
        valid: false,
        score: Math.max(0, score),
        issues,
        sectionAnalysis: this.analyzeSections([], ''),
        styleAnalysis: { contrastRatio: 0, contrastPass: false, fontFamilyApproved: false, moodApproved: false, themeValid: false },
        categoryAnalysis: { category: '', requiredSections: [], missingRequired: [], recommendedSections: [], missingRecommended: [] },
      };
    }

    const data = zodResult.data;

    // Section composition analysis
    const sectionAnalysis = this.analyzeSections(data.sections, data.category);
    issues.push(...sectionAnalysis.issues);
    score -= sectionAnalysis.issues.filter(i => i.severity === 'error').length * 5;
    score -= sectionAnalysis.issues.filter(i => i.severity === 'warning').length * 2;

    // Style analysis
    const styleAnalysis = this.analyzeStyle(data.style);
    issues.push(...styleAnalysis.issues);
    score -= styleAnalysis.issues.filter(i => i.severity === 'error').length * 5;
    score -= styleAnalysis.issues.filter(i => i.severity === 'warning').length * 2;

    // Category analysis
    const categoryAnalysis = this.analyzeCategory(data.category, data.sections);
    issues.push(...categoryAnalysis.issues);
    score -= categoryAnalysis.issues.filter(i => i.severity === 'warning').length * 2;

    return {
      valid: score >= 70,
      score: Math.max(0, Math.min(100, score)),
      issues,
      sectionAnalysis,
      styleAnalysis,
      categoryAnalysis,
    };
  }

  validateSection(section: unknown, type?: string): { valid: boolean; issues: SchemaValidationIssue[] } {
    const issues: SchemaValidationIssue[] = [];
    const result = sectionSchema.safeParse(section);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({ severity: 'error', category: 'schema', message: issue.message, field: issue.path.join('.') });
      }
      return { valid: false, issues };
    }

    if (type && result.data.type !== type) {
      issues.push({ severity: 'error', category: 'schema', message: `Section type mismatch: expected ${type}, got ${result.data.type}` });
    }

    return { valid: issues.length === 0, issues };
  }

  validateStyle(style: unknown): SchemaValidationReport['styleAnalysis'] {
    const issues: SchemaValidationIssue[] = [];
    const result = brandStyleSchema.safeParse(style);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({ severity: 'error', category: 'style', message: issue.message });
      }
      return { contrastRatio: 0, contrastPass: false, fontFamilyApproved: false, moodApproved: false, themeValid: false };
    }
    return this.analyzeStyle(result.data);
  }

  validateSectionsComposition(sections: { type: string; order: number }[]): SchemaValidationIssue[] {
    const issues: SchemaValidationIssue[] = [];
    if (sections.length === 0) {
      issues.push({ severity: 'error', category: 'composition', message: 'Template must have at least 1 section' });
      return issues;
    }
    if (sections.length > 12) {
      issues.push({ severity: 'warning', category: 'composition', message: `Template has ${sections.length} sections (max 12 recommended)` });
    }

    const types = sections.map(s => s.type);
    const heroCount = types.filter(t => t === 'hero').length;
    const contactCount = types.filter(t => t === 'contact').length;
    const footerCount = types.filter(t => t === 'footer').length;

    if (heroCount === 0) {
      issues.push({ severity: 'error', category: 'composition', message: 'Template must have exactly 1 hero section' });
    } else if (heroCount > 1) {
      issues.push({ severity: 'error', category: 'composition', message: `Template has ${heroCount} hero sections (must be exactly 1)` });
    }

    if (contactCount > 1) {
      issues.push({ severity: 'warning', category: 'composition', message: `Template has ${contactCount} contact sections (recommended: max 1)` });
    }
    if (footerCount > 1) {
      issues.push({ severity: 'warning', category: 'composition', message: `Template has ${footerCount} footer sections (recommended: max 1)` });
    }

    // Check hero is first
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    if (sorted.length > 0 && sorted[0].type !== 'hero') {
      issues.push({ severity: 'warning', category: 'composition', message: 'Hero section should be the first section' });
    }

    // Check for duplicate types (allow products x2, gallery x2)
    const typeCounts = types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {} as Record<string, number>);
    const allowedDuplicates = new Set(['products', 'gallery', 'features', 'testimonials', 'events']);
    for (const [type, count] of Object.entries(typeCounts)) {
      if (count > 1 && !allowedDuplicates.has(type)) {
        issues.push({ severity: 'warning', category: 'composition', message: `Duplicate section type "${type}" (${count} instances)` });
      }
    }

    return issues;
  }

  validateCategoryConsistency(template: { category: string; sections: { type: string }[] }): SchemaValidationIssue[] {
    return this.analyzeCategory(template.category as BusinessCategory, template.sections as any[]).issues;
  }

  getValidationReport(template: unknown): SchemaValidationReport {
    return this.validateTemplate(template);
  }

  // ─── Private Analysis Methods ──────────────────────────────────────────

  private analyzeSections(sections: { type: string; order: number }[], category: string): SchemaValidationReport['sectionAnalysis'] {
    const issues: SchemaValidationIssue[] = [];
    const types = sections.map(s => s.type);
    const typeCounts: Record<string, number> = {};
    for (const t of types) { typeCounts[t] = (typeCounts[t] || 0) + 1; }

    const hasHero = types.includes('hero');
    const hasContact = types.includes('contact');
    const hasFooter = types.includes('footer');

    // Check ordering
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const expectedOrder = ['hero', 'about', 'products', 'services', 'features', 'testimonials', 'gallery', 'pricing', 'hours', 'team', 'faq', 'events', 'cta', 'map', 'contact', 'footer'];
    let orderCorrect = true;
    for (let i = 1; i < sorted.length; i++) {
      const prevIdx = expectedOrder.indexOf(sorted[i - 1].type);
      const currIdx = expectedOrder.indexOf(sorted[i].type);
      if (prevIdx > currIdx && prevIdx !== -1 && currIdx !== -1) {
        orderCorrect = false;
        break;
      }
    }
    if (!orderCorrect) {
      issues.push({ severity: 'info', category: 'sections', message: 'Sections are not in canonical order' });
    }

    if (!hasHero) {
      issues.push({ severity: 'error', category: 'sections', message: 'Missing hero section (required)' });
    }
    if (!hasContact) {
      issues.push({ severity: 'warning', category: 'sections', message: 'Missing contact section (recommended)' });
    }

    return {
      total: sections.length,
      types: typeCounts,
      hasHero,
      hasContact,
      hasFooter,
      orderCorrect,
      issues,
    };
  }

  private analyzeStyle(style: BrandStyle): SchemaValidationReport['styleAnalysis'] & { issues: SchemaValidationIssue[] } {
    const issues: SchemaValidationIssue[] = [];

    const cr = contrastRatio(style.primaryColor, style.secondaryColor);
    const contrastPass = cr >= 3.0;
    if (!contrastPass) {
      issues.push({ severity: 'warning', category: 'style', message: `Primary/secondary contrast ratio ${cr.toFixed(2)}:1 (recommended: >= 3:1)` });
    }

    const fontFamilyApproved = APPROVED_FONT_FAMILIES.some(f => style.fontFamily.toLowerCase().includes(f.toLowerCase()));
    if (!fontFamilyApproved) {
      issues.push({ severity: 'info', category: 'style', message: `Font "${style.fontFamily}" not in approved list (non-blocking)` });
    }

    const moodApproved = MOOD_VOCABULARY.includes(style.mood.toLowerCase());
    if (!moodApproved) {
      issues.push({ severity: 'info', category: 'style', message: `Mood "${style.mood}" not in recommended vocabulary` });
    }

    return {
      contrastRatio: Math.round(cr * 100) / 100,
      contrastPass,
      fontFamilyApproved,
      moodApproved,
      themeValid: ['modern', 'classic', 'minimal', 'bold', 'elegant'].includes(style.theme),
      issues,
    };
  }

  private analyzeCategory(category: BusinessCategory, sections: { type: string }[]): SchemaValidationReport['categoryAnalysis'] & { issues: SchemaValidationIssue[] } {
    const issues: SchemaValidationIssue[] = [];
    const sectionTypes = sections.map(s => s.type);
    const required = CATEGORY_SECTION_REQUIREMENTS[category] || [];
    const recommended = CATEGORY_RECOMMENDED[category] || [];
    const missingRequired = required.filter(r => !sectionTypes.includes(r));
    const missingRecommended = recommended.filter(r => !sectionTypes.includes(r));

    for (const missing of missingRequired) {
      issues.push({ severity: 'error', category: 'category', message: `${category} templates should include "${missing}" section` });
    }
    for (const missing of missingRecommended) {
      issues.push({ severity: 'info', category: 'category', message: `${category} templates recommend "${missing}" section` });
    }

    return { category, requiredSections: required, missingRequired, recommendedSections: recommended, missingRecommended, issues };
  }
}

export const templateSchemaValidator = new TemplateSchemaValidator();
export type { SchemaValidationReport, SchemaValidationIssue };
export {
  fullTemplateSchema, sectionSchema, brandStyleSchema, templateIdSchema,
  templateNameSchema, templateDescriptionSchema, previewUrlSchema,
  businessCategorySchema, SECTION_TYPES, MOOD_VOCABULARY, APPROVED_FONT_FAMILIES,
  CATEGORY_SECTION_REQUIREMENTS, CATEGORY_RECOMMENDED,
};
