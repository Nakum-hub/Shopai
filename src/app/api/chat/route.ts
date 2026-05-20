import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { validateInput, chatRequestSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { consolidateProfile, assembleBusinessProfile, recallByCategory } from '@/lib/semantic-memory';

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
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = rateLimit(`chat:${clientIp}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.', retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateInput(chatRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { message, sessionId } = validation.data;
    const sid = sessionId || 'default';

    // --- Persistent Chat Memory ---
    // Load conversation history from DB
    let session = await db.conversationSession.findUnique({
      where: { sessionId: sid },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });

    let history: Array<{ role: string; content: string }>;

    if (session && session.messages.length > 0) {
      // Restore from DB
      history = [
        { role: 'assistant', content: SYSTEM_PROMPT },
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
      ];
    } else {
      // New session — persist it
      await db.conversationSession.create({
        data: { sessionId: sid },
      });
      history = [{ role: 'assistant', content: SYSTEM_PROMPT }];
    }

    // Add user message
    history.push({ role: 'user', content: message });

    // Trim history (keep system prompt + last 20 messages)
    if (history.length > 22) {
      history = [history[0], ...history.slice(-20)];
    }

    // Save user message to DB
    await db.chatHistory.create({
      data: { sessionId: sid, role: 'user', content: message },
    });

    // Update session metadata
    await db.conversationSession.update({
      where: { sessionId: sid },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    // --- LLM Call ---
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: history.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      thinking: { type: 'disabled' },
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm here to help! Tell me about your business.";

    // Save AI response to DB
    await db.chatHistory.create({
      data: { sessionId: sid, role: 'assistant', content: aiResponse },
    });

    await db.conversationSession.update({
      where: { sessionId: sid },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    });

    // --- Dynamic Quick Replies based on conversation depth ---
    const totalMessages = history.filter(m => m.role === 'user').length;
    let quickReplies: string[] = [];

    if (totalMessages === 1) {
      quickReplies = ['We sell products', 'We offer services', 'Both products and services'];
    } else if (totalMessages === 2) {
      quickReplies = ['Modern and clean', 'Warm and classic', 'Bold and colorful'];
    } else if (totalMessages >= 3) {
      quickReplies = ['Generate my website', 'I need online ordering', 'Add WhatsApp button'];
    }

    // --- Semantic Memory: persist extracted facts asynchronously ---
    if (totalMessages >= 2) {
      // Fire-and-forget: try to extract and store key facts from conversation
      (async () => {
        try {
          const memories = await recallByCategory(sid, 'business_profile');
          if (memories.length === 0) {
            // No memories yet — extract from conversation
            const convText = history
              .filter(m => m.role !== 'system')
              .map(m => `${m.role}: ${m.content}`)
              .join('\n');

            const zai2 = await ZAI.create();
            const extractResult = await zai2.chat.completions.create({
              messages: [
                {
                  role: 'assistant',
                  content: 'Extract key business facts from the conversation. Return JSON with these fields (use null for unknown): business_name, business_type, location, phone, email, hours, style_preference, products_count (number), services_count (number). Only valid JSON, no markdown.',
                },
                { role: 'user', content: convText },
              ],
              thinking: { type: 'disabled' },
            });

            try {
              const raw = (extractResult.choices[0]?.message?.content || '{}')
                .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const facts = JSON.parse(raw);
              if (facts && typeof facts === 'object') {
                await consolidateProfile(sid, facts, { source: 'chat', confidence: 0.7 });
              }
            } catch { /* skip */ }
          }
        } catch { /* non-blocking */ }
      })();
    }

    // Check if we have a stored business profile to return to the frontend
    let storedProfile: Record<string, unknown> | null = null;
    try {
      storedProfile = await assembleBusinessProfile(sid);
    } catch { /* skip */ }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      quickReplies,
      messageCount: totalMessages,
      sessionId: sid,
      ...(storedProfile && { businessProfile: storedProfile }),
    });
  } catch (error) {
    console.error('[CHAT_POST]', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Load conversation history from DB
    const session = await db.conversationSession.findUnique({
      where: { sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });

    if (!session) {
      return NextResponse.json({ messages: [], sessionId });
    }

    return NextResponse.json({
      sessionId,
      messageCount: session.messageCount,
      businessProfile: session.businessProfile ? JSON.parse(session.businessProfile) : null,
      messages: session.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt.getTime(),
      })),
    });
  } catch (error) {
    console.error('[CHAT_GET]', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      await db.chatHistory.deleteMany({ where: { sessionId } });
      await db.conversationSession.deleteMany({ where: { sessionId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CHAT_DELETE]', error);
    return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 });
  }
}
