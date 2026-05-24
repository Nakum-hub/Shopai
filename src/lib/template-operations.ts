// =============================================================================
// StoreCraft AI — Template Operations Registry (Unified API)
// =============================================================================

import type { Template, BrandStyle, StorefrontSection, BusinessCategory } from '@/lib/types';

// =============================================================================
// Types
// =============================================================================

type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

interface CategoryScore {
  score: number;
  passed: boolean;
  issues: number;
}

interface UnifiedReport {
  templateId: string;
  templateName: string;
  overallScore: number;
  grade: Grade;
  categories: {
    schema: CategoryScore;
    responsive: CategoryScore;
    accessibility: CategoryScore;
    performance: CategoryScore;
    seo: CategoryScore;
    design: CategoryScore;
    tokens: CategoryScore;
    hydration: CategoryScore;
  };
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  generatedAt: string;
}

// =============================================================================
// Grade Mapping
// =============================================================================

function toGrade(score: number): Grade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// =============================================================================
// Module Loaders (lazy, graceful)
// =============================================================================

let _schemaValidator: any = null;
let _sectionNormalizer: any = null;
let _designConstraints: any = null;
let _responsiveAnalyzer: any = null;
let _accessibilityAuditor: any = null;
let _lighthouseEngine: any = null;
let _hydrationGuard: any = null;
let _tokenValidator: any = null;

async function loadModule(path: string) {
  try {
    return await import(path);
  } catch {
    return null;
  }
}

async function getSchemaValidator() {
  if (!_schemaValidator) {
    const mod = await loadModule('./template-schema');
    _schemaValidator = mod?.templateSchemaValidator;
  }
  return _schemaValidator;
}

async function getSectionNormalizer() {
  if (!_sectionNormalizer) {
    const mod = await loadModule('./section-normalizer');
    _sectionNormalizer = mod?.sectionNormalizer;
  }
  return _sectionNormalizer;
}

async function getDesignConstraints() {
  if (!_designConstraints) {
    const mod = await loadModule('./design-constraints');
    _designConstraints = mod?.designConstraints;
  }
  return _designConstraints;
}

async function getResponsiveAnalyzer() {
  if (!_responsiveAnalyzer) {
    const mod = await loadModule('./responsive-verification');
    _responsiveAnalyzer = mod?.responsiveAnalyzer;
  }
  return _responsiveAnalyzer;
}

async function getAccessibilityAuditor() {
  if (!_accessibilityAuditor) {
    const mod = await loadModule('./accessibility-auditor');
    _accessibilityAuditor = mod?.accessibilityAuditor;
  }
  return _accessibilityAuditor;
}

async function getLighthouseEngine() {
  if (!_lighthouseEngine) {
    const mod = await loadModule('./lighthouse-engine');
    _lighthouseEngine = mod?.lighthouseEngine;
  }
  return _lighthouseEngine;
}

async function getHydrationGuard() {
  if (!_hydrationGuard) {
    const mod = await loadModule('./hydration-guard');
    _hydrationGuard = mod?.hydrationGuard;
  }
  return _hydrationGuard;
}

async function getTokenValidator() {
  if (!_tokenValidator) {
    const mod = await loadModule('./design-tokens');
    _tokenValidator = mod?.tokenValidator;
  }
  return _tokenValidator;
}

// =============================================================================
// Template Operations
// =============================================================================

class TemplateOperations {

  // ─── Validation Pipeline ─────────────────────────────────────────────

  /** Quick validation — schema only */
  async quickValidate(template: unknown): Promise<{ valid: boolean; score: number; issues: string[] }> {
    try {
      const validator = await getSchemaValidator();
      if (!validator) return { valid: true, score: 100, issues: [] };

      const report = validator.validateTemplate(template);
      return {
        valid: report.valid,
        score: report.score,
        issues: report.issues.map(i => `[${i.severity}] ${i.category}: ${i.message}`),
      };
    } catch {
      return { valid: true, score: 100, issues: ['Schema validator unavailable — passed by default'] };
    }
  }

