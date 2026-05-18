import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// Conversation memory (in production, use DB)
const conversations = new Map<string, Array<{ role: string; content: string }>>();

const SYSTEM_PROMPT = `You are StoreCraft AI, an intelligent assistant that helps small business owners create professional websites by understanding their business through conversation.

Your role:
1. Ask friendly, relevant questions about their business
2. Extract key details: business name, type, products/services, location, hours, contact info
3. Understand their brand style preferences
4. Be warm, encouraging, and professional
5. Keep responses concise (2-3 sentences max unless explaining something)
6. When you have enough information, suggest generating their website

Key information to gather:
- Business name and type (bakery, restaurant, salon, etc.)
- Products or services they offer
- Location and contact details
- Business hours
- Style preferences (colors, theme, mood)
- Special features needed (online ordering, delivery, WhatsApp, etc.)

Always be helpful and make the process feel easy and magical for non-technical users.`;

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const sid = sessionId || 'default';
    const zai = await ZAI.create();

    // Get or create conversation history
    let history = conversations.get(sid) || [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ];

    // Add user message
    history.push({ role: 'user', content: message });

    // Trim history if too long (keep system prompt + last 10 messages)
    if (history.length > 22) {
      history = [history[0], ...history.slice(-20)];
    }

    // Get AI completion
    const completion = await zai.chat.completions.create({
      messages: history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      thinking: { type: 'disabled' },
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm here to help! Tell me about your business.";

    // Add AI response to history
    history.push({ role: 'assistant', content: aiResponse });
    conversations.set(sid, history);

    // Check if we should suggest quick replies based on conversation state
    const messageCount = history.filter(m => m.role === 'user').length;
    let quickReplies: string[] = [];

    if (messageCount === 1) {
      quickReplies = [
        'We sell products',
        'We offer services',
        'Both products and services',
      ];
    } else if (messageCount === 2) {
      quickReplies = [
        'Modern and clean',
        'Warm and classic',
        'Bold and colorful',
      ];
    } else if (messageCount >= 3) {
      quickReplies = [
        'Generate my website',
        'I need online ordering',
        'Add WhatsApp button',
      ];
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      quickReplies,
      messageCount,
    });
  } catch (error) {
    console.error('[CHAT_POST]', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      conversations.delete(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear conversation' },
      { status: 500 }
    );
  }
}
