// =============================================================================
// Semantic Memory System
// =============================================================================
// Persistent memory for business profiles, user preferences, generation
// insights, and conversation facts. Uses SQLite + Prisma for durability.
// =============================================================================

import { db } from '@/lib/db';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface MemoryRecord {
  id: string;
  sessionId: string;
  category: 'business_profile' | 'user_preference' | 'generation_insight' | 'conversation_fact';
  key: string;
  value: string;
  confidence: number;
  source: 'voice' | 'chat' | 'generation' | 'system';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreMemoryOptions {
  source?: 'voice' | 'chat' | 'generation' | 'system';
  confidence?: number;
  expiresAt?: Date;
}

// Valid category values
const VALID_CATEGORIES = [
  'business_profile',
  'user_preference',
  'generation_insight',
  'conversation_fact',
] as const;

const VALID_SOURCES = ['voice', 'chat', 'generation', 'system'] as const;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Check if a memory has expired (or null = never expires) */
function isExpired(memory: { expiresAt: Date | null }): boolean {
  if (!memory.expiresAt) return false;
  return new Date(memory.expiresAt) < new Date();
}

/** Tokenize a string into lowercase searchable terms */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

/** Compute a simple relevance score between query tokens and a memory's key+value */
function computeRelevance(queryTokens: string[], memory: MemoryRecord): number {
  const keyTokens = tokenize(memory.key);
  const valueTokens = tokenize(memory.value);
  const allTokens = [...keyTokens, ...valueTokens];

  let matches = 0;
  for (const qt of queryTokens) {
    for (const at of allTokens) {
      if (at.includes(qt) || qt.includes(at)) {
        matches++;
        break;
      }
    }
  }

  // Normalize: matches / queryTokens, weighted by confidence
  const termScore = queryTokens.length > 0 ? matches / queryTokens.length : 0;
  return termScore * memory.confidence;
}

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

/**
 * Store a new memory or update an existing one (upsert by sessionId + key).
 * Automatically cleans up expired memories before writing.
 */
export async function storeMemory(
  sessionId: string,
  category: string,
  key: string,
  value: string,
  options?: StoreMemoryOptions,
): Promise<MemoryRecord> {
  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    throw new Error(`Invalid memory category: ${category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  const source = (options?.source && VALID_SOURCES.includes(options.source) ? options.source : 'system') as MemoryRecord['source'];
  const confidence = Math.max(0, Math.min(1, options?.confidence ?? 1.0));
  const expiresAt = options?.expiresAt ?? null;

  const memory = await db.semanticMemory.upsert({
    where: {
      sessionId_key: { sessionId, key },
    },
    create: {
      sessionId,
      category,
      key,
      value,
      confidence,
      source,
      expiresAt,
    },
    update: {
      value,
      confidence,
      source,
      expiresAt,
    },
  });

  return memory as unknown as MemoryRecord;
}

/**
 * Recall all memories for a session in a given category.
 * Filters out expired memories.
 */
export async function recallByCategory(
  sessionId: string,
  category: string,
): Promise<MemoryRecord[]> {
  const memories = await db.semanticMemory.findMany({
    where: { sessionId, category },
    orderBy: { updatedAt: 'desc' },
  });

  return (memories as unknown as MemoryRecord[]).filter(m => !isExpired(m));
}

/**
 * Search memories by relevance to a query string.
 * Uses simple token matching across key + value fields.
 * Returns results sorted by relevance score descending.
 */
export async function searchMemories(
  sessionId: string,
  query: string,
): Promise<Array<MemoryRecord & { relevance: number }>> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const memories = await db.semanticMemory.findMany({
    where: { sessionId },
    orderBy: { updatedAt: 'desc' },
  });

  const scored = (memories as unknown as MemoryRecord[])
    .filter(m => !isExpired(m))
    .map(m => ({ ...m, relevance: computeRelevance(queryTokens, m) }))
    .filter(m => m.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  return scored;
}

/**
 * Assemble a complete business profile from stored memory fragments.
 * Gathers all 'business_profile' memories and merges them into an object.
 * Handles JSON-encoded values for nested objects (e.g., products, services, style).
 */
export async function assembleBusinessProfile(
  sessionId: string,
): Promise<Record<string, unknown> | null> {
  const memories = await recallByCategory(sessionId, 'business_profile');
  if (memories.length === 0) return null;

  const profile: Record<string, unknown> = {};

  for (const memory of memories) {
    // Try to parse the value as JSON for nested structures
    try {
      const parsed = JSON.parse(memory.value);
      profile[memory.key] = parsed;
    } catch {
      // Plain string value
      profile[memory.key] = memory.value;
    }
  }

  return profile;
}

/**
 * Consolidate new business profile data into existing memories.
 * For each key in the profile, storeMemory is called (upsert).
 * Handles nested objects by JSON-serializing them.
 */
export async function consolidateProfile(
  sessionId: string,
  profile: Record<string, unknown>,
  options?: StoreMemoryOptions,
): Promise<void> {
  const entries = Object.entries(profile);
  if (entries.length === 0) return;

  const operations = entries.map(([key, value]) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    return storeMemory(sessionId, 'business_profile', key, stringValue, options);
  });

  await Promise.all(operations);
}

/**
 * Get all unique session IDs that have stored memories.
 */
export async function getMemorySessions(): Promise<string[]> {
  const sessions = await db.semanticMemory.findMany({
    distinct: ['sessionId'],
    select: { sessionId: true },
    orderBy: { updatedAt: 'desc' },
  });

  return sessions.map(s => s.sessionId);
}

/**
 * Delete all memories for a session.
 */
export async function clearSessionMemories(sessionId: string): Promise<number> {
  const result = await db.semanticMemory.deleteMany({
    where: { sessionId },
  });
  return result.count;
}

/**
 * Delete a specific memory by key within a session.
 */
export async function deleteMemory(sessionId: string, key: string): Promise<boolean> {
  try {
    await db.semanticMemory.delete({
      where: { sessionId_key: { sessionId, key } },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get memory statistics for a session.
 */
export async function getMemoryStats(sessionId: string): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  avgConfidence: number;
}> {
  const memories = await db.semanticMemory.findMany({
    where: { sessionId },
  });

  const active = memories.filter(m => !isExpired(m as unknown as MemoryRecord));

  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let totalConfidence = 0;

  for (const m of active) {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    bySource[m.source] = (bySource[m.source] || 0) + 1;
    totalConfidence += m.confidence;
  }

  return {
    total: active.length,
    byCategory,
    bySource,
    avgConfidence: active.length > 0 ? parseFloat((totalConfidence / active.length).toFixed(2)) : 0,
  };
}
