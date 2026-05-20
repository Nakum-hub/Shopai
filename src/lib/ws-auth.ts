// =============================================================================
// WebSocket Authentication Hardening
// =============================================================================
// Provides JWT-based authentication for Socket.IO WebSocket connections:
//
// 1. Token creation with HMAC-SHA256 signing (no external dependencies)
// 2. Token verification and expiry checking
// 3. Socket.IO middleware for auth enforcement
// 4. Connection rate limiting (max connections per sessionId, max messages/min)
// 5. Configurable server creation helper with auth middleware attached
//
// TOKEN FORMAT: base64url(header).base64url(payload).base64url(signature)
// Uses node:crypto for all cryptographic operations — zero external deps.
// =============================================================================

import crypto from 'node:crypto';

// =============================================================================
// Types & Interfaces
// =============================================================================

/** Configuration options for WebSocket authentication. */
export interface WsAuthConfig {
  /** Secret key for HMAC-SHA256 token signing. Falls back to env var or random. */
  jwtSecret: string;
  /** Token expiry in seconds (default: 3600 = 1 hour). */
  tokenExpirySeconds: number;
  /** Allowed origins for WebSocket connections. */
  allowedOrigins: string[];
  /** Maximum concurrent WebSocket connections per sessionId (default: 10). */
  maxConnectionsPerSession: number;
  /** Maximum messages per minute per connection (default: 100). */
  maxMessagesPerMinute: number;
}

/** Parsed JWT token parts. */
export interface WsTokenPayload {
  /** The session ID this token authenticates */
  sessionId: string;
  /** Token creation timestamp (Unix seconds) */
  iat: number;
  /** Token expiration timestamp (Unix seconds) */
  exp: number;
  /** Additional custom claims */
  [key: string]: unknown;
}

/** Result of token verification. */
export interface WsTokenVerifyResult {
  /** Whether the token is valid */
  valid: boolean;
  /** The authenticated session ID (if valid) */
  sessionId?: string;
  /** The decoded payload (if valid) */
  payload?: WsTokenPayload;
  /** Error description (if invalid) */
  error?: string;
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: WsAuthConfig = {
  jwtSecret: process.env.WS_JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  tokenExpirySeconds: 3600, // 1 hour
  allowedOrigins: process.env.WS_ALLOWED_ORIGINS
    ? process.env.WS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['*'],
  maxConnectionsPerSession: 10,
  maxMessagesPerMinute: 100,
};

// =============================================================================
// Connection & Message Rate Limiting (In-Memory)
// =============================================================================

/** Tracks active connections per sessionId. */
const sessionConnections = new Map<string, Set<string>>();

/** Tracks message counts per connection for rate limiting. */
const connectionMessageCounts = new Map<string, { count: number; resetAt: number }>();

/**
 * Register a new WebSocket connection for rate limiting.
 * Returns true if the connection is allowed, false if the session has
 * exceeded the maximum concurrent connection limit.
 *
 * @param sessionId - The session ID of the connecting client
 * @param socketId - The unique socket ID
 */
export function registerConnection(sessionId: string, socketId: string): boolean {
  if (!sessionConnections.has(sessionId)) {
    sessionConnections.set(sessionId, new Set());
  }

  const connections = sessionConnections.get(sessionId)!;

  if (connections.size >= DEFAULT_CONFIG.maxConnectionsPerSession) {
    return false;
  }

  connections.add(socketId);
  return true;
}

/**
 * Unregister a WebSocket connection when it disconnects.
 *
 * @param sessionId - The session ID of the disconnecting client
 * @param socketId - The unique socket ID
 */
export function unregisterConnection(sessionId: string, socketId: string): void {
  const connections = sessionConnections.get(sessionId);
  if (connections) {
    connections.delete(socketId);
    if (connections.size === 0) {
      sessionConnections.delete(sessionId);
    }
  }

  connectionMessageCounts.delete(socketId);
}

/**
 * Check and increment the message counter for a connection.
 * Returns true if the message is allowed, false if rate limited.
 *
 * @param socketId - The unique socket ID
 * @returns Whether the message should be processed
 */
export function checkMessageRateLimit(socketId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute

  let entry = connectionMessageCounts.get(socketId);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    connectionMessageCounts.set(socketId, entry);
  }

  entry.count += 1;

  return entry.count <= DEFAULT_CONFIG.maxMessagesPerMinute;
}

