'use server';

// =============================================================================
// Job Signing — BullMQ Job Integrity Verification
// =============================================================================
// HMAC-SHA256 based signing and verification for BullMQ job payloads.
// Prevents tampering with job data between enqueue and processing.
// Uses a server-side secret with automatic fallback key generation.
// =============================================================================

import crypto from 'node:crypto';

// =============================================================================
// Configuration
// =============================================================================

/**
 * The signing secret loaded from environment.
 * Falls back to a deterministically generated key if not set.
 * The fallback is NOT secure for production — set JOB_SIGNING_SECRET in env.
 */
function getSigningSecret(): string {
  const envSecret = process.env.JOB_SIGNING_SECRET;
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  // Generate a persistent fallback secret using a hash of the app identifier.
  // This ensures the same fallback key across restarts but is NOT cryptographically random.
  if (!getSigningSecret._fallback) {
    getSigningSecret._fallback = crypto
      .createHash('sha256')
      .update('storecraft-ai-job-signing-fallback-key-do-not-use-in-production')
      .digest('hex');
  }

  return getSigningSecret._fallback;
}
getSigningSecret._fallback = '' as unknown as string;

// =============================================================================
// Core Signing & Verification
// =============================================================================

/**
 * Create the canonical string for HMAC input by combining queue name, job ID,
 * and a SHA-256 hash of the payload JSON. This ensures even identical payloads
 * in different contexts produce different signatures.
 *
 * @param queueName - The BullMQ queue name
 * @param jobId - The BullMQ job ID
 * @param payload - The job payload object
 * @returns Canonical string ready for HMAC signing
 */
function createCanonicalInput(queueName: string, jobId: string, payload: unknown): string {
  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  return `${queueName}:${jobId}:${payloadHash}`;
}

/**
 * Sign a BullMQ job using HMAC-SHA256.
 * The signature covers the queue name, job ID, and a hash of the payload,
 * ensuring that any tampering with the payload invalidates the signature.
 *
 * @param queueName - The BullMQ queue name
 * @param jobId - The BullMQ job ID
 * @param payload - The job payload object
 * @returns Hex-encoded HMAC-SHA256 signature string
 */
export function signJob(queueName: string, jobId: string, payload: unknown): string {
  const secret = getSigningSecret();
  const canonical = createCanonicalInput(queueName, jobId, payload);

  return crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex');
}

/**
 * Verify a BullMQ job's HMAC-SHA256 signature.
 * Compares signatures using timing-safe comparison to prevent timing attacks.
 *
 * @param queueName - The BullMQ queue name
 * @param jobId - The BullMQ job ID
 * @param payload - The job payload object
 * @param signature - The hex-encoded HMAC signature to verify
 * @returns True if the signature is valid and matches the payload
 */
export function verifyJob(
  queueName: string,
  jobId: string,
  payload: unknown,
  signature: string
): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  const secret = getSigningSecret();
  const canonical = createCanonicalInput(queueName, jobId, payload);

  const expected = crypto
    .createHmac('sha256', secret)
    .update(canonical)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

// =============================================================================
// Signed Payload Helper
// =============================================================================

/**
 * Result of generating a signed job payload.
 */
export interface SignedJobPayload<T = unknown> {
  /** The original job payload */
  payload: T;
  /** The HMAC-SHA256 signature */
  signature: string;
  /** The queue name (for verification) */
  queueName: string;
  /** The job ID (for verification) */
  jobId: string;
}

/**
 * Generate a combined signed job payload object.
 * Returns the original payload along with its signature and metadata,
 * ready to be passed to BullMQ's add() method.
 *
 * @param queueName - The BullMQ queue name
 * @param jobId - The BullMQ job ID
 * @param payload - The job payload object
 * @returns Combined object with payload, signature, and metadata
 */
export function generateSignedJobPayload<T = unknown>(
  queueName: string,
  jobId: string,
  payload: T
): SignedJobPayload<T> {
  const signature = signJob(queueName, jobId, payload);

  return {
    payload,
    signature,
    queueName,
    jobId,
  };
}

// =============================================================================
// Worker Middleware
// =============================================================================

/**
 * Error thrown when a job fails signature verification.
 */
export class JobSignatureError extends Error {
  constructor(jobId: string, queueName: string) {
    super(`Job signature verification failed for job "${jobId}" on queue "${queueName}"`);
    this.name = 'JobSignatureError';
  }
}

/**
 * Create a BullMQ worker middleware function that verifies job signatures
 * before processing and signs new jobs after creation.
 *
 * Usage with BullMQ Worker:
 * ```typescript
 * const worker = new Worker('myQueue', async (job) => {
 *   return signWorkerMiddleware(job, 'myQueue', async (verifiedJob) => {
 *     // Process the verified job here
 *     return processJob(verifiedJob.data.payload);
 *   });
 * });
 * ```
 *
 * @param job - The BullMQ Job object (must have `id`, `name`, and `data`)
 * @param queueName - The expected queue name for verification
 * @param handler - The actual job handler, called only if signature is valid
 * @returns The result from the handler function
 * @throws {JobSignatureError} If the job's signature is invalid or missing
 */
export async function signWorkerMiddleware<TJobData, TResult>(
  job: { id: string; name: string; data: TJobData },
  queueName: string,
  handler: (job: { id: string; name: string; data: TJobData }) => Promise<TResult>
): Promise<TResult> {
  const jobId = job.id;
  const jobData = job.data as unknown as SignedJobPayload;

  // Check if the job has a signature field
  if (!jobData || typeof jobData !== 'object' || !('signature' in jobData)) {
    // Jobs without signatures are rejected for security
    throw new JobSignatureError(jobId, queueName);
  }

  const { signature, payload } = jobData as SignedJobPayload;

  // Verify the signature
  const isValid = verifyJob(queueName, jobId, payload, signature);
  if (!isValid) {
    throw new JobSignatureError(jobId, queueName);
  }

  // Replace the job data with the unwrapped payload
  const verifiedJob = {
    ...job,
    data: payload as TJobData,
  };

  // Execute the actual handler with the verified payload
  return handler(verifiedJob);
}

/**
 * Helper to create a signed job for BullMQ's Queue.add() method.
 * Wraps the payload with its signature before enqueueing.
 *
 * @param queueName - The target queue name
 * @param jobId - The job ID (pass to Queue.add's jobId option)
 * @param payload - The job payload
 * @returns Object suitable for passing to Queue.add() as the job data
 */
export function createSignedJobData<T = unknown>(
  queueName: string,
  jobId: string,
  payload: T
): SignedJobPayload<T> {
  return generateSignedJobPayload(queueName, jobId, payload);
}
