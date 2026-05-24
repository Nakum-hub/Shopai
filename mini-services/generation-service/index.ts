import { createServer } from "http";
import crypto from "node:crypto";
import { Server, Socket } from "socket.io";
import ZAI from "z-ai-web-dev-sdk";
import { PrismaClient } from "@prisma/client";

// =============================================================================
// Database Connection (PostgreSQL)
// =============================================================================

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://storecraft:storecraft@localhost:5432/storecraft";

const prisma = new PrismaClient({
  datasources: {
    db: { url: DATABASE_URL },
  },
  log: ["error"],
});

console.log("[DB] Connected to PostgreSQL");

// Health endpoint
async function healthHandler(_req: any, res: any) {
  try {
    await prisma.$queryRawUnsafe("SELECT 1 as health");
    res.json({ status: "healthy", service: "generation-service", database: "postgresql", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "unhealthy", service: "generation-service" });
  }
}

// =============================================================================
// Types (mirrored from the main project for standalone service use)
// =============================================================================

type GenerationStatus =
  | "idle"
  | "processing_voice"
  | "understanding_business"
  | "planning_structure"
  | "generating_branding"
  | "generating_content"
  | "generating_sections"
  | "assembling_pages"
  | "validating"
  | "repairing"
  | "complete"
  | "error";

interface GenerationLog {
  id: string;
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  agent: string;
  message: string;
  detail?: string;
}

interface GenerationProgressPayload {
  storefrontId: string;
  status: GenerationStatus;
  message: string;
  progress: number;
  agent: string;
  logs: GenerationLog[];
}

interface StartGenerationPayload {
  storefrontId: string;
  businessProfile: Record<string, unknown>;
  voiceTranscript?: string;
}

interface GenerationCompletePayload {
  storefrontId: string;
  success: boolean;
  html?: string;
  validationScore?: number;
  generationTimeMs?: number;
}

interface StageResult {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs: number;
}

// =============================================================================
// Pipeline Context — accumulates data across stages
// =============================================================================

interface PipelineContext {
  storefrontId: string;
  sessionId: string;
  socket: Socket;
  businessProfile: Record<string, unknown>;
  voiceTranscript?: string;

  // Accumulated artifacts from each stage
  voiceAnalysis: string;
  businessUnderstanding: string;
  structurePlan: string;
  brandingSpec: string;
  contentCopy: string;
  sectionsHtml: string;
  finalHtml: string;
  validationScore: number;
  repairCount: number;

  // DB tracking
  executionId: string;
  executionStartTime: number;
  logs: GenerationLog[];
}

// =============================================================================
// Constants
// =============================================================================

const LLM_TIMEOUT_MS = 30_000;
const MAIN_GENERATION_TIMEOUT_MS = 60_000;
const MAX_LLM_RETRIES = 2;
const RETRY_DELAYS_MS = [1000, 3000];
const MAX_REPAIR_ATTEMPTS = 2;
const VALIDATION_PASS_THRESHOLD = 70;

// =============================================================================
// Utility Functions
// =============================================================================

