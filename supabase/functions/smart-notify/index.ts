import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: "Rate limit excedido para smart-notify." });

const InputSchema = z.object({
  event_type: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  body: z.string().max(800).optional().nullable(),
  entity_type: z.string().max(40).optional().nullable(),
  entity_id: z.string().max(120).optional().nullable(),
  urgency: z.enum(["critical", "high", "normal", "low"]).optional().default("normal"),
  bundle_key: z.string().max(160).optional().nullable(),
  action_url: z.string().max(500).optional().nullable(),
  payload: z.record(z.unknown()).optional().default({}),
});

type Urgency = "critical" | "high" | "normal" | "low";
type Channel = "in_app" | "email" | "push" | "whatsapp" | "suppressed";

interface Prefs {
  quiet_hours_start: number;
  quiet_hours_end: number;
  weekend_silence: boolean;
  enabled_channels: string[];
  min_urgency_email: Urgency;
  min_urgency_push: Urgency;
  digest_mode: "immediate" | "hourly" | "daily";
}

const DEFAULT_PREFS: Prefs = {
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  weekend_silence: false,
  enabled_channels: ["in_app"],
  min_urgency_email: "high",
  min_urgency_push: "critical",
  digest_mode: "immediate",
};

const URGENCY_RANK: Record<Urgency, number> = { low: 1, normal: 2, high: 3, critical: 4 };

function isQuiet(now: Date, prefs: Prefs): boolean {
  const h = now.getUTCHours(); // server-side UTC; client can compensate
  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;
  if (prefs.weekend_silence) {
    const day = now.getUTCDay();
    if (day === 0 || day === 6) return true;
  }
  if (start === end) return false;
  if (start < end) return h >= start && h < end;
  return h >= start || h < end;
}

function pickChannelByPrefs(urgency: Urgency, prefs: Prefs): Channel {
  const enabled = new Set(prefs.enabled_channels);
  const rank = URGENCY_RANK[urgency];
  if (enabled.has("push") && rank >= URGENCY_RANK[prefs.min_urgency_push]) return "push";
  if (enabled.has("email") && rank >= URGENCY_RANK[prefs.min_urgency_email]) return "email";
  if (enabled.has("in_app")) return "in_app";
  return "suppressed";
}

async function refineWithAI(
  apiKey: string,
  payload: { event_type: string; title: string; body?: string | null; urgency: Urgency },
): Promise<{ urgency: Urgency; channel_hint: Channel | null; reason: string } | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "Classifique notificações de CRM. Devolva APENAS JSON {\"urgency\":\"critical|high|normal|low\",\"channel_hint\":\"in_app|email|push\",\"reason\":\"curto pt-br\"}.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const txt = data.choices?.[0]?.message?.content;
    if (!txt) return null;
    const parsed = JSON.parse(txt);
    const u = ["critical", "high", "normal", "low"].includes(parsed.urgency) ? parsed.urgency : "normal";
    const c = ["in_app", "email", "push"].includes(parsed.channel_hint) ? parsed.channel_hint : null;
    return { urgency: u, channel_hint: c, reason: String(parsed.reason || "AI classified") };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: scopedCorsHeaders(req) });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }
    const input = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Load prefs
    const { data: prefsRow } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const prefs: Prefs = prefsRow ? { ...DEFAULT_PREFS, ...prefsRow } as Prefs : DEFAULT_PREFS;

    let urgency: Urgency = input.urgency;
    let reason = "heuristic";

    // 2) Refine ambiguous urgencies via AI when key is available
    if ((urgency === "normal" || urgency === "low") && Deno.env.get("LOVABLE_API_KEY")) {
      const refined = await refineWithAI(Deno.env.get("LOVABLE_API_KEY")!, {
        event_type: input.event_type,
        title: input.title,
        body: input.body ?? null,
        urgency,
      });
      if (refined) {
        urgency = refined.urgency;
        reason = `ai:${refined.reason}`;
      }
    }

    // 3) Channel decision
    let channel: Channel = pickChannelByPrefs(urgency, prefs);
    const quiet = isQuiet(new Date(), prefs);
    let scheduled_for = new Date().toISOString();
    if (quiet && urgency !== "critical") {
      // postpone to end of quiet window
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(prefs.quiet_hours_end, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      scheduled_for = next.toISOString();
      reason += ";quiet_postpone";
    }

    // 4) Bundle dedupe (6h)
    if (input.bundle_key) {
      const { data: existing } = await supabase
        .from("smart_notifications")
        .select("id, bundle_count, urgency")
        .eq("user_id", userId)
        .eq("bundle_key", input.bundle_key)
        .in("status", ["pending", "delivered", "snoozed"])
        .gt("created_at", new Date(Date.now() - 6 * 3600_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const newUrgency =
          URGENCY_RANK[urgency] > URGENCY_RANK[existing.urgency as Urgency] ? urgency : (existing.urgency as Urgency);
        await supabase
          .from("smart_notifications")
          .update({
            bundle_count: existing.bundle_count + 1,
            urgency: newUrgency,
            decision_reason: reason + ";bundled",
          })
          .eq("id", existing.id);
        return jsonOk({ id: existing.id, bundled: true, urgency: newUrgency, channel }, req);
      }
    }

    const insertRow = {
      user_id: userId,
      event_type: input.event_type,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      title: input.title,
      body: input.body ?? null,
      payload: input.payload ?? {},
      urgency,
      decided_channel: channel,
      decision_reason: reason,
      bundle_key: input.bundle_key ?? null,
      action_url: input.action_url ?? null,
      scheduled_for,
      status: "pending",
    };

    const { data: inserted, error: insErr } = await supabase
      .from("smart_notifications")
      .insert(insertRow)
      .select("id")
      .single();
    if (insErr) throw insErr;

    return jsonOk({ id: inserted.id, urgency, channel, scheduled_for, reason }, req);
  } catch (error) {
    console.error("smart-notify error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500, req);
  }
});
