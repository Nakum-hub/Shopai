import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateInput, generateWebsiteSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { validateHtml, repairHtml } from '@/lib/html-validator';
import { validateForLLM } from '@/lib/security';
import { withRequestContext, logger, getCurrentContext } from '@/lib/request-context';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, RateLimitError, ExternalServiceError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      logger.info('[GENERATE_WEBSITE] Starting website generation');

      // Rate limiting — website generation is expensive
      const ctx = getCurrentContext();
      const clientIp = ctx?.clientIp || 'unknown';
      const rl = rateLimit(`generate:${clientIp}`, 5, 60_000);
      if (!rl.allowed) {
        logger.warn('[GENERATE_WEBSITE] Rate limit exceeded', { clientIp });
        return error(new RateLimitError('Too many generation requests. Please wait a moment.', rl.retryAfterMs), timings.meta());
      }

      const body = await request.json();
      const inputValidation = validateInput(generateWebsiteSchema, body);
      if (!inputValidation.success) {
        return error(new ValidationError(inputValidation.error), timings.meta());
      }

      const { businessProfile, prompt } = inputValidation.data;

      // --- Prompt Injection Protection ---
      const textToValidate = prompt || (businessProfile ? JSON.stringify(businessProfile) : '');
      const llmValidation = validateForLLM(textToValidate);

      if (llmValidation.risk >= 0.7) {
        logger.warn('[GENERATE_SECURITY] Prompt injection blocked', {
          risk: llmValidation.risk,
          warnings: llmValidation.warnings,
        });
        return error(
          new ValidationError(
            'Input appears to contain instructions intended to manipulate AI behavior. Please provide legitimate business information.',
          ),
          timings.meta(),
        );
      }

      const safePrompt = prompt && llmValidation.risk >= 0.3 ? llmValidation.sanitized : prompt;
      if (llmValidation.risk >= 0.3) {
        logger.warn('[GENERATE_SECURITY] Prompt injection risk detected — using sanitized input', {
          risk: llmValidation.risk,
          warnings: llmValidation.warnings,
        });
      }

      let zai;
      try {
        zai = await ZAI.create();
      } catch (err) {
        throw new ExternalServiceError('Failed to initialize AI service', 'llm', err instanceof Error ? err : undefined);
      }

      const profileStr = businessProfile
        ? JSON.stringify(businessProfile, null, 2)
        : safePrompt!;

      // --- Stage 1: Generate complete storefront HTML ---
      let htmlGeneration;
      try {
        htmlGeneration = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: `You are an expert web developer who creates beautiful, modern, mobile-responsive storefront websites for small businesses.

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
            },
            {
              role: 'user',
              content: `Generate a complete storefront website for this business:\n\n${profileStr}`,
            },
          ],
          thinking: { type: 'disabled' },
        });
      } catch (err) {
        throw new ExternalServiceError('Failed to generate website HTML', 'llm', err instanceof Error ? err : undefined);
      }

      let generatedHtml = htmlGeneration.choices[0]?.message?.content || '';

      // Clean any markdown code blocks
      generatedHtml = generatedHtml
        .replace(/^```html\n?/i, '')
        .replace(/\n?```\s*$/g, '')
        .trim();

      // --- Stage 2: Validate HTML ---
      let htmlValidation = validateHtml(generatedHtml);

      // --- Stage 3: Auto-repair if needed ---
      let repairs: string[] = [];
      if (!htmlValidation.passed) {
        const repairResult = repairHtml(generatedHtml);
        generatedHtml = repairResult.html;
        repairs = repairResult.repairs;
        htmlValidation = validateHtml(generatedHtml);
      }

      // --- Stage 4: Generate SEO metadata ---
      let seoData: Record<string, unknown> = {};
      try {
        const seoGeneration = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: `Generate SEO metadata for a business website. Return JSON with:
          - title: string (SEO-optimized page title, max 60 chars)
          - description: string (meta description, max 160 chars)
          - keywords: array of strings
          - ogTitle: string
          - ogDescription: string

          Only return valid JSON. No markdown.`,
            },
            {
              role: 'user',
              content: `Business info: ${profileStr}`,
            },
          ],
          thinking: { type: 'disabled' },
        });

        try {
          const seoRaw = seoGeneration.choices[0]?.message?.content || '{}';
          const seoCleaned = seoRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          seoData = JSON.parse(seoCleaned);
        } catch {
          seoData = { title: 'Business Storefront', description: 'Welcome to our business' };
        }
      } catch (err) {
        logger.warn('[GENERATE_WEBSITE] SEO generation failed, using defaults', { error: err instanceof Error ? err.message : String(err) });
        seoData = { title: 'Business Storefront', description: 'Welcome to our business' };
      }

      // Inject SEO into HTML
      if (generatedHtml.includes('<head>')) {
        const metaTags = `
    <title>${(seoData.title as string) || 'Business Storefront'}</title>
    <meta name="description" content="${(seoData.description as string) || ''}" />
    <meta name="keywords" content="${((seoData.keywords as string[]) || []).join(', ')}" />
    <meta property="og:title" content="${(seoData.ogTitle as string) || (seoData.title as string) || ''}" />
    <meta property="og:description" content="${(seoData.ogDescription as string) || (seoData.description as string) || ''}" />`;
        generatedHtml = generatedHtml.replace('<head>', `<head>${metaTags}`);
      }

      const generationTimeMs = timings.elapsedMs();

      logger.info('[GENERATE_WEBSITE] Website generated successfully', {
        generationTimeMs,
        htmlSize: Buffer.byteLength(generatedHtml),
        validationScore: htmlValidation.score,
      });

      return success({
        html: generatedHtml,
        seo: seoData,
        validation: {
          score: htmlValidation.score,
          passed: htmlValidation.passed,
          checks: htmlValidation.checks,
          issues: htmlValidation.issues,
          summary: htmlValidation.summary,
        },
        repairs: repairs.length > 0 ? repairs : undefined,
        generationTime: `${(generationTimeMs / 1000).toFixed(1)}s`,
        htmlSize: `${(Buffer.byteLength(generatedHtml) / 1024).toFixed(1)}KB`,
      }, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