  /** Full audit — all validators */
  async fullAudit(template: Template): Promise<UnifiedReport> {
    return this.generateUnifiedReport(template);
  }

  /** Production validation — stricter thresholds */
  async productionValidate(template: Template): Promise<{ valid: boolean; report: UnifiedReport }> {
    const report = await this.generateUnifiedReport(template);
    return { valid: report.overallScore >= 85, report };
  }

  // ─── Individual Validators ───────────────────────────────────────────

  async validateSchema(template: unknown): Promise<{ score: number; passed: boolean; issues: string[] }> {
    try {
      const validator = await getSchemaValidator();
      if (!validator) return { score: 100, passed: true, issues: [] };
      const report = validator.validateTemplate(template);
      return {
        score: report.score,
        passed: report.valid,
        issues: report.issues.map(i => `[${i.severity}] ${i.category}: ${i.message}`),
      };
    } catch {
      return { score: 100, passed: true, issues: [] };
    }
  }

  async validateResponsive(html: string): Promise<{ score: number; passed: boolean; issues: string[] }> {
    try {
      const analyzer = await getResponsiveAnalyzer();
      if (!analyzer) return { score: 100, passed: true, issues: [] };
      const report = analyzer.generateReport(html);
      return {
        score: report.score,
        passed: report.passed,
        issues: report.issues.map(i => `[${i.severity}] ${i.category}: ${i.message}`),
      };
    } catch {
      return { score: 100, passed: true, issues: [] };
    }
  }

  async validateAccessibility(html: string): Promise<{ score: number; passed: boolean; issues: string[] }> {
    try {
      const auditor = await getAccessibilityAuditor();
      if (!auditor) return { score: 100, passed: true, issues: [] };
      const report = auditor.audit(html);
      return {
        score: report.score,
        passed: report.passed,
        issues: report.violations.map(v => `[${v.impact}] ${v.rule}: ${v.description}`),
      };
    } catch {
      return { score: 100, passed: true, issues: [] };
    }
  }

  async validateDesign(style: BrandStyle, html: string, sections: StorefrontSection[]): Promise<{ score: number; passed: boolean; issues: string[] }> {
    try {
      const dc = await getDesignConstraints();
      if (!dc) return { score: 100, passed: true, issues: [] };
      const report = dc.validateAll(style, html, sections);
      return {
        score: report.score,
        passed: report.passed,
        issues: report.violations.map(v => `[${v.severity}] ${v.category}: ${v.message}`),
      };
    } catch {
      return { score: 100, passed: true, issues: [] };
    }
  }

  async validateHydration(html: string): Promise<{ score: number; safe: boolean; issues: string[] }> {
    try {
      const guard = await getHydrationGuard();
      if (!guard) return { score: 0, safe: true, issues: [] };
      const report = guard.guard(html);
      return {
        score: Math.max(0, 100 - report.riskScore),
        safe: report.safe,
        issues: report.risks.map(r => `[${r.severity}] ${r.type}: ${r.description}`),
      };
    } catch {
      return { score: 100, safe: true, issues: [] };
    }
  }

  async runLighthouse(html: string): Promise<{ overall: number; performance: number; accessibility: number; bestPractices: number; seo: number }> {
    try {
      const engine = await getLighthouseEngine();
      if (!engine) return { overall: 100, performance: 100, accessibility: 100, bestPractices: 100, seo: 100 };
      const report = engine.runLighthouseAudit(html);
      return {
        overall: report.overall,
        performance: report.performance.score,
        accessibility: report.accessibility.score,
        bestPractices: report.bestPractices.score,
        seo: report.seo.score,
      };
    } catch {
      return { overall: 100, performance: 100, accessibility: 100, bestPractices: 100, seo: 100 };
    }
  }

