import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { validateInput, voiceProcessSchema } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { withRequestContext, logger, getCurrentContext } from '@/lib/request-context';
import { success, error, createResponseTimings } from '@/lib/api-response';
import { errorHandler, ValidationError, RateLimitError, ExternalServiceError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    const timings = createResponseTimings();

    try {
      logger.info('[VOICE_PROCESS] Processing voice input');

      const ctx = getCurrentContext();
      const clientIp = ctx?.clientIp || 'unknown';
      const rl = rateLimit(`voice:${clientIp}`, 10, 60_000);
      if (!rl.allowed) {
        logger.warn('[VOICE_PROCESS] Rate limit exceeded', { clientIp });
        return error(new RateLimitError('Too many voice processing requests. Please wait.', rl.retryAfterMs), timings.meta());
      }

      const body = await request.json();
      const validation = validateInput(voiceProcessSchema, body);
      if (!validation.success) {
        return error(new ValidationError(validation.error), timings.meta());
      }

      const { audio } = validation.data;

      let zai;
      try {
        zai = await ZAI.create();
      } catch (err) {
        throw new ExternalServiceError('Failed to initialize AI service', 'voice', err instanceof Error ? err : undefined);
      }

      // --- Stage 1: ASR (Speech-to-Text) ---
      let response;
      try {
        response = await zai.audio.asr.create({
          file_base64: audio,
        });
      } catch (err) {
        throw new ExternalServiceError('Failed to process audio', 'asr', err instanceof Error ? err : undefined);
      }

      const transcript = response.text || '';

      if (!transcript || transcript.trim().length < 5) {
        logger.warn('[VOICE_PROCESS] Could not detect speech', { audioLength: audio.length });
        return success({
          transcript: '',
          confidence: 0,
          wordCount: 0,
          businessProfile: null,
          warning: 'Could not detect speech in the audio. Please try again with a clearer recording.',
        }, timings.meta());
      }

      // --- Stage 2: Business Profile Extraction via LLM ---
      let businessAnalysis;
      try {
        businessAnalysis = await zai.chat.completions.create({
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
      } catch (err) {
        throw new ExternalServiceError('Failed to analyze voice transcript', 'llm', err instanceof Error ? err : undefined);
      }

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

      logger.info('[VOICE_PROCESS] Voice processing complete', {
        transcriptLength: transcript.length,
        wordCount: transcript.split(/\s+/).length,
      });

      return success({
        transcript,
        confidence: 0.95,
        wordCount: transcript.split(/\s+/).length,
        businessProfile,
      }, timings.meta());
    } catch (err) {
      return errorHandler(err, request);
    }
  });
}
