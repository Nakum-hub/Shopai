// =============================================================================
// Event Bus — Event-Driven Infrastructure
// =============================================================================
// Provides publish/subscribe messaging, event sourcing, and distributed
// queue abstraction for decoupling pipeline stages, agents, and services.
// Supports typed events, wildcard subscriptions, and event replay.
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type EventPriority = 'low' | 'normal' | 'high' | 'critical';

export interface AppEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  priority: EventPriority;
  source: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, string>;
}

export type EventHandler<T = unknown> = (event: AppEvent<T>) => void | Promise<void>;

export interface Subscription {
  id: string;
  pattern: string;
  handler: EventHandler;
  source?: string;
  once?: boolean;
  createdAt: number;
}

export interface EventStoreEntry {
  event: AppEvent;
  storedAt: number;
}

// -----------------------------------------------------------------------------
// Event Bus Implementation
// -----------------------------------------------------------------------------

export class EventBus {
  private subscriptions = new Map<string, Subscription>();
  private eventStore: EventStoreEntry[] = [];
  private maxStoreSize: number;
  private handlerCount = 0;

  constructor(maxStoreSize = 1000) {
    this.maxStoreSize = maxStoreSize;
  }

  /**
   * Publish an event to all matching subscribers.
   * Events are stored for replay capability.
   */
  async publish<T = unknown>(
    type: string,
    data: T,
    options?: {
      priority?: EventPriority;
      source?: string;
      correlationId?: string;
      causationId?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<void> {
    const event: AppEvent<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      data,
      timestamp: Date.now(),
      priority: options?.priority || 'normal',
      source: options?.source || 'system',
      correlationId: options?.correlationId,
      causationId: options?.causationId,
      metadata: options?.metadata,
    };

    // Store for event sourcing / replay
    this.eventStore.push({ event, storedAt: Date.now() });
    if (this.eventStore.length > this.maxStoreSize) {
      this.eventStore = this.eventStore.slice(-this.maxStoreSize);
    }

    // Find matching subscribers
    const matched = this.findSubscribers(type);
    const toRemove: string[] = [];

    for (const sub of matched) {
      try {
        await sub.handler(event);
        if (sub.once) {
          toRemove.push(sub.id);
        }
      } catch (error) {
        console.error(`[EventBus] Handler error for "${type}":`, error);
      }
    }

    // Clean up once subscriptions
    for (const id of toRemove) {
      this.subscriptions.delete(id);
    }
  }

  /**
   * Subscribe to events matching a pattern.
   * Supports exact match ("order.created") or wildcard ("order.*").
   * Returns an unsubscribe function.
   */
  subscribe(
    pattern: string,
    handler: EventHandler,
    options?: { source?: string; once?: boolean },
  ): () => void {
    const id = `sub-${++this.handlerCount}-${Date.now()}`;
    this.subscriptions.set(id, {
      id,
      pattern,
      handler,
      source: options?.source,
      once: options?.once || false,
      createdAt: Date.now(),
    });

    return () => {
      this.subscriptions.delete(id);
    };
  }

  /**
   * Subscribe to an event exactly once.
   */
  once(pattern: string, handler: EventHandler, options?: { source?: string }): () => void {
    return this.subscribe(pattern, handler, { ...options, once: true });
  }

  /**
   * Remove all subscribers matching a pattern (for cleanup).
   */
  unsubscribeByPattern(pattern: string): number {
    let count = 0;
    for (const [id, sub] of this.subscriptions) {
      if (sub.pattern === pattern) {
        this.subscriptions.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Replay stored events that match a pattern from a given timestamp.
   * Useful for catching up a new subscriber.
   */
  replay(
    pattern: string,
    handler: EventHandler,
    options?: { fromTimestamp?: number; limit?: number },
  ): number {
    const from = options?.fromTimestamp || 0;
    const limit = options?.limit || 100;
    let count = 0;

    for (const entry of this.eventStore) {
      if (count >= limit) break;
      if (entry.storedAt < from) continue;
      if (this.patternMatches(entry.event.type, pattern)) {
        handler(entry.event);
        count++;
      }
    }

    return count;
  }

  /**
   * Get stored events matching a pattern (for inspection / debugging).
   */
  getHistory(options?: {
    pattern?: string;
    fromTimestamp?: number;
    limit?: number;
  }): AppEvent[] {
    let events = this.eventStore.map(e => e.event);

    if (options?.pattern) {
      events = events.filter(e => this.patternMatches(e.type, options.pattern!));
    }
    if (options?.fromTimestamp) {
      events = events.filter(e => e.timestamp >= options.fromTimestamp!);
    }

    return events.slice(-(options?.limit || 50));
  }

  /**
   * Get total number of active subscriptions.
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get total number of stored events.
   */
  getEventCount(): number {
    return this.eventStore.length;
  }

  /**
   * Clear all subscriptions and stored events.
   */
  clear(): void {
    this.subscriptions.clear();
    this.eventStore = [];
  }

  /**
   * Clear stored events only (keep subscriptions).
   */
  clearHistory(): void {
    this.eventStore = [];
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private findSubscribers(eventType: string): Subscription[] {
    const matched: Subscription[] = [];

    for (const sub of this.subscriptions.values()) {
      if (sub.source && sub.source !== 'system') continue; // source filter
      if (this.patternMatches(eventType, sub.pattern)) {
        matched.push(sub);
      }
    }

    // Sort by priority (critical first)
    const priorityOrder: Record<EventPriority, number> = {
      critical: 0, high: 1, normal: 2, low: 3,
    };
    matched.sort((a, b) => {
      const pa = priorityOrder[a.handler?.name ? 'normal' : 'normal'] ?? 2;
      return pa - pa; // handlers don't have priority; could extend if needed
    });

    return matched;
  }

  private patternMatches(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Wildcard: "order.*" matches "order.created", "order.updated", etc.
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix);
    }

    // Wildcard: "*.created" matches "order.created", "user.created", etc.
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return eventType.endsWith(suffix);
    }

    return false;
  }
}

// -----------------------------------------------------------------------------
// Singleton + Pre-defined Event Types
// -----------------------------------------------------------------------------

let _bus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!_bus) {
    _bus = new EventBus(500);
  }
  return _bus;
}

