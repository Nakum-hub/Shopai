import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateForLLM } from '@/lib/security';
import { validateHtml, repairHtml } from '@/lib/html-validator';

const DEMO_SYSTEM_PROMPT = `You are an expert web developer who creates beautiful, modern, mobile-responsive storefront websites for small businesses.

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
- Alt text on all <img> tags (use placeholder images via https://placehold.co/400x300/ddd/888?text=Image)
- All sections are real, content-rich, and professionally designed

The HTML MUST include these sections based on the business:
1. Hero section with business name, tagline, and CTA button
2. About section with business description
3. Products/Services grid with styled cards (at least 4 items with placeholder images)
4. Testimonials section with 3 customer reviews (use realistic names and quotes)
5. Business hours and contact information section
6. Footer with copyright and links

Design guidelines:
- Use the business type to determine appropriate colors (warm tones for restaurants, clean tones for medical, etc.)
- Include a professional navigation bar at the top
- Make it look stunning and production-ready
- Include hover effects and smooth transitions
- Use a cohesive color palette throughout

Return ONLY the complete HTML. No markdown, no explanation, no code blocks. Start with <!DOCTYPE html>.`;

// Rate limiting for demo (simple in-memory)
const demoRateLimit = new Map<string, { count: number; resetAt: number }>();
const DEMO_RATE_LIMIT_MAX = 3;
const DEMO_RATE_LIMIT_WINDOW = 60_000; // 1 minute

function checkDemoRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = demoRateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    demoRateLimit.set(ip, { count: 1, resetAt: now + DEMO_RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (entry.count >= DEMO_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

// Simple category detection from description
function detectCategory(description: string): string {
  const lower = description.toLowerCase();
  const categories: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['bakery', 'pastry', 'bread', 'cake', 'donut', 'patisserie', 'cupcake'], category: 'bakery' },
    { keywords: ['restaurant', 'pizza', 'sushi', 'trattoria', 'diner', 'cafe', 'bistro', 'eatery', 'food', 'grill', 'bar', 'lounge', 'rooftop'], category: 'restaurant' },
    { keywords: ['clothing', 'fashion', 'boutique', 'dress', 'apparel', 'wardrobe', 'shoe', 'vintage', 'athleisure'], category: 'clothing' },
    { keywords: ['electronics', 'tech', 'computer', 'phone', 'gaming', 'smart home', 'apple', 'audio', 'gadget'], category: 'electronics' },
    { keywords: ['salon', 'barber', 'spa', 'hair', 'nail', 'beauty', 'wellness', 'massage', 'cosmet'], category: 'salon' },
    { keywords: ['grocery', 'market', 'organic', 'fresh', 'produce', 'spice', 'wine', 'cheese', 'butcher', 'deli'], category: 'grocery' },
    { keywords: ['hardware', 'tools', 'diy', 'garden', 'plumb', 'electrical', 'home improvement'], category: 'hardware' },
    { keywords: ['medical', 'dental', 'doctor', 'clinic', 'health', 'pharmacy', 'physio', 'eye', 'vet'], category: 'medical' },
    { keywords: ['yoga', 'fitness', 'gym', 'coaching', 'personal trainer'], category: 'service' },
    { keywords: ['photography', 'photo', 'studio', 'wedding', 'planner', 'event'], category: 'boutique' },
  ];

  for (const { keywords, category } of categories) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

// Extract a business name from the description
function extractBusinessName(description: string): string {
  // Try to find a business name pattern like "X in Y" or "X of Y"
  const patterns = [
    /^(?:An?\s+)?(.+?)(?:\s+(?:in|at|of|near|from)\s+.+)$/i,
    /^(.+?)(?:\s+(?:salon|restaurant|bakery|cafe|shop|store|studio|clinic|barbershop|boutique))$/i,
    /^(.+?)(?:\s+(?:in|at|of|near|from)\s+.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length >= 2 && name.length <= 50) {
        return name
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  // Fallback: generate a name from the description
  const words = description
    .replace(/^(an?\s+|the\s+)/i, '')
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  return words || 'My Business';
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkDemoRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many demo requests. Please wait ${Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)} seconds and try again.`,
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((rateCheck.retryAfterMs || 60000) / 1000)) },
        }
      );
    }

    const body = await request.json();
    const description = body?.description;

    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'A business description is required.' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trimmed = description.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Description must be between 5 and 500 characters.' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prompt injection check
    const llmValidation = validateForLLM(trimmed);
    if (llmValidation.risk >= 0.7) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Input appears to contain unsafe content. Please provide a legitimate business description.' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safePrompt = llmValidation.risk >= 0.3 ? llmValidation.sanitized : trimmed;

    // Initialize AI
    const zai = await ZAI.create();

    // Generate the website HTML
    const generation = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: DEMO_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a complete, professional storefront website for: "${safePrompt}"\n\nCreate a beautiful, modern website that accurately represents this type of business. Use appropriate colors, imagery themes, and content that would appeal to its target customers.`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    let html = generation.choices[0]?.message?.content || '';

    // Clean markdown code blocks
    html = html
      .replace(/^```html\n?/i, '')
      .replace(/\n?```\s*$/g, '')
      .trim();

    if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'GENERATION_ERROR', message: 'Failed to generate valid HTML. Please try again.' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate and repair HTML
    const htmlValidation = validateHtml(html);
    if (!htmlValidation.passed) {
      const repairResult = repairHtml(html);
      html = repairResult.html;
    }

    const category = detectCategory(trimmed);
    const businessName = extractBusinessName(trimmed);
    const generationTimeMs = Math.round(performance.now() - startTime);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          html,
          category,
          businessName,
          generationTime: `${(generationTimeMs / 1000).toFixed(1)}s`,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('[DEMO_GENERATE] Error:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
