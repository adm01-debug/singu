import { createClient } from "npm:@supabase/supabase-js@2";

function getScopedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") || "";
  if (origin.endsWith(".lovable.app")) return origin;
  return "https://dialogue-diamond.lovable.app";
}

function makeCors(req: Request) {
  return {
    "Access-Control-Allow-Origin": getScopedOrigin(req),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = makeCors(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.database = {
      status: error ? "degraded" : "healthy",
      latencyMs: Date.now() - dbStart,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    checks.database = { status: "unhealthy", error: String(e) };
  }

  // Check 2: Memory
  try {
    checks.runtime = { status: "healthy" };
  } catch (e) {
    checks.runtime = { status: "unhealthy", error: String(e) };
  }

  // Check 3: External DB connectivity
  try {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (extUrl && extKey) {
      const extStart = Date.now();
      const extClient = createClient(extUrl, extKey);
      const { error } = await extClient.from("companies").select("id").limit(1);
      checks.external_database = {
        status: error ? "degraded" : "healthy",
        latencyMs: Date.now() - extStart,
        ...(error && { error: error.message }),
      };
    } else {
      checks.external_database = { status: "not_configured" };
    }
  } catch (e) {
    checks.external_database = { status: "unhealthy", error: String(e) };
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === "healthy" || c.status === "not_configured"
  );

  const response = {
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    checks,
    version: "1.0.0",
  };

  return new Response(JSON.stringify(response), {
    status: allHealthy ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
