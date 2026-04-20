// Edge function: error-budget — agrega janela de 30d de system_health_snapshots
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

const SLO_TARGET = 99.5; // %
const WINDOW_HOURS = 720; // 30 dias
const SAMPLE_INTERVAL_MIN = 5; // cron snapshot a cada 5 min

interface Snapshot {
  timestamp: string;
  status: "healthy" | "degraded" | "unhealthy";
}

Deno.serve(async (req) => {
  const corsHeaders = makeCors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("system_health_snapshots")
      .select("timestamp,status")
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true })
      .limit(10000);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snapshots = (data ?? []) as Snapshot[];
    const totalSamples = snapshots.length;
    const downSamples = snapshots.filter((s) => s.status === "unhealthy").length;
    const degradedSamples = snapshots.filter((s) => s.status === "degraded").length;

    // Cada amostra representa SAMPLE_INTERVAL_MIN minutos. Degradado conta como 50%.
    const downtimeMinutes = downSamples * SAMPLE_INTERVAL_MIN + degradedSamples * SAMPLE_INTERVAL_MIN * 0.5;
    const totalMinutes = WINDOW_HOURS * 60;
    const uptimePct = totalSamples === 0 ? 100 : Math.max(0, 100 - (downtimeMinutes / totalMinutes) * 100);

    // Budget: (100 - SLO) % do tempo é permitido fora. Consumido = downtime / budget total.
    const budgetMinutesTotal = totalMinutes * ((100 - SLO_TARGET) / 100); // 216 min/mês para 99.5%
    const budgetConsumedPct = budgetMinutesTotal === 0 ? 0 : Math.min(150, (downtimeMinutes / budgetMinutesTotal) * 100);
    const freezeActive = budgetConsumedPct >= 100;
    const freezeWarning = budgetConsumedPct >= 50 && budgetConsumedPct < 100;

    const response = {
      slo_target_pct: SLO_TARGET,
      window_hours: WINDOW_HOURS,
      uptime_pct: Number(uptimePct.toFixed(3)),
      downtime_minutes: Number(downtimeMinutes.toFixed(1)),
      budget_total_minutes: Number(budgetMinutesTotal.toFixed(1)),
      budget_consumed_pct: Number(budgetConsumedPct.toFixed(1)),
      freeze_active: freezeActive,
      freeze_warning: freezeWarning,
      total_samples: totalSamples,
      down_samples: downSamples,
      degraded_samples: degradedSamples,
      sample_interval_minutes: SAMPLE_INTERVAL_MIN,
      computed_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
