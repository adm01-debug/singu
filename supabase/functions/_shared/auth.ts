import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// ─── Sentinel value for service-role callers ───
const SERVICE_ROLE_SENTINEL = "__SERVICE_ROLE__" as const;

/**
 * isServiceRoleCaller — checks if the auth result came from a service-role key.
 */
export function isServiceRoleCaller(authResult: string): boolean {
  return authResult === SERVICE_ROLE_SENTINEL;
}

/**
 * withAuthOrServiceRole — Accepts either a user JWT or the service_role key.
 * If the Authorization header carries the service_role key, returns the sentinel.
 * Otherwise delegates to withAuth (user JWT).
 */
export async function withAuthOrServiceRole(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized", 401);
  }
  const token = authHeader.replace("Bearer ", "");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    return SERVICE_ROLE_SENTINEL;
  }
  return withAuth(req);
}

/**
 * requireCronSecret — Validates `x-cron-secret` header against CRON_SECRET env.
 * Returns a 401 Response on failure, or null to continue.
 */
export function requireCronSecret(req: Request): Response | null {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) {
    console.error("CRON_SECRET not configured");
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get("x-cron-secret");
  if (provided !== secret) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}

/**
 * requireWebhookSecret — Validates a custom header against an env secret.
 * @param req        The incoming request
 * @param envName    Name of the env var holding the secret (e.g. "EVOLUTION_API_SECRET")
 * @param headerName Name of the header to check (e.g. "x-evolution-secret")
 * Returns a 401 Response on failure, or null to continue.
 */
export function requireWebhookSecret(
  req: Request,
  envName: string,
  headerName: string,
): Response | null {
  const secret = Deno.env.get(envName);
  if (!secret) {
    console.error(`${envName} not configured`);
    return jsonError("Server misconfigured", 500);
  }
  const provided = req.headers.get(headerName);
  if (provided !== secret) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}