/**
 * Get the current connection count for a session.
 *
 * @param sessionId - The session ID to check
 */
export function getSessionConnectionCount(sessionId: string): number {
  return sessionConnections.get(sessionId)?.size || 0;
}

// =============================================================================
// JWT Token Operations (HMAC-SHA256, No External Dependencies)
// =============================================================================

/** JWT header used for all tokens. */
const JWT_HEADER = { alg: 'HS256', typ: 'JWT' };

/** Base64url-encoded JWT header (static, computed once). */
const ENCODED_HEADER = Buffer.from(JSON.stringify(JWT_HEADER))
  .toString('base64url');

/**
 * Create an HMAC-SHA256 signed JWT token for WebSocket authentication.
 *
 * @param sessionId - The session ID to embed in the token
 * @param payload - Optional additional claims to include in the token
 * @param config - Optional auth config override
 * @returns The encoded JWT string
 *
 * @example
 * ```ts
 * const token = createWsAuthToken('user-session-123', { role: 'admin' });
 * // Send this token to the client via an API response
 * ```
 */
export function createWsAuthToken(
  sessionId: string,
  payload?: Record<string, unknown>,
  config?: Partial<WsAuthConfig>
): string {
  const secret = config?.jwtSecret || DEFAULT_CONFIG.jwtSecret;
  const expirySeconds = config?.tokenExpirySeconds || DEFAULT_CONFIG.tokenExpirySeconds;

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload: WsTokenPayload = {
    sessionId,
    iat: now,
    exp: now + expirySeconds,
    ...payload,
  };

  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

/**
 * Verify a WebSocket JWT token.
 *
 * @param token - The JWT string to verify
 * @param config - Optional auth config override
 * @returns Verification result with validity status and decoded data
 */
export function verifyWsAuthToken(
  token: string,
  config?: Partial<WsAuthConfig>
): WsTokenVerifyResult {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is empty or not a string' };
    }

    const secret = config?.jwtSecret || DEFAULT_CONFIG.jwtSecret;
    const parts = token.split('.');

    if (parts.length !== 3) {
      return { valid: false, error: 'Token must have 3 parts (header.payload.signature)' };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    // Verify signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signingInput)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(encodedSignature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid token signature' };
    }

    // Decode payload
    let payload: WsTokenPayload;
    try {
      const decoded = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      payload = JSON.parse(decoded) as WsTokenPayload;
    } catch {
      return { valid: false, error: 'Failed to decode token payload' };
    }

    // Check required fields
    if (!payload.sessionId || typeof payload.sessionId !== 'string') {
      return { valid: false, error: 'Token is missing required sessionId claim' };
    }

    // Check expiration
    if (!payload.exp || typeof payload.exp !== 'number') {
      return { valid: false, error: 'Token is missing expiration claim' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      return {
        valid: false,
        error: `Token expired at ${new Date(payload.exp * 1000).toISOString()}`,
      };
    }

    // Check issued-at (reject tokens issued more than 5 minutes in the future — clock skew)
    if (payload.iat && typeof payload.iat === 'number') {
      const maxClockSkew = 300; // 5 minutes
      if (payload.iat > now + maxClockSkew) {
        return { valid: false, error: 'Token was issued in the future (clock skew too large)' };
      }
    }

    return {
      valid: true,
      sessionId: payload.sessionId,
      payload,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Unexpected error during verification: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// =============================================================================
// Socket.IO Authentication Middleware
// =============================================================================

/**
 * Socket.IO middleware function for WebSocket authentication.
 *
 * Extracts and verifies JWT token from:
 * 1. `handshake.auth.token` (recommended — pass as `{ auth: { token } }` in client)
 * 2. `handshake.headers.authorization` (fallback — `Bearer <token>`)
 *
 * On successful verification:
 * - Attaches `sessionId` and `payload` to `socket.data`
 * - Registers the connection for rate limiting
 *
 * On failure:
 * - Rejects the connection with an error message
 * - Does not register the connection
 *
 * @param socket - The Socket.IO socket instance
 * @param next - Callback to proceed or reject the connection
 */
export function wsAuthMiddleware(
  socket: any,
  next: (err?: Error) => void
): void {
  try {
    // Extract token from handshake.auth.token or Authorization header
    let token: string | undefined;

    if (socket.handshake?.auth?.token) {
      token = typeof socket.handshake.auth.token === 'string'
        ? socket.handshake.auth.token
        : undefined;
    }

    if (!token && socket.handshake?.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return next(new Error('Authentication required: no token provided'));
    }

    // Verify the token
    const result = verifyWsAuthToken(token);

    if (!result.valid) {
      console.warn(
        `[WS-Auth] Token verification failed for socket ${socket.id}: ${result.error}`
      );
      return next(new Error(`Authentication failed: ${result.error}`));
    }

    if (!result.sessionId || !result.payload) {
      return next(new Error('Authentication failed: invalid token payload'));
    }

    // Check connection rate limit
    if (!registerConnection(result.sessionId, socket.id)) {
      console.warn(
        `[WS-Auth] Session ${result.sessionId} exceeded max connections (${DEFAULT_CONFIG.maxConnectionsPerSession})`
      );
      return next(
        new Error(
          `Too many concurrent connections (max: ${DEFAULT_CONFIG.maxConnectionsPerSession})`
        )
      );
    }

    // Attach auth data to socket
    socket.data.sessionId = result.sessionId;
    socket.data.authPayload = result.payload;
    socket.data.authenticatedAt = Date.now();

    console.log(
      `[WS-Auth] Socket ${socket.id} authenticated for session ${result.sessionId}`
    );

    // Clean up on disconnect
    socket.on('disconnect', () => {
      unregisterConnection(result.sessionId!, socket.id);
    });

    // Message rate limiting
    socket.use((packet: any, nextFn: (err?: Error) => void) => {
      if (!checkMessageRateLimit(socket.id)) {
        console.warn(
          `[WS-Auth] Socket ${socket.id} exceeded message rate limit (${DEFAULT_CONFIG.maxMessagesPerMinute}/min)`
        );
        return nextFn(new Error('Message rate limit exceeded'));
      }
      nextFn();
    });

    next();
  } catch (err) {
    console.error('[WS-Auth] Unexpected error in auth middleware:', err);
    next(new Error('Internal authentication error'));
  }
}

// =============================================================================
// Server Configuration Helper
// =============================================================================

/**
 * Create Socket.IO server options with auth middleware and CORS configured.
 *
 * @param options - Partial WsAuthConfig overrides
 * @returns Options object suitable for passing to `new Server(httpServer, options)`
 *
 * @example
 * ```ts
 * import { createServer } from 'http';
 * import { Server } from 'socket.io';
 * import { createWsServerConfig } from '@/lib/ws-auth';
 *
 * const httpServer = createServer();
 * const io = new Server(httpServer, createWsServerConfig());
 * ```
 */
export function createWsServerConfig(options?: Partial<WsAuthConfig>): Record<string, unknown> {
  const config: WsAuthConfig = { ...DEFAULT_CONFIG, ...options };

  const corsOrigins =
    config.allowedOrigins[0] === '*'
      ? true
      : config.allowedOrigins;

  return {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'X-CSRF-Token'],
      credentials: true,
    },
    // Attach the auth middleware
    // Note: In Socket.IO, middleware is added via io.use() after server creation.
    // This config object includes the middleware reference for convenience.
    _authMiddleware: wsAuthMiddleware,
    _config: config,
  };
}

// =============================================================================
// Cleanup
// =============================================================================

/**
 * Cleanup stale message rate limit entries.
 * Called automatically every 5 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [socketId, entry] of connectionMessageCounts) {
    if (entry.resetAt <= now) {
      connectionMessageCounts.delete(socketId);
    }
  }
}, 5 * 60_000);

/**
 * Get diagnostics about current WebSocket connections.
 * Useful for monitoring and debugging.
 */
export function getWsAuthDiagnostics(): {
  activeSessions: number;
  totalConnections: number;
  connectionsBySession: Record<string, number>;
  rateLimitedConnections: number;
} {
  let totalConnections = 0;
  const connectionsBySession: Record<string, number> = {};

  for (const [sessionId, connections] of sessionConnections) {
    const count = connections.size;
    totalConnections += count;
    connectionsBySession[sessionId] = count;
  }

  const now = Date.now();
  let rateLimitedConnections = 0;
  for (const [, entry] of connectionMessageCounts) {
    if (entry.count > DEFAULT_CONFIG.maxMessagesPerMinute && entry.resetAt > now) {
      rateLimitedConnections++;
    }
  }

  return {
    activeSessions: sessionConnections.size,
    totalConnections,
    connectionsBySession,
    rateLimitedConnections,
  };
}
