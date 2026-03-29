/**
 * Shared validation utilities for edge functions.
 * Provides request body parsing and validation.
 */

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: string[] };

/**
 * Safely parse JSON body from a request.
 * Returns null if body is empty or invalid.
 */
export async function parseJsonBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Validate that required fields exist in request body.
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  fields: string[],
): ValidationResult<Record<string, unknown>> {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === null);
  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      details: missing.map((f) => `Field '${f}' is required`),
    };
  }
  return { success: true, data: body };
}

/**
 * Sanitize string input by trimming and limiting length.
 */
export function sanitizeString(value: unknown, maxLength = 1000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Validate UUID format.
 */
export function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Create an error response for validation failures.
 */
export function validationErrorResponse(
  corsHeaders: Record<string, string>,
  message: string,
  details?: string[],
): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation Error',
      message,
      details,
    }),
    {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
}
