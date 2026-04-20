import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface Check {
  status: "up" | "degraded" | "down" | "not_configured";
  latency_ms?: number;
  error?: string;
  details?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function checkLocalDb(): Promise<Check> {
  try {
    const start = Date.now();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return {
      status: error ? "degraded" : "up",
      latency_ms: Date.now() - start,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkExternalDb(): Promise<Check> {
  const url = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const key = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const ext = createClient(url, key);
    const { error } = await ext.from("companies").select("id").limit(1);
    return {
      status: error ? "degraded" : "up",
      latency_ms: Date.now() - start,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkWhatsApp(): Promise<Check> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(8_000),
    });
    return {
      status: res.ok ? "up" : "degraded",
      latency_ms: Date.now() - start,
      ...(!res.ok && { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkVoiceAI(): Promise<Check> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(8_000),
    });
    return {
      status: res.ok ? "up" : "degraded",
      latency_ms: Date.now() - start,
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkEmailPipeline(): Promise<Check> {
  const url = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const key = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const ext = createClient(url, key);
    const { data, error } = await ext
      .from("email_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return { status: "degraded", latency_ms: Date.now() - start, error: error.message };
    const last = data?.[0]?.created_at;
    if (!last) return { status: "degraded", details: "Sem emails registrados" };
    const hoursSince = (Date.now() - new Date(last).getTime()) / 3_600_000;
    return {
      status: hoursSince < 1 ? "up" : hoursSince < 24 ? "degraded" : "down",
      latency_ms: Date.now() - start,
      details: `Último email há ${Math.round(hoursSince)}h`,
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function getActiveAlerts(): Promise<number> {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("dismissed", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  const cors = makeCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const start = Date.now();
  const [database_local, database_external, whatsapp, voice_ai, email_pipeline, alerts_count] =
    await Promise.all([
      checkLocalDb(),
      checkExternalDb(),
      checkWhatsApp(),
      checkVoiceAI(),
      checkEmailPipeline(),
      getActiveAlerts(),
    ]);

  const components = { database_local, database_external, whatsapp, email_pipeline, voice_ai };
  const considered = Object.values(components).filter((c) => c.status !== "not_configured");
  const hasDown = considered.some((c) => c.status === "down");
  const hasDegraded = considered.some((c) => c.status === "degraded");
  const overall = hasDown ? "unhealthy" : hasDegraded ? "degraded" : "healthy";

  return new Response(
    JSON.stringify({
      status: overall,
      timestamp: new Date().toISOString(),
      total_latency_ms: Date.now() - start,
      components,
      alerts_count,
      version: "3.0.0",
    }),
    {
      status: overall === "unhealthy" ? 503 : 200,
      headers: { ...cors, "Content-Type": "application/json" },
    },
  );
});
