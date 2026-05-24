'use client';

// =============================================================================
// useHardenedWs — Production-Grade WebSocket Client Hook
// =============================================================================
// Provides a resilient Socket.IO connection with:
//
//   1. Connection State Machine   — disconnected → connecting → connected →
//                                   reconnecting / failed
//   2. Exponential Backoff         — 1 s base, ×2 each attempt, 30 s cap,
//                                   ±500 ms jitter, configurable max attempts
//   3. Message Acknowledgment     — Per-message ack tracking with timeout
//                                   and configurable retries
//   4. Local Message Queue        — Offline queue (max 100), auto-flush on
//                                   reconnect
//   5. Backpressure Signals       — Listens for server backpressure events
//   6. Message Replay             — Requests replay on reconnect, deduplicates
//                                   by message ID
//   7. Rate Limit Handling        — Exposes rate-limited state from server
//   8. Server Shutdown Handling   — Graceful handling of server_shutdown events
//   9. Heartbeat Monitoring       — Health check based on last server activity
//   10. Connection Metrics        — Sent/received counts, duration, errors
//
// Dependencies: socket.io-client only (already a project dependency).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// =============================================================================
// Public Types & Interfaces
// =============================================================================

/** Connection state machine states. */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

/** Snapshot of real-time connection metrics. */
export interface ConnectionMetrics {
  /** Total messages sent through the socket. */
  totalMessagesSent: number;
  /** Total messages received from the server (excluding internal packets). */
  totalMessagesReceived: number;
  /** Number of reconnect attempts in the current session (resets on connect). */
  reconnectAttempts: number;
  /** Last connection error message, or null. */
  lastError: string | null;
  /** Duration of the current connected session in ms (0 if not connected). */
  connectionDuration: number;
  /** Number of messages currently sitting in the offline queue. */
  queuedMessageCount: number;
  /** Whether the connection is receiving data within the expected heartbeat window. */
  isHealthy: boolean;
}

/** Options for individual emit calls. */
export interface EmitOptions {
  /** Whether the server must acknowledge this message (default: false). */
  requireAck?: boolean;
  /** Timeout in ms before an unacknowledged message is retried (default: 5000). */
  ackTimeout?: number;
  /** Maximum retry attempts for an unacknowledged message (default: 3). */
  maxRetries?: number;
  /** Queue the message if currently disconnected (default: true). */
  queueIfDisconnected?: boolean;
}

/** Hook configuration options. */
export interface UseHardenedWsOptions {
  /** URL path or full URL (e.g., '/?XTransformPort=3005'). */
  url: string;
  /** JWT auth token — passed via handshake.auth.token. */
  authToken?: string;
  /** Whether to auto-connect on mount (default: true). */
  autoConnect?: boolean;
  /** Max reconnection attempts before giving up (default: 10). */
  maxReconnectAttempts?: number;
  /** Base reconnect delay in ms (default: 1000). */
  reconnectBaseDelay?: number;
  /** Max reconnect delay in ms (default: 30000). */
  reconnectMaxDelay?: number;
  /** Enable automatic message replay request on reconnect (default: true). */
  enableReplay?: boolean;
  /** Server ping interval in ms — used for health monitoring (default: 25000). */
  pingInterval?: number;
  /** User-defined event handlers keyed by event name. */
  handlers?: Record<string, (...args: unknown[]) => void>;
}

/** Return value of the hook. */
export interface UseHardenedWsReturn {
  /** The raw Socket.IO socket instance, or null if not connected. */
  socket: Socket | null;
  /** Current connection state. */
  state: ConnectionState;
  /** Convenience boolean — true when state === 'connected'. */
  isConnected: boolean;
  /** Current connection metrics snapshot. */
  metrics: ConnectionMetrics;
  /** Whether the server has signalled backpressure. */
  backpressureActive: boolean;
  /** Whether the server has signalled rate limiting. */
  rateLimited: boolean;
  /** Last connection error, or null. */
  lastError: string | null;
  /** Number of reconnect attempts so far. */
  reconnectAttempts: number;
  /** Manually initiate a connection. */
  connect: () => void;
  /** Manually disconnect and fully clean up. */
  disconnect: () => void;
  /**
   * Emit an event with optional ack tracking and offline queueing.
   *
   * @example
   * ```ts
   * // Fire-and-forget
   * emit('chat_message', { text: 'hello' });
   *
   * // Critical — require server ack within 5 s, retry up to 3 times
   * emit('start_generation', { id: 'job-42' }, {
   *   requireAck: true,
   *   ackTimeout: 5000,
   *   maxRetries: 3,
   * });
   * ```
   */
  emit: (event: string, data: unknown, options?: EmitOptions) => void;
}

