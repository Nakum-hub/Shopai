'use client';

// =============================================================================
// useGenerationWs — Hardened WebSocket Hook for Generation Pipeline
// =============================================================================
// Wraps useHardenedWs with generation-specific defaults and type-safe handlers.
// This hook is designed to be used within the builder-view component for
// real-time website generation pipeline communication.
//
// AUDIT #10 — Now fetches a JWT auth token from /api/ws-token before
// connecting, ensuring all WebSocket traffic is authenticated.
//
// Features inherited from useHardenedWs:
//   - Exponential backoff reconnection
//   - Message acknowledgment with retries
//   - Offline queue with auto-flush on reconnect
//   - Backpressure signal detection
//   - Rate limit handling
//   - Server shutdown graceful handling
//   - Connection health monitoring & metrics
//   - Message replay on reconnect
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useHardenedWs, type ConnectionState, type ConnectionMetrics } from '@/hooks/use-hardened-ws';

// =============================================================================
// Types
// =============================================================================

export type GenerationStatus =
  | 'idle'
  | 'processing_voice'
  | 'understanding_business'
  | 'planning_structure'
  | 'generating_branding'
  | 'generating_content'
  | 'generating_sections'
  | 'assembling_pages'
  | 'validating'
  | 'repairing'
  | 'complete'
  | 'error';

export interface GenerationLog {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  agent: string;
  message: string;
  detail?: string;
}

export interface GenerationProgressEvent {
  storefrontId: string;
  status: GenerationStatus;
  message: string;
  progress: number;
  agent: string;
  logs: GenerationLog[];
}

export interface GenerationHtmlEvent {
  storefrontId: string;
  html: string;
  validationScore: number;
  generationTimeMs: number;
}

export interface GenerationCompleteEvent {
  storefrontId: string;
  success: boolean;
  html?: string;
  validationScore?: number;
  generationTimeMs?: number;
}

export interface GenerationCallbacks {
  onProgress: (data: GenerationProgressEvent) => void;
  onHtml: (data: GenerationHtmlEvent) => void;
  onComplete: (data: GenerationCompleteEvent) => void;
  onError?: (error: string) => void;
  onPipelineResumed?: () => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export interface UseGenerationWsOptions {
  /** Enable auto-connect on mount (default: false — controlled manually). */
  autoConnect?: boolean;
}

export interface UseGenerationWsReturn {
  /** Whether the socket is currently connected. */
  isConnected: boolean;
  /** Current connection state. */
  connectionState: ConnectionState;
  /** Connection metrics snapshot. */
  metrics: ConnectionMetrics;
  /** Whether the server is signalling backpressure. */
  backpressureActive: boolean;
  /** Whether the server is signalling rate limiting. */
  rateLimited: boolean;
  /** Last connection error, or null. */
  lastError: string | null;

  /**
   * Start a generation pipeline request.
   *
   * @param storefrontId - Unique ID for the storefront being generated
   * @param businessProfile - The business profile data
   * @param voiceTranscript - Optional voice transcript
   */
  startGeneration: (storefrontId: string, businessProfile: Record<string, unknown>, voiceTranscript?: string) => void;

  /**
   * Cancel the current generation (if any).
   */
  cancelGeneration: (storefrontId: string) => void;

  /**
   * Manually disconnect and clean up.
   */
  disconnect: () => void;
}

// =============================================================================
// Token Management
// =============================================================================

interface WsTokenResponse {
  success: boolean;
  token?: string;
  sessionId?: string;
  error?: string;
}

/**
 * Fetch a JWT token from the /api/ws-token endpoint.
 * Retries up to 3 times with exponential backoff.
 */
async function fetchWsToken(): Promise<WsTokenResponse> {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch('/api/ws-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilities: ['generation', 'voice'] }),
      });

      if (!res.ok) {
        console.warn(`[WsToken] Token request failed: HTTP ${res.status} (attempt ${attempt + 1}/${maxRetries})`);
        continue;
      }

      return await res.json();
    } catch (err) {
      console.warn(`[WsToken] Token fetch error (attempt ${attempt + 1}/${maxRetries}):`, err);
    }

    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return { success: false, error: 'Failed to obtain WebSocket token after retries' };
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useGenerationWs(callbacks: GenerationCallbacks, options?: UseGenerationWsOptions): UseGenerationWsReturn {
  const callbacksRef = useRef(callbacks);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // Keep ref in sync with latest callbacks each render
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Fetch token on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setTokenLoading(true);
      if (cancelled) return;
      const result = await fetchWsToken();
      if (cancelled) return;

      if (result.success && result.token) {
        setAuthToken(result.token);
        console.log('[WsToken] Token obtained successfully, sessionId:', result.sessionId);
      } else {
        console.warn('[WsToken] Token fetch failed:', result.error);
      }
      setTokenLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const genWs = useHardenedWs({
    url: '/?XTransformPort=3002',
    autoConnect: !!authToken && (options?.autoConnect ?? false),
    authToken: authToken || undefined,
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000,
    enableReplay: true,
    handlers: {
      generation_progress: (payload: unknown) => {
        callbacksRef.current.onProgress(payload as GenerationProgressEvent);
      },
      generation_html: (payload: unknown) => {
        callbacksRef.current.onHtml(payload as GenerationHtmlEvent);
      },
      generation_complete: (payload: unknown) => {
        callbacksRef.current.onComplete(payload as GenerationCompleteEvent);
      },
      pipeline_resumed: () => {
        callbacksRef.current.onPipelineResumed?.();
      },
    },
  });

  // Notify parent of connection state changes
  useEffect(() => {
    callbacksRef.current.onConnectionChange?.(genWs.state);
  }, [genWs.state]);

  const startGeneration = useCallback(
    (storefrontId: string, businessProfile: Record<string, unknown>, voiceTranscript?: string) => {
      if (!genWs.isConnected && !tokenLoading) {
        console.warn('[GenerationWs] Attempting to start generation while not connected and no token loading');
      }
      genWs.emit(
        'start_generation',
        {
          storefrontId,
          businessProfile,
          ...(voiceTranscript ? { voiceTranscript } : {}),
        },
        {
          requireAck: true,
          ackTimeout: 10_000,
          maxRetries: 3,
          queueIfDisconnected: true,
        },
      );
    },
    [genWs, tokenLoading],
  );

  const cancelGeneration = useCallback(
    (storefrontId: string) => {
      genWs.emit('cancel_generation', { storefrontId });
    },
    [genWs],
  );

  const disconnect = useCallback(() => {
    genWs.disconnect();
  }, [genWs]);

  return {
    isConnected: genWs.isConnected,
    connectionState: genWs.state,
    metrics: genWs.metrics,
    backpressureActive: genWs.backpressureActive,
    rateLimited: genWs.rateLimited,
    lastError: genWs.lastError,
    startGeneration,
    cancelGeneration,
    disconnect,
  };
}

export default useGenerationWs;
