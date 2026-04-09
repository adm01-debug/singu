import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bitrix-secret, x-evolution-secret, x-lux-secret, x-cron-secret",
};

/**
 * authenticateRequest — Validates JWT from the Authorization header.
 * Returns the authenticated user ID or throws "UNAUTHORIZED".
 */
export async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id) throw new Error("UNAUTHORIZED");
  return user.id;
}

/** Standard JSON error response with CORS headers. */
export function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/** Standard JSON success response with CORS headers. */
export function jsonOk(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * handleCorsAndMethod — Guards OPTIONS preflight and enforces POST-only.
 * Returns a Response to send immediately, or null to continue processing.
 */
export function handleCorsAndMethod(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonError("Method not allowed", 405);
  }
  return null;
}

/**
 * withAuth — Runs authenticateRequest and returns 401 on failure.
 * Returns the user ID on success, or a Response to send on failure.
 */
export async function withAuth(req: Request): Promise<string | Response> {
  try {
    return await authenticateRequest(req);
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

/**
 * requireWebhookSecret — Validates a shared secret in a custom header for
 * third-party webhooks (Bitrix24, Evolution API, n8n, etc.).
 * Constant-time comparison prevents timing attacks.
 */
export function requireWebhookSecret(
  req: Request,
  envVarName: string,
  headerName: string
): Response | null {
  const expected = Deno.env.get(envVarName);
  if (!expected) {
    console.error(`[security] ${envVarName} not configured — webhook is OPEN`);
    return jsonError("Webhook secret not configured on server", 503);
  }
  const got = req.headers.get(headerName) ?? "";
  if (!constantTimeEqual(got, expected)) {
    console.warn(`[security] Invalid webhook secret on ${headerName}`);
    return jsonError("Invalid webhook secret", 401);
  }
  return null;
}

/**
 * requireCronSecret — Validates CRON_SECRET header for scheduled functions.
 */
export function requireCronSecret(req: Request): Response | null {
  return requireWebhookSecret(req, "CRON_SECRET", "x-cron-secret");
}

/** Constant-time string comparison to mitigate timing attacks. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * sanitizePhone — Strips all non-digits and limits to E.164 length.
 * Returns empty string if result is too short to be valid.
 */
export function sanitizePhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let phone = String(raw).replace(/\D/g, "").slice(0, 15);
  if (phone.startsWith("55") && phone.length > 11) {
    phone = phone.substring(2);
  }
  return phone.length >= 8 ? phone : "";
}

/**
 * withAuthOrServiceRole — Accepts EITHER a user JWT OR the service_role key.
 *
 * Use this for edge functions that are called both by the frontend (with user JWT)
 * AND by other edge functions server-to-server (with service_role).
 *
 * Returns:
 *   - userId string when called with valid user JWT
 *   - "__SERVICE_ROLE__" when called with service_role (caller must enforce
 *     ownership/authorization separately, e.g. via explicit `userId` param)
 *   - Response 401 on auth failure
 */
export async function withAuthOrServiceRole(
  req: Request
): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized", 401);
  }
  const token = authHeader.substring(7);

  // Constant-time check against service_role key
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token.length === serviceKey.length) {
    let mismatch = 0;
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ serviceKey.charCodeAt(i);
    }
    if (mismatch === 0) return "__SERVICE_ROLE__";
  }

  // Otherwise validate as user JWT
  try {
    return await authenticateRequest(req);
  } catch {
    return jsonError("Unauthorized", 401);
  }
}

/** True if the result of withAuthOrServiceRole is the service-role marker. */
export function isServiceRoleCaller(result: string): boolean {
  return result === "__SERVICE_ROLE__";
}

/**
 * isAdmin — Uses the existing has_role(uuid, app_role) RPC.
 * The audit found that user_roles + has_role function already exist with
 * proper SECURITY DEFINER + search_path. Don't reinvent RBAC.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("[auth] has_role check failed:", error.message);
    return false;
  }
  return data === true;
}