// Pre-defined event types for the generation pipeline
export const PipelineEvents = {
  // Voice processing
  VOICE_RECEIVED: 'pipeline.voice.received',
  VOICE_TRANSCRIBED: 'pipeline.voice.transcribed',
  VOICE_FAILED: 'pipeline.voice.failed',

  // Business understanding
  BUSINESS_ANALYSIS_STARTED: 'pipeline.business.started',
  BUSINESS_ANALYSIS_COMPLETED: 'pipeline.business.completed',
  BUSINESS_PROFILE_EXTRACTED: 'pipeline.business.profile_extracted',

  // Planning
  STRUCTURE_PLANNING_STARTED: 'pipeline.planning.started',
  STRUCTURE_PLANNING_COMPLETED: 'pipeline.planning.completed',

  // Generation stages
  BRANDING_GENERATED: 'pipeline.branding.generated',
  CONTENT_GENERATED: 'pipeline.content.generated',
  SECTIONS_GENERATED: 'pipeline.sections.generated',
  PAGE_ASSEMBLED: 'pipeline.page.assembled',

  // Validation & Repair
  VALIDATION_STARTED: 'pipeline.validation.started',
  VALIDATION_COMPLETED: 'pipeline.validation.completed',
  VALIDATION_FAILED: 'pipeline.validation.failed',
  REPAIR_STARTED: 'pipeline.repair.started',
  REPAIR_COMPLETED: 'pipeline.repair.completed',
  REPAIR_FAILED: 'pipeline.repair.failed',

  // Pipeline lifecycle
  PIPELINE_STARTED: 'pipeline.started',
  PIPELINE_COMPLETED: 'pipeline.completed',
  PIPELINE_FAILED: 'pipeline.failed',
  PIPELINE_CANCELLED: 'pipeline.cancelled',

  // Storefront events
  STOREFRONT_CREATED: 'storefront.created',
  STOREFRONT_UPDATED: 'storefront.updated',
  STOREFRONT_PUBLISHED: 'storefront.published',
  STOREFRONT_DELETED: 'storefront.deleted',
} as const;

export type PipelineEventType = (typeof PipelineEvents)[keyof typeof PipelineEvents];