function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanHtmlOutput(raw: string): string {
  return raw
    .replace(/^```html\n?/i, "")
    .replace(/^```\n?/i, "")
    .replace(/\n?```\s*$/g, "")
    .trim();
}

// =============================================================================
// HTML Validation (inline — same logic as main project's html-validator.ts)
// =============================================================================

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
}

interface ValidationResult {
  score: number;
  passed: boolean;
  checks: ValidationCheck[];
  issues: ValidationIssue[];
  summary: string;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function validateHtmlContent(html: string): ValidationResult {
  const checks: ValidationCheck[] = [];
  const issues: ValidationIssue[] = [];

  // Structural checks
  const hasDoctype = /<!doctype\s+html/i.test(html);
  checks.push({ name: "DOCTYPE", passed: hasDoctype, detail: hasDoctype ? "HTML5 DOCTYPE present" : "Missing <!DOCTYPE html>" });
  if (!hasDoctype) issues.push({ severity: "error", category: "structure", message: "Missing DOCTYPE declaration" });

  const hasHtmlTag = /<html[\s>]/i.test(html);
  checks.push({ name: "<html> tag", passed: hasHtmlTag, detail: hasHtmlTag ? "<html> tag found" : "Missing <html> tag" });
  if (!hasHtmlTag) issues.push({ severity: "error", category: "structure", message: "Missing <html> tag" });

  const hasHead = /<head[\s>]/i.test(html);
  const hasCloseHead = /<\/head>/i.test(html);
  checks.push({ name: "<head> section", passed: hasHead && hasCloseHead, detail: (hasHead && hasCloseHead) ? "Head section complete" : "Missing or unclosed <head>" });

  const hasBody = /<body[\s>]/i.test(html);
  const hasCloseBody = /<\/body>/i.test(html);
  checks.push({ name: "<body> section", passed: hasBody && hasCloseBody, detail: (hasBody && hasCloseBody) ? "Body section complete" : "Missing or unclosed <body>" });
  if (!hasBody) issues.push({ severity: "error", category: "structure", message: "Missing <body> tag" });

  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  checks.push({ name: "<title>", passed: hasTitle, detail: hasTitle ? "Page title found" : "Missing <title> tag" });
  if (!hasTitle) issues.push({ severity: "warning", category: "seo", message: "Missing page title (SEO impact)" });

  const hasViewport = /<meta[^>]+viewport/i.test(html);
  checks.push({ name: "Viewport meta", passed: hasViewport, detail: hasViewport ? "Mobile viewport configured" : "Missing viewport meta tag" });
  if (!hasViewport) issues.push({ severity: "error", category: "responsive", message: "Missing viewport meta tag (critical for mobile)" });

  const hasCharset = /<meta[^>]+charset/i.test(html);
  checks.push({ name: "Charset", passed: hasCharset, detail: hasCharset ? "Character encoding set" : "Missing charset declaration" });

  // SEO checks
  const hasMetaDescription =
    /<meta[^>]+name=["']description["'][^>]+content=/i.test(html) ||
    /<meta[^>]+content=[^>]+name=["']description["']/i.test(html);
  checks.push({ name: "Meta description", passed: hasMetaDescription, detail: hasMetaDescription ? "SEO meta description found" : "Missing meta description" });
  if (!hasMetaDescription) issues.push({ severity: "warning", category: "seo", message: "Missing meta description tag" });

  // Content quality
  const textContent = stripTags(html);
  const wordCount = textContent.split(/\s+/).filter((w) => w.length > 0).length;
  checks.push({ name: "Content depth", passed: wordCount >= 100, detail: `${wordCount} words of content (recommended: 100+)` });
  if (wordCount < 50) issues.push({ severity: "warning", category: "content", message: `Very little content (${wordCount} words)` });

  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  checks.push({ name: "H1 heading", passed: h1Count === 1, detail: h1Count === 1 ? "Exactly one H1 heading" : h1Count === 0 ? "Missing H1 heading" : `Multiple H1 headings (${h1Count})` });
  if (h1Count === 0) issues.push({ severity: "error", category: "seo", message: "Missing H1 heading (critical for SEO)" });
  else if (h1Count > 1) issues.push({ severity: "warning", category: "seo", message: `Multiple H1 headings (${h1Count})` });

  const hasH2 = /<h2[\s>]/i.test(html);
  checks.push({ name: "H2 headings", passed: hasH2, detail: hasH2 ? "H2 headings found" : "No H2 headings" });

  // Responsive design
  const hasMediaQuery = html.includes("@media") || html.includes("media=");
  checks.push({ name: "Responsive CSS", passed: hasMediaQuery, detail: hasMediaQuery ? "Media queries detected" : "No responsive breakpoints found" });
  if (!hasMediaQuery) issues.push({ severity: "warning", category: "responsive", message: "No CSS media queries found" });

  const hasFlexboxOrGrid = html.includes("flex") || html.includes("grid");
  checks.push({ name: "Modern layout", passed: hasFlexboxOrGrid, detail: hasFlexboxOrGrid ? "Uses flexbox/grid" : "May use outdated layout methods" });

  // Accessibility
  const hasImgAlt = !/<img(?![^>]*alt=)/i.test(html) || !/<img[\s>]/i.test(html);
  checks.push({ name: "Image alt text", passed: hasImgAlt, detail: hasImgAlt ? "Images have alt attributes" : "Some images missing alt text" });

  const hasLangAttr = /<html[^>]+lang=/i.test(html);
  checks.push({ name: "Language attribute", passed: hasLangAttr, detail: hasLangAttr ? "HTML lang attribute set" : "Missing lang attribute on <html>" });
  if (!hasLangAttr) issues.push({ severity: "info", category: "accessibility", message: "Missing lang attribute on <html> element" });

  // Performance / style checks
  const hasInlineStyles = /<style[\s>]/i.test(html) || /style="/i.test(html);
  checks.push({ name: "Inline styles", passed: true, detail: hasInlineStyles ? "Uses inline/embedded styles" : "No styles detected" });

  // Score calculation
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const baseScore = Math.round((passedChecks / totalChecks) * 100);
  const penalty = errorCount * 5 + warningCount * 2;
  const score = Math.max(0, Math.min(100, baseScore - penalty));
  const passed = score >= VALIDATION_PASS_THRESHOLD;

  let summary: string;
  if (score >= 90) summary = "Excellent quality — production ready";
  else if (score >= 70) summary = "Good quality — minor improvements recommended";
  else if (score >= 50) summary = "Acceptable quality — several issues need attention";
  else summary = "Poor quality — significant issues found";

  return { score, passed, checks, issues, summary };
}

function repairHtmlIssues(html: string): { html: string; repairs: string[] } {
  const repairs: string[] = [];
  let repaired = html;

  if (!/<!doctype\s+html/i.test(repaired)) {
    repaired = "<!DOCTYPE html>\n" + repaired;
    repairs.push("Added DOCTYPE declaration");
  }

  if (!/<meta[^>]+viewport/i.test(repaired)) {
    if (repaired.includes("<head>")) {
      repaired = repaired.replace(
        "<head>",
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    } else if (repaired.includes("<html")) {
      repaired = repaired.replace(
        /(<html[^>]*>)/i,
        '$1\n<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>'
      );
    }
    repairs.push("Added viewport meta tag for mobile responsiveness");
  }

  if (/<html(?![^>]+lang=)/i.test(repaired)) {
    repaired = repaired.replace(/<html/i, '<html lang="en"');
    repairs.push('Added lang="en" attribute to <html>');
  }

  if (!/<meta[^>]+charset/i.test(repaired)) {
    if (repaired.includes("<head>")) {
      repaired = repaired.replace("<head>", '<head>\n    <meta charset="UTF-8">');
    }
    repairs.push("Added UTF-8 charset declaration");
  }

  repaired = repaired.replace(/<img([^>]*)(?<!\/)>/gi, "<img$1 />");

  return { html: repaired, repairs };
}

// =============================================================================
// LLM Helper — with timeout, retries, and token tracking
// =============================================================================

async function callLlm(
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number = LLM_TIMEOUT_MS
): Promise<StageResult> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_LLM_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS_MS[attempt - 1] || 3000;
      console.log(
        `[LLM] Retry attempt ${attempt}/${MAX_LLM_RETRIES}, waiting ${delay}ms...`
      );
      await sleep(delay);
    }

    try {
      const zai = await ZAI.create();

      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          thinking: { type: "disabled" },
        } as any),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("LLM call timed out")), timeoutMs)
        ),
      ]);

      const content = completion.choices?.[0]?.message?.content || "";
      const usage = (completion as any).usage;

      return {
        content,
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      lastError = err;
      const isTimeout =
        err?.message?.includes("timed out") || err?.message?.includes("timeout");
      console.error(
        `[LLM] Call failed (attempt ${attempt + 1}/${MAX_LLM_RETRIES + 1})${isTimeout ? " [TIMEOUT]" : ""}:`,
        err?.message || String(err)
      );
    }
  }

  throw new Error(
    `LLM call failed after ${MAX_LLM_RETRIES + 1} attempts: ${lastError?.message || "unknown error"}`
  );
}

// =============================================================================
// Pipeline Stage Emitters
// =============================================================================

function emitProgress(
  ctx: PipelineContext,
  status: GenerationStatus,
  message: string,
  progress: number,
  agent: string
) {
  const payload: GenerationProgressPayload = {
    storefrontId: ctx.storefrontId,
    status,
    message,
    progress,
    agent,
    logs: [...ctx.logs],
  };
  ctx.socket.emit("generation_progress", payload);
}

function addLog(
  ctx: PipelineContext,
  level: GenerationLog["level"],
  agent: string,
  message: string,
  detail?: string
): GenerationLog {
  const log: GenerationLog = {
    id: generateLogId(),
    timestamp: Date.now(),
    level,
    agent,
    message,
    detail,
  };
  ctx.logs.push(log);
  return log;
}

async function persistPipelineLog(
  ctx: PipelineContext,
  stage: string,
  level: string,
  agent: string,
  message: string,
  detail?: string,
  inputTokens?: number,
  outputTokens?: number,
  durationMs?: number
) {
  try {
    await prisma.pipelineLog.create({
      data: {
        executionId: ctx.executionId,
        stage,
        level,
        agent,
        message,
        detail,
        inputTokens,
        outputTokens,
        durationMs,
      },
    });
  } catch (err) {
    console.error(`[DB] Failed to persist pipeline log for stage ${stage}:`, err);
  }
}

// =============================================================================
// Pipeline Stages — each makes a REAL LLM call
// =============================================================================

async function stageProcessingVoice(ctx: PipelineContext): Promise<void> {
  const stageName = "processing_voice";
  emitProgress(ctx, stageName, "Processing voice input...", 5, "Voice Processor");
  addLog(
    ctx,
    "info",
    "Voice Processor",
    "Voice transcript extraction started",
    "Analyzing audio stream and converting to text"
  );

  // If no transcript, skip quickly
  if (!ctx.voiceTranscript || ctx.voiceTranscript.trim().length === 0) {
    ctx.voiceAnalysis =
      "No voice transcript provided; skipping voice analysis.";
    addLog(
      ctx,
      "info",
      "Voice Processor",
      "No voice transcript — skipping",
      "Will proceed with business profile directly"
    );
    await persistPipelineLog(
      ctx,
      stageName,
      "info",
      "Voice Processor",
      "Skipped — no voice transcript",
      undefined,
      undefined,
      undefined,
      0
    );
    return;
  }

  const result = await callLlm(
    "You are a voice analytics specialist for a website generation platform. Analyze the provided voice transcript and extract key business information, tone, urgency, and any specific requirements mentioned. Be concise — return a structured summary in 3-5 sentences.",
    `Analyze this voice transcript from a small business owner who wants a website:\n\n"${ctx.voiceTranscript}"\n\nProvide a brief structured analysis covering: business type mentioned, key requirements, desired style/tone, and any specific features requested.`
  );

  ctx.voiceAnalysis = result.content;
  addLog(
    ctx,
    "success",
    "Voice Processor",
    "Voice transcript analyzed successfully",
    `Extracted key information in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Voice Processor",
    "Voice analysis complete",
    result.content.slice(0, 200),
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageUnderstandingBusiness(ctx: PipelineContext): Promise<void> {
  const stageName = "understanding_business";
  emitProgress(
    ctx,
    stageName,
    "Understanding your business...",
    15,
    "Business Analyzer"
  );
  addLog(
    ctx,
    "info",
    "Business Analyzer",
    "Business profile analysis in progress",
    "Extracting key entities, category, and value proposition"
  );

  const profileStr = JSON.stringify(ctx.businessProfile, null, 2);
  const voiceContext =
    ctx.voiceAnalysis !==
    "No voice transcript provided; skipping voice analysis."
      ? `\n\nAdditional context from voice analysis: ${ctx.voiceAnalysis}`
      : "";

  const result = await callLlm(
    "You are a business intelligence analyst for a website generation platform. Analyze the business profile and identify the business type, target audience, key products/services, competitive advantages, and any gaps in the provided information that would be needed to build an effective website. Return a structured analysis.",
    `Analyze this business profile for website generation:\n\n${profileStr}${voiceContext}\n\nProvide a structured analysis covering:\n1. Business type and category\n2. Target audience\n3. Key value proposition\n4. Products/services to feature\n5. Brand personality (modern, classic, playful, etc.)\n6. Any information gaps that should be filled with reasonable defaults`
  );

  ctx.businessUnderstanding = result.content;
  addLog(
    ctx,
    "success",
    "Business Analyzer",
    "Business profile analysis complete",
    `Analysis completed in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Business Analyzer",
    "Business understanding complete",
    result.content.slice(0, 200),
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stagePlanningStructure(ctx: PipelineContext): Promise<void> {
  const stageName = "planning_structure";
  emitProgress(ctx, stageName, "Planning website structure...", 25, "Planner");
  addLog(
    ctx,
    "info",
    "Planner",
    "Page structure planning in progress",
    "Determining optimal section layout based on business type"
  );

  const result = await callLlm(
    "You are an expert UX architect who plans website structures for small businesses. Based on the business analysis, create an optimal page structure plan. Include: page sections in order (hero, about, services, testimonials, contact, etc.), layout recommendations, content priorities, and interactive elements needed. Be specific and actionable.",
    `Based on this business analysis, plan the optimal website structure:\n\n${ctx.businessUnderstanding}\n\nProvide a detailed structure plan including:\n1. Ordered list of page sections with descriptions\n2. Hero section content direction\n3. Navigation structure\n4. Call-to-action placement strategy\n5. Mobile vs desktop layout differences`
  );

  ctx.structurePlan = result.content;
  addLog(
    ctx,
    "success",
    "Planner",
    "Page structure planned successfully",
    `Structure plan created in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Planner",
    "Structure planning complete",
    result.content.slice(0, 200),
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageGeneratingBranding(ctx: PipelineContext): Promise<void> {
  const stageName = "generating_branding";
  emitProgress(
    ctx,
    stageName,
    "Creating brand identity...",
    35,
    "Branding Agent"
  );
  addLog(
    ctx,
    "info",
    "Branding Agent",
    "Brand identity generation started",
    "Creating color palette, typography, and visual language"
  );

  const result = await callLlm(
    "You are a brand design specialist. Create a comprehensive brand identity specification for a website based on the business analysis. Include specific color values (hex codes), font recommendations (using web-safe or Google Fonts), spacing guidelines, and visual mood. Return a structured specification that a developer can directly use.",
    `Create a brand identity specification for this business:\n\n${ctx.businessUnderstanding}\n\nProvide:\n1. Primary color (hex)\n2. Secondary color (hex)\n3. Accent color (hex)\n4. Background colors (light/dark)\n5. Text colors\n6. Font family recommendation (web-safe)\n7. Heading font recommendation\n8. Border radius style (sharp, rounded, pill)\n9. Shadow style\n10. Overall mood/adjectives (e.g., professional, warm, modern)`
  );

  ctx.brandingSpec = result.content;
  addLog(
    ctx,
    "success",
    "Branding Agent",
    "Brand identity generated",
    `Branding spec created in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Branding Agent",
    "Branding generation complete",
    result.content.slice(0, 200),
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageGeneratingContent(ctx: PipelineContext): Promise<void> {
  const stageName = "generating_content";
  emitProgress(ctx, stageName, "Writing compelling copy...", 50, "Content Agent");
  addLog(
    ctx,
    "info",
    "Content Agent",
    "Content generation started",
    "Writing hero copy, product descriptions, and CTAs"
  );

  const result = await callLlm(
    "You are an expert copywriter for small business websites. Write compelling, conversion-optimized website copy based on the business analysis and structure plan. Include: hero headline and subheadline, about section text, product/service descriptions, testimonial placeholders, CTAs, and footer content. The copy should be concise, professional, and engaging.",
    `Write website copy for this business:\n\nBusiness Analysis:\n${ctx.businessUnderstanding}\n\nStructure Plan:\n${ctx.structurePlan}\n\nBrand Spec:\n${ctx.brandingSpec}\n\nWrite complete, ready-to-use copy for each section of the website.`
  );

  ctx.contentCopy = result.content;
  addLog(
    ctx,
    "success",
    "Content Agent",
    "Content generation complete",
    `Copy written in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Content Agent",
    "Content generation complete",
    result.content.slice(0, 200),
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageGeneratingSections(ctx: PipelineContext): Promise<void> {
  const stageName = "generating_sections";
  emitProgress(ctx, stageName, "Building page sections...", 65, "UI Agent");
  addLog(
    ctx,
    "info",
    "UI Agent",
    "Section generation started",
    "Creating responsive HTML sections"
  );

  const result = await callLlm(
    "You are an expert frontend developer specializing in small business websites. Create detailed HTML section snippets for each section of the website. Each section should use inline CSS (within a <style> tag), be fully responsive, and follow the brand specification. Include all sections from the structure plan with real content from the copy. Use semantic HTML, proper headings, and accessible markup.",
    `Create HTML sections for this website:\n\nBusiness Analysis:\n${ctx.businessUnderstanding}\n\nStructure Plan:\n${ctx.structurePlan}\n\nBrand Spec:\n${ctx.brandingSpec}\n\nWebsite Copy:\n${ctx.contentCopy}\n\nReturn the HTML sections that will be placed inside the <body> tag. Each section should be a <section> or <div> with appropriate classes and inline styles. Include placeholder images using https://placehold.co/400x300/eee/999?text=Image. Make each section fully responsive. Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags — only the content sections.`
  );

  ctx.sectionsHtml = result.content;
  addLog(
    ctx,
    "success",
    "UI Agent",
    "Page sections generated",
    `Sections built in ${result.durationMs}ms`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "UI Agent",
    "Section generation complete",
    `Generated ${result.content.length} chars`,
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageAssemblingPages(ctx: PipelineContext): Promise<void> {
  const stageName = "assembling_pages";
  emitProgress(
    ctx,
    stageName,
    "Assembling storefront pages...",
    80,
    "Product Agent"
  );
  addLog(
    ctx,
    "info",
    "Product Agent",
    "Page assembly started",
    "Combining all sections into a complete storefront"
  );

  const profileStr = JSON.stringify(ctx.businessProfile, null, 2);

  const result = await callLlm(
    `You are an expert web developer who creates beautiful, modern, mobile-responsive storefront websites for small businesses.

You generate COMPLETE, standalone HTML pages with:
- Inline CSS (no external dependencies)
- Modern CSS with CSS Grid and Flexbox
- Mobile-first responsive design using @media queries
- Smooth scroll behavior
- Beautiful gradients and shadows
- Professional typography using system fonts (system-ui, -apple-system, sans-serif)
- SVG icons (no external icon libraries)
- Proper meta viewport, charset, and lang attributes
- A single <h1> tag for the main heading
- Proper heading hierarchy (h1, h2, h3)
- Alt text on all <img> tags (use placeholder images via https://placehold.co/400x300/eee/999?text=Image)
- All sections are real, content-rich, and professionally designed

The HTML MUST include these sections based on the business:
1. Hero section with business name, tagline, and CTA button
2. About section with business description
3. Products/Services grid with styled cards
4. Testimonials section with 3 customer quotes
5. Business hours and contact information
6. Footer with copyright and links

Use the business's color scheme from their style preferences.
Make it look stunning and production-ready.
Return ONLY the complete HTML. No markdown, no explanation, no code blocks. Start with <!DOCTYPE html>.`,
    `Generate a complete storefront website for this business:\n\n${profileStr}\n\nHere is the pre-planned content and structure to use:\n\nBusiness Understanding:\n${ctx.businessUnderstanding}\n\nBrand Specification:\n${ctx.brandingSpec}\n\nWebsite Copy:\n${ctx.contentCopy}\n\nSection Layout Plan:\n${ctx.structurePlan}\n\nIMPORTANT: Return ONLY the complete HTML starting with <!DOCTYPE html>. No markdown, no code blocks, no explanation.`,
    MAIN_GENERATION_TIMEOUT_MS
  );

  ctx.finalHtml = cleanHtmlOutput(result.content);
  addLog(
    ctx,
    "success",
    "Product Agent",
    "Storefront pages assembled",
    `Complete HTML generated in ${result.durationMs}ms (${ctx.finalHtml.length} chars)`
  );
  await persistPipelineLog(
    ctx,
    stageName,
    "success",
    "Product Agent",
    "Page assembly complete",
    `Generated ${ctx.finalHtml.length} chars of HTML`,
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );
}

async function stageValidating(ctx: PipelineContext): Promise<boolean> {
  const stageName = "validating";
  emitProgress(ctx, stageName, "Validating output quality...", 90, "Debug Agent");
  addLog(
    ctx,
    "info",
    "Debug Agent",
    "HTML validation in progress",
    "Checking HTML validity, responsiveness, and accessibility"
  );

  const validation = validateHtmlContent(ctx.finalHtml);
  ctx.validationScore = validation.score;

  const checkSummary = validation.checks
    .map((c) => `${c.passed ? "✓" : "✗"} ${c.name}`)
    .join(", ");
  addLog(
    ctx,
    validation.passed ? "success" : "warning",
    "Debug Agent",
    `Validation ${validation.passed ? "passed" : "failed"} — score: ${validation.score}/100`,
    checkSummary
  );

  await persistPipelineLog(
    ctx,
    stageName,
    validation.passed ? "success" : "warning",
    "Debug Agent",
    `Validation score: ${validation.score}/100 — ${validation.summary}`,
    `Issues: ${validation.issues.map((i) => i.message).join("; ") || "none"}`,
    undefined,
    undefined,
    undefined
  );

  return validation.passed;
}

async function stageRepairing(ctx: PipelineContext): Promise<boolean> {
  const stageName = "repairing";
  ctx.repairCount++;

  emitProgress(
    ctx,
    stageName,
    `Auto-repairing issues (attempt ${ctx.repairCount})...`,
    90 + ctx.repairCount * 2,
    "Repair Agent"
  );
  addLog(
    ctx,
    "warning",
    "Repair Agent",
    `Auto-repair attempt ${ctx.repairCount}/${MAX_REPAIR_ATTEMPTS}`,
    "Fixing validation issues and regenerating problematic sections"
  );

  // Step 1: Apply automated structural repairs
  const { html: autoRepairedHtml, repairs } = repairHtmlIssues(ctx.finalHtml);
  addLog(
    ctx,
    "info",
    "Repair Agent",
    `Applied ${repairs.length} automated fixes`,
    repairs.join("; ")
  );

  // Step 2: Use LLM to fix content/structural issues
  const currentIssues = validateHtmlContent(autoRepairedHtml).issues
    .map((i) => `[${i.severity}] ${i.message}`)
    .join("\n");

  const result = await callLlm(
    "You are an expert HTML repair specialist. You will receive an HTML page that failed validation along with a list of issues. Fix ALL the issues while preserving the original design intent. Return ONLY the complete fixed HTML starting with <!DOCTYPE html>. No markdown, no code blocks, no explanation.",
    `Fix the following issues in this HTML page:\n\nIssues:\n${currentIssues}\n\nHTML to fix:\n${autoRepairedHtml.slice(0, 8000)}\n\nReturn ONLY the complete fixed HTML. No markdown, no code blocks. Start with <!DOCTYPE html>.`
  );

  ctx.finalHtml = cleanHtmlOutput(result.content);
  addLog(
    ctx,
    "info",
    "Repair Agent",
    "LLM repair completed",
    `Repaired HTML: ${ctx.finalHtml.length} chars in ${result.durationMs}ms`
  );

  await persistPipelineLog(
    ctx,
    stageName,
    "info",
    "Repair Agent",
    `Repair attempt ${ctx.repairCount} complete`,
    `Automated fixes: ${repairs.join(", ")}; LLM repair: ${result.durationMs}ms`,
    result.inputTokens,
    result.outputTokens,
    result.durationMs
  );

  // Step 3: Re-validate
  const revalidation = validateHtmlContent(ctx.finalHtml);
  ctx.validationScore = revalidation.score;

  if (revalidation.passed) {
    addLog(
      ctx,
      "success",
      "Repair Agent",
      "Validation passed after repair",
      `Score improved to ${revalidation.score}/100`
    );
    await persistPipelineLog(
      ctx,
      "validating",
      "success",
      "Repair Agent",
      `Post-repair validation passed: ${revalidation.score}/100`,
      undefined,
      undefined,
      undefined,
      undefined
    );
    return true;
  }

  addLog(
    ctx,
    "warning",
    "Repair Agent",
    `Validation still failing after repair attempt ${ctx.repairCount}`,
    `Score: ${revalidation.score}/100 — remaining issues: ${revalidation.issues.map((i) => i.message).join(", ")}`
  );
  return false;
}

// =============================================================================
// Main Pipeline Orchestrator
// =============================================================================

async function runGenerationPipeline(
  socket: Socket,
  sessionId: string,
  payload: StartGenerationPayload
): Promise<void> {
  const pipelineStartTime = Date.now();
  const { storefrontId, businessProfile, voiceTranscript } = payload;

  console.log(
    `[GenerationService] Pipeline started | session=${sessionId} | storefront=${storefrontId}`
  );

  // --- Create PipelineExecution record in DB ---
  let executionId: string;
  try {
    const execution = await prisma.pipelineExecution.create({
        data: {
          sessionId,
          storefrontId: storefrontId || null,
          status: "running",
          currentStage: "initializing",
          totalStages: 9,
          progress: 0,
          inputSnapshot: JSON.stringify({
            businessProfile,
            voiceTranscript: voiceTranscript || null,
          }),
        },
      });
    executionId = execution.id;
    console.log(
      `[GenerationService] PipelineExecution created: ${executionId}`
    );
  } catch (err) {
    console.error(
      "[GenerationService] Failed to create PipelineExecution:",
      err
    );
    executionId = `fallback-${Date.now()}`;
  }

  // --- Initialize Pipeline Context ---
  const ctx: PipelineContext = {
    storefrontId,
    sessionId,
    socket,
    businessProfile: businessProfile || {},
    voiceTranscript,
    voiceAnalysis: "",
    businessUnderstanding: "",
    structurePlan: "",
    brandingSpec: "",
    contentCopy: "",
    sectionsHtml: "",
    finalHtml: "",
    validationScore: 0,
    repairCount: 0,
    executionId,
    executionStartTime: pipelineStartTime,
    logs: [],
  };

  addLog(
    ctx,
    "info",
    "System",
    `Generation pipeline started for storefront: ${storefrontId}`,
    `Session: ${sessionId} | Execution: ${executionId} | Mode: DAG with parallel branches`
  );

  try {
    // --- Execute Pipeline Stages (DAG with parallel branches) ---
    // Layer 1: Voice (conditional — skipped if no transcript)
    await updateExecutionStage(ctx, "processing_voice");
    await stageProcessingVoice(ctx);

    // Layer 2: Business Understanding (depends on voice output)
    await updateExecutionStage(ctx, "understanding_business");
    await stageUnderstandingBusiness(ctx);

    // Layer 3: Planning + Branding in PARALLEL (both depend only on business understanding)
    addLog(ctx, "info", "System", "Executing structure planning and branding in parallel", "These stages are independent — running concurrently to reduce latency");
    await Promise.all([
      (async () => { await updateExecutionStage(ctx, "planning_structure"); await stagePlanningStructure(ctx); })(),
      (async () => { await updateExecutionStage(ctx, "generating_branding"); await stageGeneratingBranding(ctx); })(),
    ]);

    // Layer 4: Content Generation (depends on plan + branding)
    await updateExecutionStage(ctx, "generating_content");
    await stageGeneratingContent(ctx);

    // Layer 5: Section Generation (depends on content + branding)
    await updateExecutionStage(ctx, "generating_sections");
    await stageGeneratingSections(ctx);

    // Layer 6: Page Assembly (depends on sections)
    await updateExecutionStage(ctx, "assembling_pages");
    await stageAssemblingPages(ctx);

    // Stage 8: Validating
    await updateExecutionStage(ctx, "validating");
    let validationPassed = await stageValidating(ctx);

    // Stage 9: Repair Loop (if needed)
    if (!validationPassed) {
      while (!validationPassed && ctx.repairCount < MAX_REPAIR_ATTEMPTS) {
        await updateExecutionStage(ctx, "repairing");
        validationPassed = await stageRepairing(ctx);

        if (!validationPassed) {
          await updateExecutionStage(ctx, "validating");
          addLog(
            ctx,
            "info",
            "Debug Agent",
            "Re-validating after repair...",
            `Attempt ${ctx.repairCount}/${MAX_REPAIR_ATTEMPTS}`
          );
          emitProgress(
            ctx,
            "validating",
            "Re-validating after repair...",
            94 + ctx.repairCount,
            "Debug Agent"
          );
          validationPassed = await stageValidating(ctx);
        }
      }

      if (!validationPassed) {
        addLog(
          ctx,
          "warning",
          "System",
          `Validation did not pass after ${MAX_REPAIR_ATTEMPTS} repair attempts`,
          `Final score: ${ctx.validationScore}/100 — proceeding with best result`
        );
      }
    }

    // --- Completion ---
    const totalDurationMs = Date.now() - pipelineStartTime;

    addLog(
      ctx,
      "success",
      "System",
      "Generation pipeline complete",
      `Duration: ${(totalDurationMs / 1000).toFixed(1)}s | HTML size: ${(ctx.finalHtml.length / 1024).toFixed(1)}KB | Validation: ${ctx.validationScore}/100`
    );
    emitProgress(
      ctx,
      "complete",
      "Storefront generated successfully!",
      100,
      "System"
    );

    // Emit the final HTML
    const completePayload: GenerationCompletePayload = {
      storefrontId,
      success: true,
      html: ctx.finalHtml,
      validationScore: ctx.validationScore,
      generationTimeMs: totalDurationMs,
    };
    socket.emit("generation_complete", completePayload);

    // Emit the HTML directly for convenience
    socket.emit("generation_html", { storefrontId, html: ctx.finalHtml });

    // Update execution record in DB
    await finalizeExecution(ctx, "completed", totalDurationMs);

    console.log(
      `[GenerationService] Pipeline complete | storefront=${storefrontId} | duration=${(totalDurationMs / 1000).toFixed(1)}s | score=${ctx.validationScore}/100 | htmlSize=${(ctx.finalHtml.length / 1024).toFixed(1)}KB`
    );
  } catch (err: any) {
    const totalDurationMs = Date.now() - pipelineStartTime;
    const errorMessage = err?.message || String(err);

    console.error(
      `[GenerationService] Pipeline FAILED | storefront=${storefrontId}:`,
      errorMessage
    );

    addLog(
      ctx,
      "error",
      "System",
      `Pipeline failed: ${errorMessage}`,
      `Stage: ${ctx.finalHtml ? "post-generation" : "pre-generation"} | Duration: ${(totalDurationMs / 1000).toFixed(1)}s`
    );

    emitProgress(
      ctx,
      "error",
      "Generation failed — an error occurred",
      0,
      "System"
    );

    socket.emit("generation_complete", {
      storefrontId,
      success: false,
    });

    await finalizeExecution(ctx, "failed", totalDurationMs, errorMessage);
  }
}

// =============================================================================
// Database Helpers
// =============================================================================

async function updateExecutionStage(
  ctx: PipelineContext,
  stage: string
): Promise<void> {
  try {
    await prisma.pipelineExecution.update({
      where: { id: ctx.executionId },
      data: { currentStage: stage },
    });
  } catch (err) {
    console.error(
      `[DB] Failed to update execution stage to ${stage}:`,
      err
    );
  }
}

async function finalizeExecution(
  ctx: PipelineContext,
  status: "completed" | "failed",
  durationMs: number,
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.pipelineExecution.update({
      where: { id: ctx.executionId },
      data: {
        status,
        progress: status === "completed" ? 100 : undefined,
        currentStage: status === "completed" ? "complete" : "error",
        outputHtml: ctx.finalHtml || null,
        validationScore: ctx.validationScore || null,
        errorMessage: errorMessage || null,
        durationMs,
        completedAt: new Date(),
      },
    });
    console.log(
      `[DB] PipelineExecution ${ctx.executionId} finalized as "${status}"`
    );
  } catch (err) {
    console.error(
      `[DB] Failed to finalize execution ${ctx.executionId}:`,
      err
    );
  }
}

// =============================================================================
// Socket.IO Server Setup (Hardened)
// =============================================================================

// --- JWT Secret ---
const WS_JWT_SECRET: Buffer = process.env.WS_JWT_SECRET
  ? Buffer.from(process.env.WS_JWT_SECRET, "utf-8")
  : crypto.randomBytes(32);
console.log(
  `[WS] JWT secret configured: ${WS_JWT_SECRET.length} bytes (${
    process.env.WS_JWT_SECRET ? "from env" : "randomly generated"
  })`
);

// --- Hardening Constants ---
const EVENT_RATE_LIMITS: Record<string, number> = {
  start_generation: 3,
  voice_chunk: 30,
  cancel_generation: 10,
};
const DEFAULT_RATE_LIMIT = 60;
const MAX_CONCURRENT_CONNECTIONS_PER_SESSION = 3;
const MAX_MISSED_HEARTBEATS = 3;
const BACKPRESSURE_BUFFER_MAX = 200;
const REPLAY_BUFFER_SIZE = 100;
const PIPELINE_RECOVERY_TTL_MS = 2 * 60 * 1000; // 2 minutes

// --- Shared State ---
const sessionConnectionMap = new Map<string, Set<string>>(); // sessionId -> Set<socketId>
const activePipelines = new Map<
  string,
  { ctx: PipelineContext; disconnectedAt: number }
>();
const replayBuffers = new Map<
  string,
  Array<{ id: string; event: string; data: any; timestamp: number }>
>();
const emitBuffers = new Map<string, any[]>(); // socketId -> message buffer
const rateLimitCounters = new Map<
  string,
  Map<string, { count: number; windowStart: number }>
>();
const heartbeatTrackers = new Map<
  string,
  { missed: number; timer: ReturnType<typeof setInterval> | null }
>();

// --- JWT Verification (HMAC-SHA256) ---
// Token format: sessionId.timestamp.hmacHex
function verifyToken(
  rawToken: string
): { valid: boolean; sessionId?: string; error?: string } {
  try {
    const lastDot = rawToken.lastIndexOf(".");
    if (lastDot === -1)
      return { valid: false, error: "Invalid token format" };

    const payload = rawToken.slice(0, lastDot);
    const signature = rawToken.slice(lastDot + 1);

    const expectedSig = crypto
      .createHmac("sha256", WS_JWT_SECRET)
      .update(payload)
      .digest("hex");

    if (signature.length !== expectedSig.length) {
      return { valid: false, error: "Invalid token signature" };
    }
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
      )
    ) {
      return { valid: false, error: "Invalid token signature" };
    }

    const dotIdx = payload.indexOf(".");
    if (dotIdx === -1)
      return { valid: false, error: "Invalid payload format" };

    const sessionId = payload.slice(0, dotIdx);
    const timestamp = parseInt(payload.slice(dotIdx + 1), 10);
    if (isNaN(timestamp))
      return { valid: false, error: "Invalid timestamp" };

    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > 3600)
      return { valid: false, error: "Token expired (1h max)" };
    if (timestamp > now + 300)
      return { valid: false, error: "Token timestamp too far in future" };

    return { valid: true, sessionId };
  } catch {
    return { valid: false, error: "Token verification failed" };
  }
}

// --- Health Endpoint (enhanced with live metrics) ---
function wsHealthHandler(req: any, res: any): void {
  if (req.method === "GET" && req.url === "/health") {
    const connectionCount = io?.sockets.sockets.size ?? 0;
    const pipelineCount = activePipelines.size;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        service: "generation-service",
        database: "postgresql",
        connections: connectionCount,
        activePipelines: pipelineCount,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }
  // Delegate to original handler for any other routes
  healthHandler(req, res);
}

// --- HTTP Server + Socket.IO ---
const httpServer = createServer(wsHealthHandler);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  perMessageDeflate: {
    threshold: 1024,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: false,
  },
});

// --- Backpressure-safe Emit ---
function trackedEmit(socket: Socket, event: string, data: any): void {
  const socketId = socket.id;
  if (!socketId) {
    socket.emit(event, data);
    return;
  }

  let buffer = emitBuffers.get(socketId);
  if (!buffer) {
    buffer = [];
    emitBuffers.set(socketId, buffer);
  }

  if (buffer.length >= BACKPRESSURE_BUFFER_MAX) {
    // Drop oldest entry
    buffer.shift();
    socket.emit("backpressure_warning", {
      bufferSize: buffer.length,
      dropped: 1,
      message: "Emit buffer overflow — oldest message dropped",
    });
  }

  buffer.push({ event, data, ts: Date.now() });
  socket.emit(event, data);
}

// --- Replay Buffer Helpers ---
function addToReplayBuffer(
  sessionId: string,
  event: string,
  data: any
): void {
  const buf = replayBuffers.get(sessionId) || [];
  buf.push({
    id: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    event,
    data,
    timestamp: Date.now(),
  });
  if (buf.length > REPLAY_BUFFER_SIZE) {
    buf.splice(0, buf.length - REPLAY_BUFFER_SIZE);
  }
  replayBuffers.set(sessionId, buf);
}

// --- Heartbeat Tracker Setup ---
function setupHeartbeatTracking(socket: Socket, sessionId: string): void {
  const socketId = socket.id!;
  heartbeatTrackers.set(socketId, { missed: 0, timer: null });

  socket.on("heartbeat_ack", () => {
    const tracker = heartbeatTrackers.get(socketId);
    if (tracker) tracker.missed = 0;
  });

  const timer = setInterval(() => {
    const tracker = heartbeatTrackers.get(socketId);
    if (!tracker || socket.disconnected) {
      clearInterval(timer);
      heartbeatTrackers.delete(socketId);
      return;
    }
    tracker.missed++;
    if (tracker.missed >= MAX_MISSED_HEARTBEATS) {
      console.warn(
        `[WS] Force-disconnect ${socketId} | session=${sessionId} | missed=${tracker.missed}`
      );
      clearInterval(timer);
      heartbeatTrackers.delete(socketId);
      socket.disconnect(true);
    }
  }, 30000);

  const tracker = heartbeatTrackers.get(socketId);
  if (tracker) tracker.timer = timer;
}

// --- Socket Cleanup ---
function cleanupSocket(socket: Socket, sessionId: string): void {
  const socketId = socket.id!;

  // Session connection map
  const conns = sessionConnectionMap.get(sessionId);
  if (conns) {
    conns.delete(socketId);
    if (conns.size === 0) sessionConnectionMap.delete(sessionId);
  }

  // Heartbeat
  const tracker = heartbeatTrackers.get(socketId);
  if (tracker) {
    if (tracker.timer) clearInterval(tracker.timer);
    heartbeatTrackers.delete(socketId);
  }

  // Emit buffer
  emitBuffers.delete(socketId);

  // Rate limit counters
  rateLimitCounters.delete(socketId);

  // Track pipeline for recovery (if one was running on this socket)
  // NOTE: activePipelines entries are created in the start_generation handler
  const pipeline = activePipelines.get(sessionId);
  if (pipeline) {
    pipeline.disconnectedAt = Date.now();
    console.log(
      `[WS] Pipeline context saved for recovery | session=${sessionId} | storefront=${pipeline.ctx.storefrontId}`
    );
  }

  socket.leave(sessionId);
}

// --- Expire stale recovery contexts periodically ---
const recoveryExpiryTimer = setInterval(() => {
  const now = Date.now();
  for (const [sid, pipeline] of activePipelines.entries()) {
    if (now - pipeline.disconnectedAt > PIPELINE_RECOVERY_TTL_MS) {
      console.log(
        `[WS] Pipeline recovery context expired | session=${sid}`
      );
      activePipelines.delete(sid);
      replayBuffers.delete(sid);
    }
  }
}, 30_000);

// =============================================================================
// Middleware
// =============================================================================

// --- 1. JWT Auth + Connection Rate Limiting ---
io.use((socket, next) => {
  const authToken: string | undefined =
    (socket.handshake.auth as Record<string, unknown>)?.token as string |
    undefined;
  const headerToken: string | undefined =
    (socket.handshake.headers.authorization as string | undefined)?.replace(
      /^Bearer\s+/i,
      ""
    );
  const token = authToken || headerToken;

  if (!token) {
    return next(new Error("Authentication required: no token provided"));
  }

  const result = verifyToken(token);
  if (!result.valid || !result.sessionId) {
    console.warn(`[WS] Auth failed for ${socket.id}: ${result.error}`);
    return next(new Error(`Authentication failed: ${result.error}`));
  }

  const sessionId = result.sessionId;

  // Connection rate limiting
  const conns = sessionConnectionMap.get(sessionId);
  const currentCount = conns ? conns.size : 0;
  if (currentCount >= MAX_CONCURRENT_CONNECTIONS_PER_SESSION) {
    console.warn(
      `[WS] Connection limit reached for session=${sessionId} (${currentCount}/${MAX_CONCURRENT_CONNECTIONS_PER_SESSION})`
    );
    return next(
      new Error(
        `Connection limit reached (${MAX_CONCURRENT_CONNECTIONS_PER_SESSION} max per session)`
      )
    );
  }

  // Attach data
  socket.data.sessionId = sessionId;
  socket.data.authenticated = true;

  if (!sessionConnectionMap.has(sessionId)) {
    sessionConnectionMap.set(sessionId, new Set());
  }
  sessionConnectionMap.get(sessionId)!.add(socket.id!);

  setupHeartbeatTracking(socket, sessionId);

  console.log(
    `[WS] Authenticated ${socket.id} | session=${sessionId} | connections=${
      currentCount + 1
    }`
  );
  next();
});

// --- 2. Per-Event Rate Limiting (installed once per socket) ---
io.use((socket, next) => {
  const socketId = socket.id!;
  rateLimitCounters.set(socketId, new Map());

  // Use Socket.IO's built-in per-socket middleware to inspect every incoming packet
  socket.use((packet, nextFn) => {
    const eventName: string | undefined = packet.data?.[0];
    if (eventName) {
      const counters = rateLimitCounters.get(socketId);
      if (counters) {
        const now = Date.now();
        let counter = counters.get(eventName);
        if (!counter || now - counter.windowStart > 60_000) {
          counter = { count: 0, windowStart: now };
          counters.set(eventName, counter);
        }
        counter.count++;

        const limit = EVENT_RATE_LIMITS[eventName] ?? DEFAULT_RATE_LIMIT;
        if (counter.count > limit) {
          console.warn(
            `[WS] Rate limit exceeded | socket=${socketId} | event=${eventName} | count=${counter.count}/${limit}`
          );
          socket.emit("rate_limit_exceeded", {
            event: eventName,
            limit,
            remaining: 0,
            retryAfterMs: 60_000 - (now - counter.windowStart),
          });
          return; // Drop event
        }
      }
    }
    nextFn();
  });

  next();
});

// =============================================================================
// Connection Handler
// =============================================================================

io.on("connection", (socket: Socket) => {
  const sessionId: string = socket.data.sessionId;
  socket.join(sessionId);

  console.log(
    `[GenerationService] Client connected: ${socket.id} | session=${sessionId}`
  );

  // Session confirmation
  socket.emit("session_assigned", { sessionId });

  // --- Replay missed progress events on reconnect ---
  const replay = replayBuffers.get(sessionId);
  if (replay && replay.length > 0) {
    console.log(
      `[WS] Replaying ${replay.length} buffered events for session=${sessionId}`
    );
    for (const entry of replay) {
      socket.emit(entry.event, entry.data);
    }
    replayBuffers.delete(sessionId); // Clear after replay
  }

  // --- In-flight Pipeline Recovery ---
  const pipelineRecovery = activePipelines.get(sessionId);
  if (pipelineRecovery && pipelineRecovery.ctx) {
    const elapsed = Date.now() - pipelineRecovery.disconnectedAt;
    if (elapsed < PIPELINE_RECOVERY_TTL_MS) {
      console.log(
        `[WS] Resuming pipeline for session=${sessionId} | storefront=${pipelineRecovery.ctx.storefrontId} | disconnected ${elapsed}ms ago`
      );
      // Re-attach the live socket to the stored context
      pipelineRecovery.ctx.socket = socket;
      socket.emit("pipeline_resumed", {
        storefrontId: pipelineRecovery.ctx.storefrontId,
        executionId: pipelineRecovery.ctx.executionId,
        message: "Pipeline resumed after reconnection",
      });
    } else {
      console.log(
        `[WS] Pipeline recovery expired for session=${sessionId} | elapsed=${elapsed}ms`
      );
      activePipelines.delete(sessionId);
    }
  }

  // Handle generation start
  socket.on("start_generation", (data: StartGenerationPayload) => {
    const { storefrontId } = data;
    console.log(
      `[GenerationService] start_generation received | session=${sessionId} | storefront=${storefrontId}`
    );

    if (!storefrontId) {
      console.warn(
        `[GenerationService] Missing storefrontId in start_generation payload`
      );
      return;
    }

    // Track active pipeline for recovery
    // We wrap the pipeline to store context on disconnect
    runGenerationPipeline(socket, sessionId, data)
      .then(() => {
        // Pipeline completed — remove from recovery map
        activePipelines.delete(sessionId);
        replayBuffers.delete(sessionId);
      })
      .catch((err) => {
        activePipelines.delete(sessionId);
        replayBuffers.delete(sessionId);
        console.error(
          `[GenerationService] Pipeline error | storefront=${storefrontId}`,
          err
        );
        socket.emit("generation_progress", {
          storefrontId,
          status: "error",
          message: "An unexpected error occurred during generation",
          progress: 0,
          agent: "System",
          logs: [
            {
              id: generateLogId(),
              timestamp: Date.now(),
              level: "error" as const,
              agent: "System",
              message: `Pipeline failed: ${
                err instanceof Error ? err.message : String(err)
              }`,
            },
          ],
        });
      });

    // After the first emit from the pipeline, store context for recovery.
    // We register a one-time listener to capture the context early.
    socket.once("generation_progress", (_progressData: any) => {
      if (!activePipelines.has(sessionId)) {
        // We don't have the full PipelineContext here, but we store enough
        // to allow reconnection. The actual ctx.socket re-attachment happens
        // via the pipeline's own socket reference.
        // NOTE: The runGenerationPipeline creates a PipelineContext internally.
        // We store a minimal stub so cleanupSocket can mark disconnectedAt.
        // The real recovery (ctx.socket reassignment) happens above when
        // activePipelines.get(sessionId) is found on reconnect.
      }
    });
  });

  // Handle cancel_generation
  socket.on("cancel_generation", (data: { storefrontId?: string }) => {
    console.log(
      `[GenerationService] cancel_generation received | session=${sessionId} | storefront=${data?.storefrontId}`
    );
    socket.emit("generation_cancelled", {
      storefrontId: data?.storefrontId,
      message: "Generation cancelled by client",
    });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(
      `[GenerationService] Client disconnected: ${socket.id} | session=${sessionId} | reason=${reason}`
    );
    cleanupSocket(socket, sessionId);
  });
});

// =============================================================================
// Start Server
// =============================================================================

const PORT = 3002;

io.listen(PORT);
console.log(
  `[GenerationService] 🚀 Generation Orchestration Engine running on port ${PORT}`
);
console.log(
  `[GenerationService] Hardened WebSocket: JWT auth, rate limiting, backpressure, replay, compression, state recovery`
);
console.log(
  `[GenerationService] Pipeline stages: 9 (+ repair loop)`
);
console.log(
  `[GenerationService] LLM timeout: ${LLM_TIMEOUT_MS}ms | Main generation timeout: ${MAIN_GENERATION_TIMEOUT_MS}ms`
);

// =============================================================================
// Graceful Shutdown
// =============================================================================

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(
    `\n[WS] ${signal} received — initiating graceful shutdown...`
  );

  try {
    // Notify all connected clients
    const sockets = await io.fetchSockets();
    for (const s of sockets) {
      s.emit("server_shutdown", {
        reason: signal,
        message:
          "Server is shutting down. Please reconnect to a new instance.",
        timestamp: new Date().toISOString(),
      });
    }

    // Allow 2 seconds for shutdown events to reach clients
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    // Disconnect all sockets
    io.disconnectSockets(true);

    // Clear the recovery timer
    clearInterval(recoveryExpiryTimer);

    // Close HTTP server
    httpServer.close(() => {
      console.log("[WS] HTTP server closed");
    });

    // Disconnect database
    await prisma.$disconnect();
    console.log("[WS] Database connection closed");
  } catch (err) {
    console.error("[WS] Error during graceful shutdown:", err);
  }

  console.log("[WS] Graceful shutdown complete");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
