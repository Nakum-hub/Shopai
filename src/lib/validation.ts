import { z } from 'zod';

// =============================================================================
// Business Profile Validation
// =============================================================================

const businessCategorySchema = z.enum([
  'bakery', 'restaurant', 'clothing', 'electronics', 'salon',
  'grocery', 'hardware', 'medical', 'boutique', 'service', 'other',
]);

const brandThemeSchema = z.enum(['modern', 'classic', 'minimal', 'bold', 'elegant']);

const brandStyleSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  fontFamily: z.string().max(100),
  theme: brandThemeSchema,
  mood: z.string().max(200),
});

const businessProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  price: z.string().max(50),
  category: z.string().max(100),
});

const businessServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000),
  duration: z.string().max(50).optional(),
  price: z.string().max(50).optional(),
});

export const businessProfileSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(200),
  category: businessCategorySchema,
  description: z.string().max(2000),
  location: z.string().max(300),
  phone: z.string().max(30),
  email: z.string().email().or(z.literal('')),
  hours: z.string().max(200),
  products: z.array(businessProductSchema).max(50),
  services: z.array(businessServiceSchema).max(50),
  style: brandStyleSchema,
  features: z.array(z.string().max(100)).max(30),
});

// =============================================================================
// Chat API Validation
// =============================================================================

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  sessionId: z.string().max(100).optional().default('default'),
});

// =============================================================================
// Voice Process Validation
// =============================================================================

export const voiceProcessSchema = z.object({
  audio: z.string().min(100, 'Audio data is required'),
});

// =============================================================================
// Extract Profile Validation
// =============================================================================

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const extractProfileSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, 'At least one message required').max(50),
});

// =============================================================================
// Design Block Validation
// =============================================================================

export const designBlockSchema = z.object({
  id: z.string().max(100),
  type: z.string().max(50),
  name: z.string().max(200),
  variant: z.string().max(100),
  description: z.string().max(1000),
});

// =============================================================================
// Generate Website Validation
// =============================================================================

export const generateWebsiteSchema = z.object({
  businessProfile: businessProfileSchema.optional(),
  prompt: z.string().max(5000).optional(),
  blocks: z.array(designBlockSchema).max(20).optional(),
}).refine(
  (data) => data.businessProfile || data.prompt || (data.blocks && data.blocks.length > 0),
  { message: 'Either businessProfile, prompt, or blocks is required' }
);

// =============================================================================
// Storefronts CRUD Validation
// =============================================================================

export const createStorefrontSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  businessName: z.string().min(1, 'Business name is required').max(200),
  category: z.string().max(50).optional().default('other'),
  description: z.string().max(5000).optional(),
  html: z.string().max(500000).optional(),
  businessProfile: z.record(z.string(), z.unknown()).optional(),
});

export const updateStorefrontSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().max(200).optional(),
  businessName: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(['draft', 'generating', 'ready', 'published', 'error']).optional(),
  description: z.string().max(5000).optional(),
  html: z.string().max(500000).optional(),
  businessProfile: z.record(z.string(), z.unknown()).optional(),
  deploymentStatus: z.enum(['none', 'deploying', 'deployed', 'failed']).optional(),
  deploymentUrl: z.string().max(500).optional(),
  publishedAt: z.string().optional().nullable(),
});

// =============================================================================
// Analytics Validation
// =============================================================================

export const analyticsRequestSchema = z.object({
  storefrontId: z.string().min(1, 'Storefront ID is required'),
  days: z.number().int().min(1).max(365).optional().default(30),
});

// =============================================================================
// Validation Helper
// =============================================================================

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return { success: false, error: firstError?.message || 'Invalid input' };
  }
  return { success: true, data: result.data };
}