// =============================================================================
// Internal Types
// =============================================================================

/** A message sitting in the offline queue. */
interface QueuedMessage {
  event: string;
  data: unknown;
  options?: EmitOptions;
  enqueuedAt: number;
}

/** Tracks a single pending server acknowledgment. */
interface PendingAck {
  messageId: string;
  event: string;
  data: unknown;
  retries: number;
  maxRetries: number;
  ackTimeout: number;
  timer: ReturnType<typeof setTimeout>;
}

/** Mutable metrics counters — updated in-place for performance, flushed to state periodically. */
interface MutableMetrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  lastError: string | null;
  isHealthy: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Maximum number of messages that can sit in the offline queue. */
const MAX_QUEUE_SIZE = 100;

/** Default server ping interval in ms (socket.io default is 25 s). */
const DEFAULT_PING_INTERVAL = 25_000;

/** Jitter range (±ms) added to reconnect delays to avoid thundering herd. */
const JITTER_MS = 500;

/** How often (ms) we flush the mutable metrics ref into React state. */
const METRICS_FLUSH_MS = 1_000;

/** How often (ms) we run the connection health check. */
const HEALTH_CHECK_MS = 5_000;

/** Maximum entries in the deduplication set before we start evicting oldest. */
const DEDUP_MAX_SIZE = 10_000;

/** Resolved emit option defaults. */
const EMIT_DEFAULTS = {
  requireAck: false,
  ackTimeout: 5_000,
  maxRetries: 3,
  queueIfDisconnected: true,
} as const;

// Events that are socket.io internal / engine-level — don't count as user messages.
const INTERNAL_EVENTS = new Set([
  'connect',
  'disconnect',
  'connect_error',
  'reconnect_attempt',
  'reconnect',
  'reconnect_error',
  'reconnect_failed',
  'ping',
  'pong',
  'upgrade',
  'open',
  'close',
  'error',
  'packet',
  'heartbeat',
  'request_replay',
]);

// =============================================================================
// Utility Helpers
// =============================================================================

/** Generate a compact unique ID for ack tracking. */
function generateMessageId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Calculate the reconnect delay for a given attempt number.
 *
 * Uses exponential backoff: `min(base * 2^(attempt-1), maxDelay)` then adds
 * random jitter in the range `[-JITTER_MS, +JITTER_MS]`.
 */
function calculateReconnectDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
): number {
  const exponential = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
  const jitter = Math.round((Math.random() * 2 - 1) * JITTER_MS);
  return Math.max(0, Math.round(exponential + jitter));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useHardenedWs(options: UseHardenedWsOptions): UseHardenedWsReturn {
  // ---------------------------------------------------------------------------
  // Destructure options with defaults
  // ---------------------------------------------------------------------------
  const {
    url,
    authToken,
    autoConnect = true,
    maxReconnectAttempts = 10,
    reconnectBaseDelay = 1000,
    reconnectMaxDelay = 30_000,
    enableReplay = true,
    pingInterval = DEFAULT_PING_INTERVAL,
    handlers = {},
  } = options;

  // ---------------------------------------------------------------------------
  // React State
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<ConnectionState>('disconnected');
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    reconnectAttempts: 0,
    lastError: null,
    connectionDuration: 0,
    queuedMessageCount: 0,
    isHealthy: true,
  });
  const [backpressureActive, setBackpressureActive] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // ---------------------------------------------------------------------------
  // Mutable Refs
  // ---------------------------------------------------------------------------
  const socketRef = useRef<Socket | null>(null);
  const stateRef = useRef<ConnectionState>('disconnected');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const pendingAcksRef = useRef<Map<string, PendingAck>>(new Map());
  const dedupSetRef = useRef<Set<string>>(new Set());
  const connectedAtRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(0);
  const mutableMetricsRef = useRef<MutableMetrics>({
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    lastError: null,
    isHealthy: true,
  });
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualDisconnectRef = useRef(false);
  const destroyedRef = useRef(false);
  const handlersRef = useRef(handlers);
  const optionsRef = useRef(options);

  // Keep refs in sync with latest values each render
  useEffect(() => {
    handlersRef.current = handlers;
    optionsRef.current = options;
  }, [handlers, options]);

  // ---------------------------------------------------------------------------
  // Helper: Transition connection state (ref + state)
  // ---------------------------------------------------------------------------
  const transitionState = useCallback((next: ConnectionState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // ---------------------------------------------------------------------------
  // Helper: Flush mutable metrics into React state
  // ---------------------------------------------------------------------------
  const flushMetrics = useCallback(() => {
    const m = mutableMetricsRef.current;
    setMetrics({
      totalMessagesSent: m.totalMessagesSent,
      totalMessagesReceived: m.totalMessagesReceived,
      reconnectAttempts: reconnectAttemptsRef.current,
      lastError: m.lastError,
      connectionDuration: connectedAtRef.current > 0 ? Date.now() - connectedAtRef.current : 0,
      queuedMessageCount: messageQueueRef.current.length,
      isHealthy: m.isHealthy,
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Helper: Start periodic metrics flush and health check timers
  // ---------------------------------------------------------------------------
  const startTimers = useCallback(() => {
    // Metrics flush — every 1 s
    flushTimerRef.current = setInterval(() => {
      flushMetrics();
    }, METRICS_FLUSH_MS);

    // Health check — every 5 s
    healthTimerRef.current = setInterval(() => {
      const socket = socketRef.current;
      if (!socket?.connected) return;

      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const unhealthyThreshold = pingInterval * 2;

      // Healthy if we just connected or recently heard from server
      const wasHealthy = mutableMetricsRef.current.isHealthy;
      const nowHealthy = lastActivityRef.current === 0 || elapsed < unhealthyThreshold;

      mutableMetricsRef.current.isHealthy = nowHealthy;

      // Immediately flush if health state changed
      if (wasHealthy !== nowHealthy) {
        flushMetrics();
      }
    }, HEALTH_CHECK_MS);
  }, [flushMetrics, pingInterval]);

  // ---------------------------------------------------------------------------
  // Helper: Clear all timers and pending acks
  // ---------------------------------------------------------------------------
  const clearAllTimers = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (healthTimerRef.current !== null) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
    if (flushTimerRef.current !== null) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingAcksRef.current.forEach((entry) => {
      clearTimeout(entry.timer);
    });
    pendingAcksRef.current.clear();
  }, []);

  // ---------------------------------------------------------------------------
  // Helper: Send a single message with optional ack tracking
  // ---------------------------------------------------------------------------
  const sendWithOptionalAck = useCallback(
    (socket: Socket, event: string, data: unknown, options?: EmitOptions) => {
      const opts = { ...EMIT_DEFAULTS, ...options };
      mutableMetricsRef.current.totalMessagesSent += 1;

      if (!opts.requireAck) {
        socket.emit(event, data);
        return;
      }

      // ---- Ack-tracked send ----
      const messageId = generateMessageId();

      const attemptSend = (remainingRetries: number) => {
        if (!socket.connected || destroyedRef.current) return;

        const timer = setTimeout(() => {
          // Ack timeout — retry if we have attempts left
          const ack = pendingAcksRef.current.get(messageId);
          if (!ack) return; // Already acknowledged

          if (remainingRetries > 0) {
            ack.retries += 1;
            attemptSend(remainingRetries - 1);
          } else {
            // Exhausted retries — remove and log
            pendingAcksRef.current.delete(messageId);
            mutableMetricsRef.current.lastError =
              `Ack timeout for "${event}" after ${opts.maxRetries} retries`;
            flushMetrics();
          }
        }, opts.ackTimeout);

        // Store/replace the pending entry
        const existing = pendingAcksRef.current.get(messageId);
        if (existing) clearTimeout(existing.timer);

        pendingAcksRef.current.set(messageId, {
          messageId,
          event,
          data,
          retries: (existing?.retries ?? 0),
          maxRetries: opts.maxRetries,
          ackTimeout: opts.ackTimeout,
          timer,
        });

        socket.emit(event, data, (_ackResponse: unknown) => {
          // Server acknowledged
          const entry = pendingAcksRef.current.get(messageId);
          if (entry) {
            clearTimeout(entry.timer);
            pendingAcksRef.current.delete(messageId);
          }
        });
      };

      attemptSend(opts.maxRetries);
    },
    [flushMetrics],
  );

  // ---------------------------------------------------------------------------
  // Helper: Flush the offline message queue to the server
  // ---------------------------------------------------------------------------
  const flushQueue = useCallback((socket: Socket) => {
    const queue = messageQueueRef.current;
    if (queue.length === 0) return;

    // Take all messages out atomically
    const toSend = queue.splice(0);

    for (const msg of toSend) {
      sendWithOptionalAck(socket, msg.event, msg.data, msg.options);
    }

    flushMetrics();
  }, [flushMetrics, sendWithOptionalAck]);

  // ---------------------------------------------------------------------------
  // Core: Create socket, attach handlers, connect
  // ---------------------------------------------------------------------------
  // Ref-based self-reference so nested scheduleReconnect can call us
  const createAndConnectRef = useRef<() => void>(() => {});

  const createAndConnect = useCallback(() => {
    // Guard: already connected or connecting
    if (socketRef.current?.connected) return;
    if (stateRef.current === 'connecting') return;

    // If a stale socket exists, clean it up first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear any lingering reconnect timer
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    transitionState('connecting');
    manualDisconnectRef.current = false;

    // ---- Create Socket.IO client ----
    const currentOptions = optionsRef.current;
    const socket = io(currentOptions.url, {
      auth: currentOptions.authToken ? { token: currentOptions.authToken } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection ourselves
      timeout: 10_000,
      forceNew: true,
    });

    socketRef.current = socket;

    // ---- Connection established ----
    socket.on('connect', () => {
      if (destroyedRef.current) {
        socket.disconnect();
        return;
      }

      transitionState('connected');
      reconnectAttemptsRef.current = 0;
      connectedAtRef.current = Date.now();
      lastActivityRef.current = Date.now();
      mutableMetricsRef.current.isHealthy = true;
      mutableMetricsRef.current.lastError = null;

      // Start background timers
      startTimers();
      flushMetrics();

      // Flush any queued offline messages
      flushQueue(socket);

      // Request message replay if enabled
      if (currentOptions.enableReplay !== false) {
        socket.emit('request_replay', { since: connectedAtRef.current });
      }
    });

    // ---- Disconnection ----
    socket.on('disconnect', (reason: string) => {
      if (destroyedRef.current) return;

      // Stop timers
      if (healthTimerRef.current !== null) {
        clearInterval(healthTimerRef.current);
        healthTimerRef.current = null;
      }
      if (flushTimerRef.current !== null) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      connectedAtRef.current = 0;
      mutableMetricsRef.current.isHealthy = true;
      flushMetrics();

      // Clear pending acks on disconnect
      pendingAcksRef.current.forEach((entry) => {
        clearTimeout(entry.timer);
      });
      pendingAcksRef.current.clear();

      // If the user explicitly disconnected, stay disconnected
      if (manualDisconnectRef.current) {
        transitionState('disconnected');
        return;
      }

      // Server-initiated disconnect — attempt reconnection
      // "io server disconnect" means the socket was forcibly closed by the server
      // and we should NOT attempt to reconnect until the user explicitly calls connect()
      if (reason === 'io server disconnect') {
        mutableMetricsRef.current.lastError = 'Server forced disconnect';
        transitionState('disconnected');
        flushMetrics();
        return;
      }

      // For all other reasons, attempt reconnect
      scheduleReconnect();
    });

    // ---- Connection error ----
    socket.on('connect_error', (err: Error) => {
      if (destroyedRef.current) return;

      mutableMetricsRef.current.lastError = err.message;
      flushMetrics();

      // If this was the initial connection (not a reconnect), start reconnect cycle
      if (stateRef.current === 'connecting') {
        scheduleReconnect();
      }
    });

    // ---- System events: Backpressure ----
    socket.on('backpressure_warning', (_data: unknown) => {
      setBackpressureActive(true);
    });

    socket.on('backpressure_resolved', () => {
      setBackpressureActive(false);
    });

    // ---- System events: Rate limiting ----
    socket.on('rate_limited', (_data: unknown) => {
      setRateLimited(true);
    });

    socket.on('rate_limit_resolved', () => {
      setRateLimited(false);
    });

    // ---- System events: Server shutdown ----
    socket.on('server_shutdown', (data: unknown) => {
      manualDisconnectRef.current = true;
      mutableMetricsRef.current.lastError =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message: unknown }).message)
          : 'Server is shutting down';
      transitionState('disconnected');
      flushMetrics();

      // Give the socket a moment then close cleanly
      setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      }, 500);
    });

    // ---- System events: Message replay ----
    socket.on('replay', (payload: unknown) => {
      // Deduplicate by message ID
      if (typeof payload === 'object' && payload !== null && 'id' in payload) {
        const id = String((payload as { id: unknown }).id);
        if (dedupSetRef.current.has(id)) return; // Already processed

        dedupSetRef.current.add(id);

        // Evict oldest entries if set grows too large
        if (dedupSetRef.current.size > DEDUP_MAX_SIZE) {
          const entries = Array.from(dedupSetRef.current);
          const toRemove = entries.slice(0, entries.length - DEDUP_MAX_SIZE + DEDUP_MAX_SIZE / 2);
          for (const entry of toRemove) {
            dedupSetRef.current.delete(entry);
          }
        }
      }

      // Dispatch to user handler
      const handler = handlersRef.current['replay'];
      if (handler) {
        try {
          handler(payload);
        } catch (err) {
          console.error('[useHardenedWs] Error in replay handler:', err);
        }
      }
    });

    socket.on('replay_complete', () => {
      const handler = handlersRef.current['replay_complete'];
      if (handler) {
        try {
          handler();
        } catch (err) {
          console.error('[useHardenedWs] Error in replay_complete handler:', err);
        }
      }
    });

    // ---- Catch-all: user handlers + metrics ----
    socket.onAny((event: string, ...args: unknown[]) => {
      // Update last activity for health monitoring
      lastActivityRef.current = Date.now();

      // Count as a received message (skip internal events)
      if (!INTERNAL_EVENTS.has(event)) {
        mutableMetricsRef.current.totalMessagesReceived += 1;
      }

      // Dispatch to user handlers
      const handler = handlersRef.current[event];
      if (typeof handler === 'function') {
        try {
          handler(...args);
        } catch (err) {
          console.error(`[useHardenedWs] Error in handler for "${event}":`, err);
        }
      }
    });

    // ---- Initiate connection ----
    socket.connect();

    // -----------------------------------------------------------------------
    // Reconnection scheduler (closes over refs, defined inside createAndConnect)
    // -----------------------------------------------------------------------
    function scheduleReconnect() {
      if (destroyedRef.current || manualDisconnectRef.current) return;

      const currentOpts = optionsRef.current;
      const maxAttempts = currentOpts.maxReconnectAttempts ?? 10;
      const baseDelay = currentOpts.reconnectBaseDelay ?? 1000;
      const maxDelay = currentOpts.reconnectMaxDelay ?? 30_000;

      reconnectAttemptsRef.current += 1;
      const attempt = reconnectAttemptsRef.current;

      if (attempt > maxAttempts) {
        transitionState('failed');
        mutableMetricsRef.current.lastError =
          `Max reconnect attempts (${maxAttempts}) exceeded`;
        flushMetrics();
        return;
      }

      transitionState('reconnecting');
      flushMetrics();

      const delay = calculateReconnectDelay(attempt, baseDelay, maxDelay);

      reconnectTimerRef.current = setTimeout(() => {
        if (destroyedRef.current || manualDisconnectRef.current) return;

        // Destroy the old socket
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        // Recursively create a new connection via ref
        createAndConnectRef.current();
      }, delay);
    }
  }, [transitionState, flushMetrics, startTimers, flushQueue, sendWithOptionalAck]);

  // Keep the ref in sync so scheduleReconnect can reach the latest version
  createAndConnectRef.current = createAndConnect;

  // ---------------------------------------------------------------------------
  // Public: connect()
  // ---------------------------------------------------------------------------
  const connect = useCallback(() => {
    if (destroyedRef.current) return;
    manualDisconnectRef.current = false;
    reconnectAttemptsRef.current = 0;
    createAndConnect();
  }, [createAndConnect]);

  // ---------------------------------------------------------------------------
  // Public: disconnect()
  // ---------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;

    // Clear reconnect timer
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Clear all pending acks
    pendingAcksRef.current.forEach((entry) => {
      clearTimeout(entry.timer);
    });
    pendingAcksRef.current.clear();

    // Stop background timers
    if (healthTimerRef.current !== null) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
    if (flushTimerRef.current !== null) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset state
    connectedAtRef.current = 0;
    lastActivityRef.current = 0;
    reconnectAttemptsRef.current = 0;
    transitionState('disconnected');

    mutableMetricsRef.current.totalMessagesSent = 0;
    mutableMetricsRef.current.totalMessagesReceived = 0;
    mutableMetricsRef.current.lastError = null;
    mutableMetricsRef.current.isHealthy = true;

    setBackpressureActive(false);
    setRateLimited(false);
    flushMetrics();
  }, [transitionState, flushMetrics]);

  // ---------------------------------------------------------------------------
  // Public: emit()
  // ---------------------------------------------------------------------------
  const emit = useCallback(
    (event: string, data: unknown, emitOptions?: EmitOptions) => {
      const socket = socketRef.current;
      const mergedOptions = { ...EMIT_DEFAULTS, ...emitOptions };

      if (socket?.connected) {
        sendWithOptionalAck(socket, event, data, mergedOptions);
        return;
      }

      // Not connected — queue if allowed
      if (!mergedOptions.queueIfDisconnected) {
        console.warn(
          `[useHardenedWs] Cannot emit "${event}" — socket is disconnected and queueIfDisconnected is false`,
        );
        return;
      }

      // Enqueue (respecting max queue size)
      const queue = messageQueueRef.current;
      if (queue.length >= MAX_QUEUE_SIZE) {
        // Drop oldest message to make room
        const dropped = queue.shift();
        console.warn(
          `[useHardenedWs] Offline queue full (${MAX_QUEUE_SIZE}), dropped oldest message: "${dropped?.event}"`,
        );
      }

      queue.push({
        event,
        data,
        options: mergedOptions,
        enqueuedAt: Date.now(),
      });

      flushMetrics();
    },
    [sendWithOptionalAck, flushMetrics],
  );

  // ---------------------------------------------------------------------------
  // Lifecycle: auto-connect + cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    destroyedRef.current = false;

    if (autoConnect) {
      createAndConnect();
    }

    return () => {
      destroyedRef.current = true;
      manualDisconnectRef.current = true;

      // Clear every timer
      clearAllTimers();

      // Disconnect and clean up socket
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Reset refs that persist across strict-mode re-mounts
      connectedAtRef.current = 0;
      lastActivityRef.current = 0;
      reconnectAttemptsRef.current = 0;
      messageQueueRef.current = [];
      dedupSetRef.current.clear();

      mutableMetricsRef.current.totalMessagesSent = 0;
      mutableMetricsRef.current.totalMessagesReceived = 0;
      mutableMetricsRef.current.lastError = null;
      mutableMetricsRef.current.isHealthy = true;
    };
  }, [autoConnect, createAndConnect, clearAllTimers]);

  // ---------------------------------------------------------------------------
  // Return value
  // ---------------------------------------------------------------------------
  return {
    // eslint-disable-next-line react-hooks/refs -- socket ref is safe to expose; reading .current during render is intentional
    socket: socketRef.current as Socket | null,
    state,
    isConnected: state === 'connected',
    metrics,
    backpressureActive,
    rateLimited,
    lastError: metrics.lastError,
    reconnectAttempts: metrics.reconnectAttempts,
    connect,
    disconnect,
    emit,
  };
}

export default useHardenedWs;
