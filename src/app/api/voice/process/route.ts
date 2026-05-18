import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateInput, voiceProcessSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting — ASR is expensive
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`voice:${clientIp}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many voice processing requests. Please wait.', retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateInput(voiceProcessSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { audio } = validation.data;
    const zai = await ZAI.create();

    // --- Stage 1: ASR (Speech-to-Text) ---
    const response = await zai.audio.asr.create({
      file_base64: audio,
    });

    const transcript = response.text || '';

    if (!transcript || transcript.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Could not detect speech in the audio. Please try again with a clearer recording.',
        transcript: '',
      });
    }

    // --- Stage 2: Business Profile Extraction via LLM ---
    const businessAnalysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are a business analyst AI. Extract structured business information from voice transcripts.
Return a JSON object with these fields:
- businessName: string
- category: one of [bakery, restaurant, clothing, electronics, salon, grocery, hardware, medical, boutique, service, other]
- description: string (2-3 sentence business description)
- location: string or null
- phone: string or null
- email: string or null
- hours: string or null
- products: array of {name, description, price, category} — infer reasonable products from the business type
- services: array of {name, description, duration, price}
- style: {primaryColor (hex), secondaryColor (hex), theme (modern/classic/minimal/bold/elegant), mood}
- features: array of feature strings (e.g., "online-ordering", "delivery", "whatsapp")

Only return valid JSON. No markdown, no explanation.`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      thinking: { type: 'disabled' },
    });

    let businessProfile: Record<string, unknown>;
    try {
      const rawContent = businessAnalysis.choices[0]?.message?.content || '{}';
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      businessProfile = JSON.parse(cleaned);
    } catch {
      businessProfile = {
        businessName: null,
        category: 'other',
        description: transcript,
        location: null,
        phone: null,
        email: null,
        hours: null,
        products: [],
        services: [],
        style: { primaryColor: '#7c3aed', secondaryColor: '#06b6d4', theme: 'modern', mood: 'professional' },
        features: [],
      };
    }

    return NextResponse.json({
      success: true,
      transcript,
      confidence: 0.95,
      wordCount: transcript.split(/\s+/).length,
      businessProfile,
    });
  } catch (error) {
    console.error('[VOICE_PROCESS]', error);
    return NextResponse.json(
      { error: 'Failed to process voice input', details: String(error) },
      { status: 500 }
    );
  }
}
