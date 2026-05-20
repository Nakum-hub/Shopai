import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateInput, generateWebsiteSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { validateHtml, repairHtml } from '@/lib/html-validator';
import { validateForLLM } from '@/lib/security';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting — website generation is expensive
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`generate:${clientIp}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many generation requests. Please wait a moment.', retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    const body = await request.json();
    const inputValidation = validateInput(generateWebsiteSchema, body);
    if (!inputValidation.success) {
      return NextResponse.json({ error: inputValidation.error }, { status: 400 });
    }

    const { businessProfile, prompt } = inputValidation.data;

    // --- Prompt Injection Protection ---
    // Validate both the freeform prompt and any text-heavy fields in businessProfile
    const textToValidate = prompt || (businessProfile ? JSON.stringify(businessProfile) : '');
    const llmValidation = validateForLLM(textToValidate);

    if (llmValidation.risk >= 0.7) {
      console.warn('[GENERATE_SECURITY] Prompt injection blocked', {
        risk: llmValidation.risk,
        warnings: llmValidation.warnings,
      });
      return NextResponse.json(
        {
          error: 'Input appears to contain instructions intended to manipulate AI behavior. Please provide legitimate business information.',
        },
        { status: 422 }
      );
    }

    // Use sanitized prompt if moderate risk, otherwise original
    const safePrompt = prompt && llmValidation.risk >= 0.3 ? llmValidation.sanitized : prompt;
    if (llmValidation.risk >= 0.3) {
      console.warn('[GENERATE_SECURITY] Prompt injection risk detected — using sanitized input', {
        risk: llmValidation.risk,
        warnings: llmValidation.warnings,
      });
    }

    const zai = await ZAI.create();

    const profileStr = businessProfile
      ? JSON.stringify(businessProfile, null, 2)
      : safePrompt!;

    // --- Stage 1: Generate complete storefront HTML ---
    const htmlGeneration = await zai.chat.completions.create({
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

    let seoData: Record<string, unknown> = {};
    try {
      const seoRaw = seoGeneration.choices[0]?.message?.content || '{}';
      const seoCleaned = seoRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      seoData = JSON.parse(seoCleaned);
    } catch {
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

    const generationTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('[GENERATE_WEBSITE]', error);
    return NextResponse.json(
      { error: 'Failed to generate website', details: String(error) },
      { status: 500 }
    );
  }
}
