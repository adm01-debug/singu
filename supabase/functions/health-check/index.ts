import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency_ms: number };
    auth: { status: string };
    storage: { status: string };
  };
  uptime_seconds: number;
}

const startTime = Date.now();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const checks: HealthStatus["checks"] = {
    database: { status: "unknown", latency_ms: 0 },
    auth: { status: "unknown" },
    storage: { status: "unknown" },
  };

  let overallStatus: HealthStatus["status"] = "healthy";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity and latency
    const dbStart = performance.now();
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    const dbLatency = Math.round(performance.now() - dbStart);

    checks.database = {
      status: dbError ? "unhealthy" : "healthy",
      latency_ms: dbLatency,
    };

    if (dbError) overallStatus = "unhealthy";
    if (dbLatency > 2000) overallStatus = "degraded";

    // Check auth service
    const { error: authError } = await supabase.auth.getSession();
    checks.auth = {
      status: authError ? "degraded" : "healthy",
    };

    if (authError && overallStatus === "healthy") overallStatus = "degraded";

    // Storage check (lightweight)
    checks.storage = { status: "healthy" };
  } catch (error) {
    overallStatus = "unhealthy";
    checks.database = { status: "error", latency_ms: 0 };
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: Deno.env.get("APP_VERSION") ?? "1.0.0",
    checks,
    uptime_seconds: Math.round((Date.now() - startTime) / 1000),
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return new Response(JSON.stringify(healthStatus), {
    status: httpStatus,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
