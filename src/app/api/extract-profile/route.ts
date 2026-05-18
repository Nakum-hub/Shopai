import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build a conversation summary from messages for the LLM
    const conversationText = messages
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

    let businessProfile;
    try {
      const rawContent = response.choices[0]?.message?.content || '{}';
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      businessProfile = JSON.parse(cleaned);
    } catch {
      businessProfile = null;
    }

    if (!businessProfile || !businessProfile.name) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract a complete business profile from the conversation. Please provide more details about your business.',
      });
    }

    // Validate and set defaults for required fields
    const validCategories = ['bakery', 'restaurant', 'clothing', 'electronics', 'salon', 'grocery', 'hardware', 'medical', 'boutique', 'service', 'other'];
    const validThemes = ['modern', 'classic', 'minimal', 'bold', 'elegant'];

    const profile = {
      name: businessProfile.name || 'My Business',
      category: validCategories.includes(businessProfile.category) ? businessProfile.category : 'other',
      description: businessProfile.description || '',
      location: businessProfile.location || '',
      phone: businessProfile.phone || '',
      email: businessProfile.email || '',
      hours: businessProfile.hours || '',
      products: Array.isArray(businessProfile.products) ? businessProfile.products.map((p: Record<string, string>) => ({
        name: p.name || '',
        description: p.description || '',
        price: p.price || '',
        category: p.category || '',
      })) : [],
      services: Array.isArray(businessProfile.services) ? businessProfile.services.map((s: Record<string, string>) => ({
        name: s.name || '',
        description: s.description || '',
        duration: s.duration,
        price: s.price,
      })) : [],
      style: {
        primaryColor: businessProfile.style?.primaryColor || '#7c3aed',
        secondaryColor: businessProfile.style?.secondaryColor || '#06b6d4',
        fontFamily: businessProfile.style?.fontFamily || 'Inter',
        theme: validThemes.includes(businessProfile.style?.theme) ? businessProfile.style.theme : 'modern',
        mood: businessProfile.style?.mood || 'professional',
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
