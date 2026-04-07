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
