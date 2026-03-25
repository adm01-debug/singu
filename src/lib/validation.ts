import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Validates data against a Zod schema with safe fallback.
 * Logs validation errors in development but never crashes in production.
 */
export function validateData<T>(schema: z.ZodType<T>, data: unknown, context?: string): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  logger.error(
    `Data validation failed${context ? ` (${context})` : ''}:`,
    result.error.issues
  );
  return null;
}

/**
 * Validates an array of data against a Zod schema.
 * Returns only valid items, logging invalid ones.
 */
export function validateArray<T>(schema: z.ZodType<T>, data: unknown[], context?: string): T[] {
  return data.reduce<T[]>((acc, item, index) => {
    const result = schema.safeParse(item);
    if (result.success) {
      acc.push(result.data);
    } else {
      logger.error(
        `Array item validation failed at index ${index}${context ? ` (${context})` : ''}:`,
        result.error.issues
      );
    }
    return acc;
  }, []);
}

// ===== Common Schemas =====

export const contactSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  role_title: z.string().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  relationship_score: z.number().min(0).max(100).nullable().optional(),
  relationship_stage: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  user_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

export const interactionSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  type: z.string(),
  content: z.string().nullable().optional(),
  sentiment: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();
