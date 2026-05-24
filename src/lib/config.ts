/**
 * @module config
 * @description Centralized, typed configuration management for StoreCraft AI.
 *
 * Reads configuration from environment variables with sensible defaults and
 * runtime validation. The config is loaded once and frozen (deep-readonly)
 * to prevent accidental mutation.
 *
 * Usage:
 * ```ts
 * import { getConfig, isDevelopment } from '@/lib/config';
 *
 * const config = getConfig();
 * console.log(config.app.name);
 * if (isDevelopment()) { ... }
 * ```
 */

// =============================================================================
// Configuration Schema Types
// =============================================================================

/** Application core settings. */
export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production' | 'test';
  debug: boolean;
  port: number;
}

/** Database connection settings. */
export interface DatabaseConfig {
  url: string;
  poolSize: number;
  timeoutMs: number;
}

/** Redis connection settings. */
export interface RedisConfig {
  url: string;
  keyPrefix: string;
}

/** LLM (Language Model) settings. */
export interface LlmConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

/** Per-endpoint rate limit configuration (requests per minute). */
export interface RateLimitsConfig {
  chat: number;
  generate: number;
  voice: number;
  api: number;
  storefront: number;
  bi: number;
  extract: number;
}

/** Security-related settings. */
export interface SecurityConfig {
  corsOrigins: string[];
  csrfEnabled: boolean;
  maxPayloadSizeBytes: number;
  apiMaxPayloadSizeBytes: number;
  voiceMaxPayloadSizeBytes: number;
}

/** Background queue settings. */
export interface QueueConfig {
  concurrency: number;
  retryAttempts: number;
}

/** Cache TTL settings (in seconds). */
export interface CacheConfig {
  defaultTtl: number;
  analyticsTtl: number;
  templateTtl: number;
  sessionTtl: number;
}

/** Feature flag configuration. */
export interface FeatureFlags {
  /** Whether a feature is enabled. Keys are feature names. */
  enabled: (feature: string) => boolean;
  /** List of all feature flag names. */
  list: () => string[];
}

/** Root configuration object combining all sections. */
export interface AppConfigRoot {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  llm: LlmConfig;
  rateLimits: RateLimitsConfig;
  security: SecurityConfig;
  queues: QueueConfig;
  cache: CacheConfig;
  featureFlags: FeatureFlags;
}

// =============================================================================
// Environment Variable Parsing Helpers
// =============================================================================

/** Parse a string env var, with a fallback default. */
function envString(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

/** Parse a numeric env var, with a fallback default. */
function envNumber(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (raw === undefined || raw === '') return fallback;
  const num = Number(raw);
  return Number.isNaN(num) ? fallback : num;
}

/** Parse a boolean env var ('true' / '1' → true, else false). */
function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return fallback;
}

