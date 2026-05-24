import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

// =============================================================================
// WebSocket JWT Token Issuance Endpoint
// =============================================================================
// Issues short-lived JWT tokens for WebSocket authentication.
// Uses the same HMAC-SHA256 signing as ws-gateway and ws-auth.ts.
//
// POST /api/ws-token
//   Body: { sessionId?: string, capabilities?: string[] }
//   Returns: { token: string, expiresAt: number, sessionId: string }
//
// GET /api/ws-token/public
//   Returns: { token: string, expiresAt: number, sessionId: string }
//   Issues a public (anonymous) token for the /public namespace.
// =============================================================================

const JWT_SECRET = process.env.WS_JWT_SECRET || 'storecraft-ws-gateway-secret-2024';
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour
const PUBLIC_TOKEN_EXPIRY_SECONDS = 1800; // 30 minutes for public tokens

// JWT header (static, computed once)
const ENCODED_HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

interface TokenPayload {
  sessionId: string;
  iat: number;
  exp: number;
  capabilities?: string[];
  [key: string]: unknown;
}

/**
 * Create an HMAC-SHA256 signed JWT token.
 * Zero external dependencies — uses only node:crypto.
 */
function createJwtToken(
  sessionId: string,
  expirySeconds: number,
  extra?: Record<string, unknown>
): { token: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sessionId,
    iat: now,
    exp: now + expirySeconds,
    ...extra,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${ENCODED_HEADER}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url');

  return {
    token: `${signingInput}.${signature}`,
    expiresAt: (now + expirySeconds) * 1000,
  };
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `sess-${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Validate session ID format (prevent injection).
 */
function isValidSessionId(sessionId: string): boolean {
  return typeof sessionId === 'string' &&
    sessionId.length >= 4 &&
    sessionId.length <= 128 &&
    /^[a-zA-Z0-9_\-:.]+$/.test(sessionId);
}

// POST /api/ws-token — Issue an authenticated WS token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId: providedSessionId, capabilities } = body as {
      sessionId?: string;
      capabilities?: string[];
    };

    // Validate or generate session ID
    const sessionId = providedSessionId && isValidSessionId(providedSessionId)
      ? providedSessionId
      : generateSessionId();

    // Validate capabilities (if provided)
    let validatedCapabilities: string[] | undefined;
    if (Array.isArray(capabilities)) {
      const allowedCapabilities = new Set([
        'generation',
        'chat',
        'monitoring',
        'voice',
        'admin',
      ]);
      validatedCapabilities = capabilities
        .filter((c) => typeof c === 'string' && allowedCapabilities.has(c))
        .slice(0, 10); // Max 10 capabilities
    }

    const { token, expiresAt } = createJwtToken(sessionId, TOKEN_EXPIRY_SECONDS, {
      ...(validatedCapabilities ? { capabilities: validatedCapabilities } : {}),
      issuer: 'storecraft-api',
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      sessionId,
      expiresIn: TOKEN_EXPIRY_SECONDS,
      capabilities: validatedCapabilities || ['generation', 'chat'],
    });
  } catch (error) {
    console.error('[WS-Token] Error issuing token:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to issue WebSocket token',
      },
      { status: 500 }
    );
  }
}

// GET /api/ws-token — Issue a public (anonymous) WS token
export async function GET() {
  try {
    const sessionId = `anon-${generateSessionId()}`;

    const { token, expiresAt } = createJwtToken(sessionId, PUBLIC_TOKEN_EXPIRY_SECONDS, {
      isPublic: true,
      capabilities: ['public'],
      issuer: 'storecraft-api',
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      sessionId,
      expiresIn: PUBLIC_TOKEN_EXPIRY_SECONDS,
      capabilities: ['public'],
    });
  } catch (error) {
    console.error('[WS-Token] Error issuing public token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to issue public WebSocket token' },
      { status: 500 }
    );
  }
}
