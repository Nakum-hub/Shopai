import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { audio } = await request.json();

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Process audio with ASR
    const response = await zai.audio.asr.create({
      file_base64: audio,
    });

    const transcript = response.text || '';

    // Use LLM to extract business understanding from the transcript
    const businessAnalysis = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are a business analyst AI. Extract structured business information from voice transcripts. 
          Return a JSON object with these fields:
          - businessName: string
          - category: one of [bakery, restaurant, clothing, electronics, salon, grocery, hardware, medical, boutique, service, other]
          - description: string (2-3 sentence business description)
          - location: string
          - phone: string or null
          - email: string or null  
          - hours: string or null
          - products: array of {name, description, price, category}
          - services: array of {name, description, duration, price}
          - style: {primaryColor, secondaryColor, theme (modern/classic/minimal/bold/elegant), mood}
          - features: array of feature strings (e.g., ["online-ordering", "delivery", "whatsapp"])
          
          Only return valid JSON. No markdown, no explanation. If a field cannot be determined, use null or empty array.`
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      thinking: { type: 'disabled' },
    });

    let businessProfile;
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
