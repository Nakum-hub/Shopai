'use client';

// =============================================================================
// useGenerationWs — Hardened WebSocket Hook for Generation Pipeline
// =============================================================================
// Wraps useHardenedWs with generation-specific defaults and type-safe handlers.
// This hook is designed to be used within the builder-view component for
// real-time website generation pipeline communication.
//
// Features inherited from useHardenedWs:
//   - Exponential backoff reconnection
//   - Message acknowledgment with retries
//   - Offline queue with auto-flush on reconnect
//   - Backpressure signal detection
//   - Rate limit handling
//   - Server shutdown graceful handling
//   - Connection health monitoring
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
// Hook Implementation
// =============================================================================

export function useGenerationWs(callbacks: GenerationCallbacks, options?: UseGenerationWsOptions): UseGenerationWsReturn {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Stable handler map that delegates to the latest callbacks
  const [handlersVersion, setHandlersVersion] = useState(0);

  // Force handler update when callbacks change
  useEffect(() => {
    setHandlersVersion(v => v + 1);
  }, [callbacks.onProgress, callbacks.onHtml, callbacks.onComplete]);

  const genWs = useHardenedWs({
    url: '/?XTransformPort=3002',
    autoConnect: options?.autoConnect ?? false,
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 30000,
    enableReplay: true,
    handlers: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generation_progress: (payload: any) => {
        callbacksRef.current.onProgress(payload as GenerationProgressEvent);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generation_html: (payload: any) => {
        callbacksRef.current.onHtml(payload as GenerationHtmlEvent);
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generation_complete: (payload: any) => {
        callbacksRef.current.onComplete(payload as GenerationCompleteEvent);
      },
      pipeline_resumed: () => {
        callbacksRef.current.onPipelineResumed?.();
      },
    },
    // Include handlersVersion to force re-creation when handlers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Notify parent of connection state changes
  useEffect(() => {
    callbacksRef.current.onConnectionChange?.(genWs.state);
  }, [genWs.state]);

  const startGeneration = useCallback(
    (storefrontId: string, businessProfile: Record<string, unknown>, voiceTranscript?: string) => {
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
    [genWs],
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