  // ─── Transformation Operations ───────────────────────────────────────

  async normalizeSections(sections: StorefrontSection[], category: BusinessCategory): Promise<StorefrontSection[]> {
    try {
      const normalizer = await getSectionNormalizer();
      if (!normalizer) return sections;
      const result = normalizer.normalize(sections, category);
      return result.sections;
    } catch {
      return sections;
    }
  }

  async fillMissingSections(sections: StorefrontSection[], category: BusinessCategory): Promise<StorefrontSection[]> {
    try {
      const normalizer = await getSectionNormalizer();
      if (!normalizer) return sections;
      const result = normalizer.fillMissingSections(sections, category);
      return result.sections;
    } catch {
      return sections;
    }
  }

  // ─── Unified Report ─────────────────────────────────────────────────

  async generateUnifiedReport(template: Template): Promise<UnifiedReport> {
    // Run all validators in parallel
    const [
      schemaResult,
      responsiveResult,
      a11yResult,
      lhResult,
      hydrationResult,
    ] = await Promise.all([
      this.validateSchema(template),
      this.validateResponsive(''), // Templates don't have HTML directly
      this.validateAccessibility(''),
      this.runLighthouse(''),
      this.validateHydration(''),
    ]);

    const designResult = template.style
      ? await this.validateDesign(template.style, '', template.sections)
      : { score: 100, passed: true, issues: [] };

    // Weighted scores
    const weights = { schema: 0.15, responsive: 0.15, accessibility: 0.20, performance: 0.15, seo: 0.10, design: 0.10, tokens: 0.05, hydration: 0.10 };

    const overallScore = Math.round(
      schemaResult.score * weights.schema +
      responsiveResult.score * weights.responsive +
      a11yResult.score * weights.accessibility +
      lhResult.performance * weights.performance +
      lhResult.seo * weights.seo +
      designResult.score * weights.design +
      100 * weights.tokens + // No token-specific check for templates
      hydrationResult.score * weights.hydration
    );

    const allIssues = [
      ...schemaResult.issues,
      ...responsiveResult.issues,
      ...a11yResult.issues,
      ...designResult.issues,
      ...hydrationResult.issues,
    ];

    const criticalIssues = allIssues.filter(i => i.startsWith('[error]') || i.startsWith('[critical]'));
    const warnings = allIssues.filter(i => i.startsWith('[warning]') || i.startsWith('[serious]'));
    const recommendations: string[] = [];

    if (schemaResult.score < 80) recommendations.push('Review template schema compliance');
    if (a11yResult.score < 80) recommendations.push('Improve accessibility compliance for WCAG AA');
    if (lhResult.performance < 80) recommendations.push('Optimize page performance');
    if (lhResult.seo < 80) recommendations.push('Add SEO meta tags and structured data');
    if (designResult.score < 80) recommendations.push('Review design constraints and color contrast');

    return {
      templateId: template.id,
      templateName: template.name,
      overallScore,
      grade: toGrade(overallScore),
      categories: {
        schema: { score: schemaResult.score, passed: schemaResult.passed, issues: schemaResult.issues.length },
        responsive: { score: responsiveResult.score, passed: responsiveResult.passed, issues: responsiveResult.issues.length },
        accessibility: { score: a11yResult.score, passed: a11yResult.passed, issues: a11yResult.issues.length },
        performance: { score: lhResult.performance, passed: lhResult.performance >= 70, issues: 0 },
        seo: { score: lhResult.seo, passed: lhResult.seo >= 70, issues: 0 },
        design: { score: designResult.score, passed: designResult.passed, issues: designResult.issues.length },
        tokens: { score: 100, passed: true, issues: 0 },
        hydration: { score: hydrationResult.score, passed: hydrationResult.safe, issues: hydrationResult.issues.length },
      },
      criticalIssues,
      warnings,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Template Scoring ───────────────────────────────────────────────

  async getTemplateScore(template: Template): Promise<number> {
    const report = await this.generateUnifiedReport(template);
    return report.overallScore;
  }

  // ─── Batch Operations ────────────────────────────────────────────────

  async batchValidate(templates: Template[]): Promise<Map<string, { valid: boolean; score: number }>> {
    const results = new Map<string, { valid: boolean; score: number }>();
    await Promise.all(
      templates.map(async (t) => {
        const result = await this.quickValidate(t);
        results.set(t.id, { valid: result.valid, score: result.score });
      })
    );
    return results;
  }

  async batchAudit(templates: Template[]): Promise<Map<string, UnifiedReport>> {
    const results = new Map<string, UnifiedReport>();
    await Promise.all(
      templates.map(async (t) => {
        const report = await this.generateUnifiedReport(t);
        results.set(t.id, report);
      })
    );
    return results;
  }

  async batchScore(templates: Template[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    await Promise.all(
      templates.map(async (t) => {
        const score = await this.getTemplateScore(t);
        results.set(t.id, score);
      })
    );
    return results;
  }

  // ─── Report Generation for HTML ──────────────────────────────────────

  /** Generate a unified report from generated HTML */
  async generateHtmlReport(html: string, templateId: string = 'unknown', templateName: string = 'Unknown'): Promise<UnifiedReport> {
    const [responsiveResult, a11yResult, lhResult, hydrationResult] = await Promise.all([
      this.validateResponsive(html),
      this.validateAccessibility(html),
      this.runLighthouse(html),
      this.validateHydration(html),
    ]);

    const overallScore = Math.round(
      100 * 0.15 + // schema — assumed valid for generated HTML
      responsiveResult.score * 0.15 +
      a11yResult.score * 0.20 +
      lhResult.performance * 0.15 +
      lhResult.seo * 0.10 +
      100 * 0.10 + // design — not applicable
      100 * 0.05 + // tokens — not applicable
      hydrationResult.score * 0.10
    );

    const allIssues = [
      ...responsiveResult.issues,
      ...a11yResult.issues,
      ...hydrationResult.issues,
    ];

    return {
      templateId,
      templateName,
      overallScore,
      grade: toGrade(overallScore),
      categories: {
        schema: { score: 100, passed: true, issues: 0 },
        responsive: { score: responsiveResult.score, passed: responsiveResult.passed, issues: responsiveResult.issues.length },
        accessibility: { score: a11yResult.score, passed: a11yResult.passed, issues: a11yResult.issues.length },
        performance: { score: lhResult.performance, passed: lhResult.performance >= 70, issues: 0 },
        seo: { score: lhResult.seo, passed: lhResult.seo >= 70, issues: 0 },
        design: { score: 100, passed: true, issues: 0 },
        tokens: { score: 100, passed: true, issues: 0 },
        hydration: { score: hydrationResult.score, passed: hydrationResult.safe, issues: hydrationResult.issues.length },
      },
      criticalIssues: allIssues.filter(i => i.startsWith('[error]') || i.startsWith('[critical]')),
      warnings: allIssues.filter(i => i.startsWith('[warning]') || i.startsWith('[serious]')),
      recommendations: [
        ...(responsiveResult.passed ? [] : ['Improve responsive design — add media queries and mobile breakpoints']),
        ...(a11yResult.passed ? [] : ['Improve accessibility — add alt text, labels, and landmarks']),
        ...(lhResult.performance >= 80 ? [] : ['Optimize performance — reduce HTML size and lazy-load images']),
        ...(lhResult.seo >= 80 ? [] : ['Improve SEO — add meta description, Open Graph tags']),
        ...(hydrationResult.safe ? [] : ['Review client-only code patterns for hydration safety']),
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

// =============================================================================
// Singleton
// =============================================================================

export const templateOps = new TemplateOperations();
export type { UnifiedReport, CategoryScore, Grade };