/** Parse a comma-separated list of strings. */
function envStringList(key: string, fallback: string[]): string[] {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

// =============================================================================
// Configuration Loader
// =============================================================================

/** Cached, frozen config instance. */
let _config: AppConfigRoot | null = null;

/** Parsed feature flags from FEATURE_FLAGS env var. */
let _featureFlags: Set<string> = new Set();

/**
 * Loads and validates the application configuration from environment variables.
 *
 * This function is idempotent — it only parses once and returns the cached
 * result on subsequent calls. The returned object is deeply frozen.
 *
 * @returns The fully-typed, immutable application configuration.
 */
export function getConfig(): AppConfigRoot {
  if (_config) return _config;

  const environment = validateEnvironment();

  _config = deepFreeze({
    app: {
      name: envString('APP_NAME', 'StoreCraft AI'),
      version: envString('APP_VERSION', '2.0.0'),
      environment,
      debug: environment !== 'production',
      port: envNumber('PORT', 3000),
    },

    database: {
      url: envString('DATABASE_URL', 'postgresql://localhost:5432/storecraft'),
      poolSize: envNumber('DATABASE_POOL_SIZE', 10),
      timeoutMs: envNumber('DATABASE_TIMEOUT_MS', 30_000),
    },

    redis: {
      url: envString('REDIS_URL', 'redis://localhost:6379'),
      keyPrefix: envString('REDIS_KEY_PREFIX', 'storecraft:'),
    },

    llm: {
      model: envString('LLM_MODEL', 'default'),
      maxTokens: envNumber('LLM_MAX_TOKENS', 4096),
      temperature: envNumber('LLM_TEMPERATURE', 7) / 10, // store as 0.0-1.0
      timeoutMs: envNumber('LLM_TIMEOUT_MS', 60_000),
    },

    rateLimits: {
      chat: envNumber('RATE_LIMIT_CHAT', 30),
      generate: envNumber('RATE_LIMIT_GENERATE', 5),
      voice: envNumber('RATE_LIMIT_VOICE', 10),
      api: envNumber('RATE_LIMIT_API', 100),
      storefront: envNumber('RATE_LIMIT_STOREFRONT', 60),
      bi: envNumber('RATE_LIMIT_BI', 30),
      extract: envNumber('RATE_LIMIT_EXTRACT', 15),
    },

    security: {
      corsOrigins: envStringList('CORS_ORIGINS', ['http://localhost:3000']),
      csrfEnabled: envBool('CSRF_ENABLED', true),
      maxPayloadSizeBytes: envNumber('MAX_PAYLOAD_SIZE', 50 * 1024 * 1024), // 50MB
      apiMaxPayloadSizeBytes: envNumber('API_MAX_PAYLOAD_SIZE', 5 * 1024 * 1024), // 5MB
      voiceMaxPayloadSizeBytes: envNumber('VOICE_MAX_PAYLOAD_SIZE', 5 * 1024 * 1024), // 5MB
    },

    queues: {
      concurrency: envNumber('QUEUE_CONCURRENCY', 5),
      retryAttempts: envNumber('QUEUE_RETRY_ATTEMPTS', 3),
    },

    cache: {
      defaultTtl: envNumber('CACHE_DEFAULT_TTL', 300), // 5 minutes
      analyticsTtl: envNumber('CACHE_ANALYTICS_TTL', 120), // 2 minutes
      templateTtl: envNumber('CACHE_TEMPLATE_TTL', 3600), // 1 hour
      sessionTtl: envNumber('CACHE_SESSION_TTL', 86400), // 24 hours
    },

    featureFlags: {
      enabled: (feature: string): boolean => _featureFlags.has(feature),
      list: (): string[] => [..._featureFlags],
    },
  });

  return _config;
}

/**
 * Validates and normalizes the NODE_ENV value.
 */
function validateEnvironment(): AppConfigRoot['app']['environment'] {
  const raw = process.env.NODE_ENV?.trim().toLowerCase();

  switch (raw) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    case 'test':
      return 'test';
    case 'development':
    default:
      return 'development';
  }
}

// =============================================================================
// Environment Helpers
// =============================================================================

/** Returns `true` if the application is running in development mode. */
export function isDevelopment(): boolean {
  return getConfig().app.environment === 'development';
}

/** Returns `true` if the application is running in production mode. */
export function isProduction(): boolean {
  return getConfig().app.environment === 'production';
}

/** Returns `true` if the application is running in test mode. */
export function isTest(): boolean {
  return getConfig().app.environment === 'test';
}

// =============================================================================
// Deep Freeze Utility
// =============================================================================

/**
 * Recursively freezes an object to prevent mutation.
 * Handles plain objects, arrays, Date, and RegExp. Does not freeze Map/Set.
 */
function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') return obj;

  // Handle Date and RegExp — they're already immutable
  if (obj instanceof Date || obj instanceof RegExp) return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item) => deepFreeze(item));
    return Object.freeze(obj);
  }

  // Handle plain objects
  const keys = Object.getOwnPropertyNames(obj) as Array<keyof typeof obj>;
  for (const key of keys) {
    const value = obj[key];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}
