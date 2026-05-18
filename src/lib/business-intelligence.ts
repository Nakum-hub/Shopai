// =============================================================================
// Business Intelligence Engine
// =============================================================================
// Generates actionable insights and health scores for storefronts by analyzing
// storefront data, generation history, analytics, and HTML quality.
// =============================================================================

import { db } from '@/lib/db';
import { validateHtml } from '@/lib/html-validator';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface HealthScore {
  overall: number;        // 0-100
  content: number;        // quality of content
  seo: number;            // SEO score
  performance: number;    // performance score
  accessibility: number;  // a11y score
  engagement: number;     // based on analytics
  generation: number;     // generation pipeline reliability
}

export interface Insight {
  type: 'strength' | 'warning' | 'opportunity' | 'critical';
  category: string;
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
}

export interface BIReport {
  healthScore: HealthScore;
  insights: Insight[];
  recommendations: string[];
  generatedAt: string;
  summary: string;
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

/** Clamp a number between 0 and 100 */
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Parse business profile JSON safely */
function parseProfile(profileJson: string | null): Record<string, unknown> | null {
  if (!profileJson) return null;
  try {
    return JSON.parse(profileJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Check if a string field in the profile is populated */
function hasField(profile: Record<string, unknown> | null, field: string): boolean {
  if (!profile) return false;
  const val = profile[field];
  if (typeof val !== 'string') return false;
  return val.trim().length > 0;
}

// -----------------------------------------------------------------------------
// Score Calculators
// -----------------------------------------------------------------------------

/**
 * Analyze HTML quality and return individual dimension scores.
 */
function analyzeHtmlQuality(html: string | null): {
  content: number;
  seo: number;
  performance: number;
  accessibility: number;
} {
  if (!html) {
    return { content: 0, seo: 0, performance: 0, accessibility: 0 };
  }

  const result = validateHtml(html);
  const checks = result.checks;

  // Content score: based on word count, H1, H2, content depth
  const contentCheck = checks.find(c => c.name === 'Content depth');
  const h1Check = checks.find(c => c.name === 'H1 heading');
  const h2Check = checks.find(c => c.name === 'H2 headings');
  let contentScore = 20; // base
  if (contentCheck?.passed) contentScore += 30;
  else contentScore += 10;
  if (h1Check?.passed) contentScore += 30;
  if (h2Check?.passed) contentScore += 20;
  const content = clampScore(contentScore);

  // SEO score: based on title, meta description, H1, lang attribute
  const titleCheck = checks.find(c => c.name === '<title>');
  const metaDescCheck = checks.find(c => c.name === 'Meta description');
  const langCheck = checks.find(c => c.name === 'Language attribute');
  let seoScore = 20;
  if (titleCheck?.passed) seoScore += 25;
  if (metaDescCheck?.passed) seoScore += 25;
  if (h1Check?.passed) seoScore += 20;
  if (langCheck?.passed) seoScore += 10;
  const seo = clampScore(seoScore);

  // Performance score: based on external deps, modern layout
  const externalCheck = checks.find(c => c.name === 'External dependencies');
  const layoutCheck = checks.find(c => c.name === 'Modern layout');
  let perfScore = 40;
  if (!externalCheck?.detail?.includes('external')) perfScore += 30; // self-contained is good
  if (layoutCheck?.passed) perfScore += 30;
  const performance = clampScore(perfScore);

  // Accessibility score: based on alt text, lang attribute, viewport
  const altCheck = checks.find(c => c.name === 'Image alt text');
  const viewportCheck = checks.find(c => c.name === 'Viewport meta');
  let a11yScore = 25;
  if (altCheck?.passed) a11yScore += 25;
  if (langCheck?.passed) a11yScore += 25;
  if (viewportCheck?.passed) a11yScore += 25;
  const accessibility = clampScore(a11yScore);

  return { content, seo, performance, accessibility };
}

/**
 * Calculate engagement score from analytics records.
 */
function calculateEngagement(analytics: Array<{
  totalViews: number;
  uniqueVisitors: number;
  avgDuration: number;
  bounceRate: number;
}>): number {
  if (analytics.length === 0) return 30; // neutral score when no data

  const latest = analytics[analytics.length - 1];
  let score = 40; // base

  // Views bonus (more views = more engagement)
  if (latest.totalViews > 100) score += 15;
  else if (latest.totalViews > 50) score += 10;
  else if (latest.totalViews > 10) score += 5;

  // Duration bonus (avg > 60s is good)
  if (latest.avgDuration > 120) score += 20;
  else if (latest.avgDuration > 60) score += 15;
  else if (latest.avgDuration > 30) score += 10;

  // Bounce rate penalty (lower is better)
  if (latest.bounceRate < 30) score += 20;
  else if (latest.bounceRate < 50) score += 10;
  else if (latest.bounceRate > 70) score -= 15;

  // Visitor ratio (unique/total)
  if (latest.totalViews > 0) {
    const ratio = latest.uniqueVisitors / latest.totalViews;
    if (ratio > 0.6) score += 10;
  }

  return clampScore(score);
}

/**
 * Calculate generation reliability score from pipeline executions.
 */
function calculateGenerationReliability(executions: Array<{
  status: string;
  validationScore: number | null;
  durationMs: number | null;
}>): number {
  if (executions.length === 0) return 50; // neutral when no data

  const completed = executions.filter(e => e.status === 'completed');
  const failed = executions.filter(e => e.status === 'failed');
  const successRate = completed.length / executions.length;

  let score = Math.round(successRate * 60); // up to 60 points for success rate

  // Validation quality bonus
  const withScore = completed.filter(e => e.validationScore !== null);
  if (withScore.length > 0) {
    const avgScore = withScore.reduce((s, e) => s + (e.validationScore || 0), 0) / withScore.length;
    if (avgScore >= 85) score += 25;
    else if (avgScore >= 70) score += 15;
    else if (avgScore >= 50) score += 8;
  }

  // Consistency bonus: multiple successful runs
  if (completed.length >= 3) score += 10;
  else if (completed.length >= 1) score += 5;

  // Failure penalty
  if (failed.length > completed.length) score -= 15;

  return clampScore(score);
}

// -----------------------------------------------------------------------------
// Insight Generators
// -----------------------------------------------------------------------------

function generateContentInsights(
  profile: Record<string, unknown> | null,
  html: string | null,
): Insight[] {
  const insights: Insight[] = [];

  if (!html) {
    insights.push({
      type: 'critical',
      category: 'content',
      title: 'No website generated',
      description: 'No HTML content has been generated yet for this storefront.',
      action: 'Start a generation pipeline to create the initial website.',
      impact: 'high',
    });
    return insights;
  }

  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount >= 200) {
    insights.push({
      type: 'strength',
      category: 'content',
      title: 'Rich content depth',
      description: `The website contains ${wordCount} words of content, which is above average for small business sites.`,
      action: 'Consider adding a blog section to further boost SEO.',
      impact: 'medium',
    });
  } else if (wordCount < 80) {
    insights.push({
      type: 'warning',
      category: 'content',
      title: 'Thin content',
      description: `Only ${wordCount} words found. Search engines may struggle to index this page effectively.`,
      action: 'Expand product descriptions, add testimonials, and include an "About Us" section.',
      impact: 'high',
    });
  }

  // Check for products/services in profile
  const products = profile?.products;
  const services = profile?.services;
  const productCount = Array.isArray(products) ? products.length : 0;
  const serviceCount = Array.isArray(services) ? services.length : 0;

  if (productCount === 0 && serviceCount === 0) {
    insights.push({
      type: 'opportunity',
      category: 'content',
      title: 'No products or services listed',
      description: 'The business profile does not include any products or services.',
      action: 'Add products and services to improve customer understanding and SEO.',
      impact: 'high',
    });
  } else if (productCount >= 3 || serviceCount >= 3) {
    insights.push({
      type: 'strength',
      category: 'content',
      title: 'Comprehensive catalog',
      description: `${productCount} products and ${serviceCount} services listed in the profile.`,
      action: 'Keep catalog updated with seasonal items and promotions.',
      impact: 'medium',
    });
  }

  return insights;
}

function generateSeoInsights(html: string | null): Insight[] {
  const insights: Insight[] = [];

  if (!html) {
    insights.push({
      type: 'warning',
      category: 'seo',
      title: 'SEO cannot be evaluated',
      description: 'Generate a website first to receive SEO recommendations.',
      action: 'Use the generation pipeline to create an initial website.',
      impact: 'high',
    });
    return insights;
  }

  const result = validateHtml(html);

  // Title
  const titleCheck = result.checks.find(c => c.name === '<title>');
  if (!titleCheck?.passed) {
    insights.push({
      type: 'critical',
      category: 'seo',
      title: 'Missing page title',
      description: 'The page title tag is missing or empty. This is the most important SEO element.',
      action: 'Add a descriptive <title> tag with the business name and primary keyword.',
      impact: 'high',
    });
  }

  // Meta description
  const metaCheck = result.checks.find(c => c.name === 'Meta description');
  if (!metaCheck?.passed) {
    insights.push({
      type: 'warning',
      category: 'seo',
      title: 'Missing meta description',
      description: 'Search results may show a generic snippet instead of a custom description.',
      action: 'Add a <meta name="description"> tag with a compelling 150-160 character summary.',
      impact: 'medium',
    });
  }

  // H1
  const h1Check = result.checks.find(c => c.name === 'H1 heading');
  if (h1Check?.passed) {
    insights.push({
      type: 'strength',
      category: 'seo',
      title: 'Proper heading structure',
      description: 'The page has exactly one H1 heading, which is optimal for SEO.',
      action: 'Ensure the H1 contains the primary business keyword.',
      impact: 'medium',
    });
  } else if (h1Check) {
    insights.push({
      type: 'warning',
      category: 'seo',
      title: 'Heading structure issue',
      description: h1Check.detail,
      action: 'Ensure exactly one H1 heading exists on the page.',
      impact: 'medium',
    });
  }

  // Lang attribute
  const langCheck = result.checks.find(c => c.name === 'Language attribute');
  if (!langCheck?.passed) {
    insights.push({
      type: 'warning',
      category: 'seo',
      title: 'Missing language attribute',
      description: 'The <html> tag should include a lang attribute for accessibility and SEO.',
      action: 'Add lang="en" (or appropriate language) to the <html> tag.',
      impact: 'low',
    });
  }

  // If validation score is high
  if (result.score >= 85) {
    insights.push({
      type: 'strength',
      category: 'seo',
      title: 'High HTML validation score',
      description: `Validation score of ${result.score}/100 indicates well-structured markup.`,
      action: 'Maintain this quality in future regeneration.',
      impact: 'low',
    });
  }

  return insights;
}

function generateBusinessInsights(
  profile: Record<string, unknown> | null,
  storefront: { status: string; createdAt: Date; publishedAt: Date | null; deploymentStatus: string },
): Insight[] {
  const insights: Insight[] = [];

  // Status checks
  if (storefront.status === 'draft') {
    insights.push({
      type: 'opportunity',
      category: 'business',
      title: 'Storefront is still a draft',
      description: 'The storefront has not been generated or published yet.',
      action: 'Run the generation pipeline and publish when ready.',
      impact: 'high',
    });
  }

  if (storefront.status === 'ready' && !storefront.publishedAt) {
    insights.push({
      type: 'opportunity',
      category: 'business',
      title: 'Ready to publish',
      description: 'The storefront has generated content but has not been published.',
      action: 'Review the generated site and click Publish to make it live.',
      impact: 'high',
    });
  }

  if (storefront.deploymentStatus === 'deployed' && storefront.publishedAt) {
    insights.push({
      type: 'strength',
      category: 'business',
      title: 'Published and deployed',
      description: `Storefront has been live since ${storefront.publishedAt.toISOString().split('T')[0]}.`,
      action: 'Monitor analytics and update content regularly.',
      impact: 'medium',
    });
  }

  // Profile completeness
  if (profile) {
    const keyFields = ['phone', 'email', 'location', 'hours'];
    const missingFields = keyFields.filter(f => !hasField(profile, f));
    const presentFields = keyFields.filter(f => hasField(profile, f));

    if (presentFields.length === keyFields.length) {
      insights.push({
        type: 'strength',
        category: 'business',
        title: 'Complete business profile',
        description: 'Phone, email, location, and hours are all provided.',
        action: 'Keep this information up to date as the business changes.',
        impact: 'medium',
      });
    } else if (missingFields.length > 0) {
      insights.push({
        type: 'warning',
        category: 'business',
        title: 'Incomplete contact information',
        description: `Missing: ${missingFields.join(', ')}. Customers cannot reach the business easily.`,
        action: `Add ${missingFields.join(', ')} to improve customer accessibility.`,
        impact: 'high',
      });
    }
  } else {
    insights.push({
      type: 'critical',
      category: 'business',
      title: 'No business profile',
      description: 'No business profile has been extracted or configured.',
      action: 'Use the voice or chat interface to describe the business.',
      impact: 'high',
    });
  }

  // Storefront age
  const ageDays = Math.floor((Date.now() - storefront.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays > 30 && storefront.status === 'draft') {
    insights.push({
      type: 'warning',
      category: 'business',
      title: 'Stale storefront',
      description: `This storefront was created ${ageDays} days ago but is still in draft status.`,
      action: 'Either generate content or remove the draft storefront.',
      impact: 'medium',
    });
  }

  return insights;
}

function generateEngagementInsights(
  analytics: Array<{
    totalViews: number;
    uniqueVisitors: number;
    avgDuration: number;
    bounceRate: number;
  }>,
): Insight[] {
  const insights: Insight[] = [];

  if (analytics.length === 0) {
    insights.push({
      type: 'opportunity',
      category: 'engagement',
      title: 'No analytics data yet',
      description: 'Start collecting visitor data by publishing the storefront.',
      action: 'Publish the storefront and share the URL to start generating traffic.',
      impact: 'medium',
    });
    return insights;
  }

  const latest = analytics[analytics.length - 1];
  const totalViews = analytics.reduce((s, a) => s + a.totalViews, 0);

  if (totalViews > 500) {
    insights.push({
      type: 'strength',
      category: 'engagement',
      title: 'Growing traffic',
      description: `${totalViews} total views recorded across the analytics period.`,
      action: 'Leverage this traffic with CTAs and conversion optimization.',
      impact: 'medium',
    });
  }

  if (latest.bounceRate > 70) {
    insights.push({
      type: 'warning',
      category: 'engagement',
      title: 'High bounce rate',
      description: `${latest.bounceRate.toFixed(0)}% of visitors leave after viewing a single page.`,
      action: 'Improve landing page content, add clear navigation, and ensure fast load times.',
      impact: 'high',
    });
  } else if (latest.bounceRate < 35 && latest.totalViews > 10) {
    insights.push({
      type: 'strength',
      category: 'engagement',
      title: 'Low bounce rate',
      description: `${latest.bounceRate.toFixed(0)}% bounce rate indicates visitors are exploring multiple pages.`,
      action: 'Add conversion points to capitalize on engaged visitors.',
      impact: 'medium',
    });
  }

  if (latest.avgDuration > 120) {
    insights.push({
      type: 'strength',
      category: 'engagement',
      title: 'Strong engagement time',
      description: `Visitors spend an average of ${Math.floor(latest.avgDuration / 60)}m ${latest.avgDuration % 60}s on the site.`,
      action: 'This signals quality content. Consider adding lead capture forms.',
      impact: 'medium',
    });
  }

  return insights;
}

function generateGenerationInsights(
  executions: Array<{
    status: string;
    validationScore: number | null;
    durationMs: number | null;
    startedAt: Date;
  }>,
): Insight[] {
  const insights: Insight[] = [];

  if (executions.length === 0) {
    return [{
      type: 'opportunity',
      category: 'generation',
      title: 'No generation history',
      description: 'No pipelines have been executed for this storefront yet.',
      action: 'Run the generation pipeline to create the initial website.',
      impact: 'high',
    }];
  }

  const completed = executions.filter(e => e.status === 'completed');
  const failed = executions.filter(e => e.status === 'failed');
  const successRate = completed.length / executions.length;

  if (successRate >= 0.9) {
    insights.push({
      type: 'strength',
      category: 'generation',
      title: 'High pipeline reliability',
      description: `${(successRate * 100).toFixed(0)}% of generation runs completed successfully (${completed.length}/${executions.length}).`,
      action: 'The generation pipeline is performing well.',
      impact: 'medium',
    });
  } else if (successRate < 0.5) {
    insights.push({
      type: 'critical',
      category: 'generation',
      title: 'Low pipeline success rate',
      description: `Only ${(successRate * 100).toFixed(0)}% of runs succeeded. ${failed.length} runs failed.`,
      action: 'Review failed execution logs for common error patterns.',
      impact: 'high',
    });
  }

  // Average validation score
  const withScore = completed.filter(e => e.validationScore !== null);
  if (withScore.length > 0) {
    const avgScore = withScore.reduce((s, e) => s + (e.validationScore || 0), 0) / withScore.length;
    if (avgScore >= 85) {
      insights.push({
        type: 'strength',
        category: 'generation',
        title: 'High generation quality',
        description: `Average validation score of ${avgScore.toFixed(0)}/100 across ${withScore.length} runs.`,
        action: 'Quality is consistently high. Consider minor tweaks rather than full regeneration.',
        impact: 'low',
      });
    } else if (avgScore < 60) {
      insights.push({
        type: 'warning',
        category: 'generation',
        title: 'Low generation quality',
        description: `Average validation score of ${avgScore.toFixed(0)}/100. Output may need manual review.`,
        action: 'Provide more detailed business profiles for better generation results.',
        impact: 'high',
      });
    }
  }

  // Duration analysis
  const withDuration = completed.filter(e => e.durationMs !== null);
  if (withDuration.length > 0) {
    const avgDuration = withDuration.reduce((s, e) => s + (e.durationMs || 0), 0) / withDuration.length;
    if (avgDuration > 120_000) {
      insights.push({
        type: 'warning',
        category: 'generation',
        title: 'Slow generation times',
        description: `Average generation takes ${(avgDuration / 1000).toFixed(0)}s. This may indicate complex requests or API latency.`,
        action: 'Consider simplifying business profiles or using more concise descriptions.',
        impact: 'low',
      });
    }
  }

  return insights;
}

// -----------------------------------------------------------------------------
// Main Report Generator
// -----------------------------------------------------------------------------

/**
 * Generate a full BI report for a storefront.
 * Analyzes: storefront status, HTML quality, generation history, analytics,
 * profile completeness, and contact information.
 */
export async function generateBIReport(storefrontId: string): Promise<BIReport> {
  // Fetch all data in parallel
  const [storefront, analytics, executions] = await Promise.all([
    db.storefront.findUnique({
      where: { id: storefrontId },
      include: {
        analytics: {
          orderBy: { date: 'asc' },
        },
        pipelineExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
      },
    }),
    // Also get analytics separately for the engagement calc
    db.storefrontAnalytics.findMany({
      where: { storefrontId },
      orderBy: { date: 'asc' },
    }),
    db.pipelineExecution.findMany({
      where: { storefrontId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!storefront) {
    throw new Error(`Storefront not found: ${storefrontId}`);
  }

  const profile = parseProfile(storefront.businessProfile);
  const html = storefront.html;

  // --- Calculate Health Scores ---
  const htmlScores = analyzeHtmlQuality(html);
  const engagement = calculateEngagement(analytics);
  const generation = calculateGenerationReliability(executions);

  const healthScore: HealthScore = {
    content: htmlScores.content,
    seo: htmlScores.seo,
    performance: htmlScores.performance,
    accessibility: htmlScores.accessibility,
    engagement,
    generation,
    // Overall: weighted average
    overall: clampScore(
      htmlScores.content * 0.2 +
      htmlScores.seo * 0.2 +
      htmlScores.performance * 0.1 +
      htmlScores.accessibility * 0.1 +
      engagement * 0.15 +
      generation * 0.25,
    ),
  };

  // --- Generate Insights ---
  const allInsights: Insight[] = [
    ...generateContentInsights(profile, html),
    ...generateSeoInsights(html),
    ...generateBusinessInsights(profile, storefront),
    ...generateEngagementInsights(analytics),
    ...generateGenerationInsights(executions),
  ];

  // Sort: critical first, then warning, opportunity, strength
  const typeOrder: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, strength: 3 };
  allInsights.sort((a, b) => (typeOrder[a.type] ?? 4) - (typeOrder[b.type] ?? 4));

  // --- Generate Recommendations ---
  const recommendations = allInsights
    .filter(i => i.type !== 'strength')
    .map(i => i.action)
    .slice(0, 5);

  // --- Generate Summary ---
  const criticalCount = allInsights.filter(i => i.type === 'critical').length;
  const warningCount = allInsights.filter(i => i.type === 'warning').length;
  const strengthCount = allInsights.filter(i => i.type === 'strength').length;

  let summary: string;
  if (healthScore.overall >= 80) {
    summary = `This storefront is in great shape with a health score of ${healthScore.overall}/100. ` +
      `${strengthCount} strengths identified.` +
      (warningCount > 0 ? ` ${warningCount} areas for improvement found.` : '');
  } else if (healthScore.overall >= 50) {
    summary = `The storefront has a moderate health score of ${healthScore.overall}/100. ` +
      `${warningCount} warnings and ${strengthCount} strengths identified.` +
      (criticalCount > 0 ? ` ${criticalCount} critical issues need immediate attention.` : '');
  } else {
    summary = `This storefront needs attention with a health score of ${healthScore.overall}/100. ` +
      `${criticalCount} critical issues and ${warningCount} warnings found. ` +
      'Consider regenerating or updating the business profile.';
  }

  return {
    healthScore,
    insights: allInsights,
    recommendations,
    generatedAt: new Date().toISOString(),
    summary,
  };
}
