import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateInput, extractProfileSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { validateForLLM } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`extract:${clientIp}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const validation = validateInput(extractProfileSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { messages } = validation.data;

    // --- Prompt Injection Protection ---
    // Validate the concatenation of all user messages for prompt injection patterns
    const userTexts = messages
      .filter((m: { role: string; content: string }) => m.role === 'user')
      .map((m: { role: string; content: string }) => m.content)
      .join('\n');
    const llmValidation = validateForLLM(userTexts);

    if (llmValidation.risk >= 0.7) {
      console.warn('[EXTRACT_PROFILE_SECURITY] Prompt injection blocked', {
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

    // Use sanitized user messages if moderate risk, otherwise originals
    const safeMessages = llmValidation.risk >= 0.3
      ? messages.map((m: { role: string; content: string }) =>
          m.role === 'user' ? { ...m, content: llmValidation.sanitized } : m
        )
      : messages;

    if (llmValidation.risk >= 0.3) {
      console.warn('[EXTRACT_PROFILE_SECURITY] Prompt injection risk detected — using sanitized input', {
        risk: llmValidation.risk,
        warnings: llmValidation.warnings,
      });
    }

    const zai = await ZAI.create();

    // Build conversation summary from safe messages
    const conversationText = safeMessages
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are a business analyst AI. Analyze a chat conversation between a user and an AI assistant about building a website for the user's business. Extract a structured business profile from the conversation.

Return a JSON object with these EXACT fields:
- name: string (business name)
- category: one of [bakery, restaurant, clothing, electronics, salon, grocery, hardware, medical, boutique, service, other]
- description: string (2-3 sentence business description for the website)
- location: string or null
- phone: string or null
- email: string or null
- hours: string or null
- products: array of objects with {name, description, price, category} — extract mentioned products/services with prices if available, or infer reasonable products from the business type
- services: array of objects with {name, description, duration, price} — extract mentioned services
- style: object with {primaryColor (hex string), secondaryColor (hex string), fontFamily (web-safe or Google font name), theme (one of: modern, classic, minimal, bold, elegant), mood (descriptive string)}
- features: array of feature strings relevant for the website (e.g., "online-ordering", "photo-gallery", "google-maps", "customer-reviews", "whatsapp", "booking-form")

IMPORTANT RULES:
1. Only return valid JSON. No markdown, no explanation, no code fences.
2. If a field cannot be determined from the conversation, use null for strings or empty array [] for arrays.
3. Generate at least 2-4 products that make sense for the business type, even if not explicitly mentioned.
4. Generate at least 1-2 services if applicable for the business type.
5. Choose colors and fonts that match the business personality. Use hex color codes.
6. If the user hasn't provided enough info, make reasonable assumptions based on the business type.`,
        },
        {
          role: 'user',
          content: `Here is the conversation to analyze:\n\n${conversationText}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    let businessProfile: Record<string, unknown> | null;
    try {
      const rawContent = response.choices[0]?.message?.content || '{}';
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      businessProfile = JSON.parse(cleaned);
    } catch {
      businessProfile = null;
    }

    if (!businessProfile || !(businessProfile.name as string)) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract a complete business profile from the conversation. Please provide more details about your business.',
      });
    }

    // Validate and set defaults
    const validCategories = ['bakery', 'restaurant', 'clothing', 'electronics', 'salon', 'grocery', 'hardware', 'medical', 'boutique', 'service', 'other'];
    const validThemes = ['modern', 'classic', 'minimal', 'bold', 'elegant'];

    const profile = {
      name: (businessProfile.name as string) || 'My Business',
      category: validCategories.includes(businessProfile.category as string) ? businessProfile.category : 'other',
      description: (businessProfile.description as string) || '',
      location: (businessProfile.location as string) || '',
      phone: (businessProfile.phone as string) || '',
      email: (businessProfile.email as string) || '',
      hours: (businessProfile.hours as string) || '',
      products: Array.isArray(businessProfile.products) ? (businessProfile.products as Array<Record<string, string>>).map((p) => ({
        name: p.name || '',
        description: p.description || '',
        price: p.price || '',
        category: p.category || '',
      })) : [],
      services: Array.isArray(businessProfile.services) ? (businessProfile.services as Array<Record<string, string>>).map((s) => ({
        name: s.name || '',
        description: s.description || '',
        duration: s.duration,
        price: s.price,
      })) : [],
      style: {
        primaryColor: (businessProfile.style as Record<string, string>)?.primaryColor || '#7c3aed',
        secondaryColor: (businessProfile.style as Record<string, string>)?.secondaryColor || '#06b6d4',
        fontFamily: (businessProfile.style as Record<string, string>)?.fontFamily || 'Inter',
        theme: validThemes.includes((businessProfile.style as Record<string, string>)?.theme as string) ? (businessProfile.style as Record<string, string>)?.theme : 'modern',
        mood: (businessProfile.style as Record<string, string>)?.mood || 'professional',
      },
      features: Array.isArray(businessProfile.features) ? businessProfile.features : [],
    };

    return NextResponse.json({
      success: true,
      businessProfile: profile,
    });
  } catch (error) {
    console.error('[EXTRACT_PROFILE]', error);
    return NextResponse.json(
      { error: 'Failed to extract business profile', details: String(error) },
      { status: 500 }
    );
  }
}
