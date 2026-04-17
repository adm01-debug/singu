import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const InputSchema = z.object({
  contact_id: z.string().uuid(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

const MODEL = "google/gemini-2.5-flash";

interface NbaJson {
  action: string;
  reason: string;
  channel: string;
  urgency: "low" | "medium" | "high";
  suggested_script?: string;
  expected_outcome?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || userId;
  const limited = limiter.check(`nba:${ip}`);
  if (limited) return limited;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY ausente", 500, req);

    const raw = await req.json();
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) return jsonError("Entrada inválida", 400, req);
    const { contact_id } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Aggregate signals
    const [contactRes, interactionsRes, scoreRes] = await Promise.all([
      supabase.from("contacts").select("*, companies(name, industry)").eq("id", contact_id).eq("user_id", userId).maybeSingle(),
      supabase.from("interactions").select("type, content, sentiment, summary, created_at, direction, initiated_by")
        .eq("contact_id", contact_id).eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(10),
      supabase.from("lead_scores").select("score, grade, dimensions").eq("contact_id", contact_id).eq("user_id", userId).maybeSingle(),
    ]);

    if (contactRes.error || !contactRes.data) {
      return jsonError("Contato não encontrado", 404, req);
    }
    const contact = contactRes.data;
    const interactions = interactionsRes.data || [];
    const score = scoreRes.data;

    // Compute days since last interaction
    const lastInteraction = interactions[0];
    const daysSinceLast = lastInteraction
      ? Math.floor((Date.now() - new Date(lastInteraction.created_at).getTime()) / 86400000)
      : null;

    // Sentiment trend (last 5 vs prev 5)
    const sentMap: Record<string, number> = { positive: 1, neutral: 0, negative: -1 };
    const recent5 = interactions.slice(0, 5).map((i) => sentMap[i.sentiment ?? "neutral"] ?? 0);
    const prev5 = interactions.slice(5, 10).map((i) => sentMap[i.sentiment ?? "neutral"] ?? 0);
    const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
    const trend = recent5.length && prev5.length
      ? (avg(recent5) > avg(prev5) + 0.2 ? "up" : avg(recent5) < avg(prev5) - 0.2 ? "down" : "stable")
      : "unknown";

    const signals = {
      contact: {
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        role_title: contact.role_title,
        company: contact.companies?.name,
        industry: contact.companies?.industry,
        relationship_score: contact.relationship_score,
        relationship_stage: contact.relationship_stage,
        sentiment: contact.sentiment,
      },
      lead_score: score ? { score: score.score, grade: score.grade } : null,
      sentiment_trend: trend,
      days_since_last_interaction: daysSinceLast,
      last_interaction: lastInteraction ? {
        type: lastInteraction.type,
        sentiment: lastInteraction.sentiment,
        summary: lastInteraction.summary,
        direction: lastInteraction.direction,
      } : null,
      interactions_count: interactions.length,
    };

    const systemPrompt = `Você é um coach de vendas sênior. Com base nos sinais do contato, sugira A PRÓXIMA MELHOR AÇÃO acionável agora. Responda APENAS em JSON válido com os campos: action (string curta, ação concreta), reason (2-3 linhas justificando), channel (email|whatsapp|call|linkedin|meeting), urgency (low|medium|high), suggested_script (script curto pronto para enviar/falar, em PT-BR), expected_outcome (1 linha). Seja específico, evite genéricos.`;

    const userPrompt = `Sinais do contato:\n${JSON.stringify(signals, null, 2)}\n\nGere a próxima melhor ação.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return jsonError("Limite de requisições excedido. Tente em alguns minutos.", 429, req);
      if (aiResp.status === 402) return jsonError("Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso.", 402, req);
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return jsonError("Erro ao gerar sugestão", 500, req);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "{}";
    let nba: NbaJson;
    try {
      nba = JSON.parse(content) as NbaJson;
    } catch {
      return jsonError("Resposta da IA inválida", 502, req);
    }

    // Normalize urgency
    const urgency: "low" | "medium" | "high" =
      nba.urgency === "low" || nba.urgency === "high" ? nba.urgency : "medium";

    // Upsert cache
    const { data: saved, error: upsertErr } = await supabase
      .from("contact_next_actions")
      .upsert({
        user_id: userId,
        contact_id,
        action: nba.action,
        reason: nba.reason,
        channel: nba.channel,
        urgency,
        suggested_script: nba.suggested_script ?? null,
        expected_outcome: nba.expected_outcome ?? null,
        signals_snapshot: signals,
        model: MODEL,
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id,contact_id" })
      .select()
      .single();

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return jsonError("Erro ao salvar sugestão", 500, req);
    }

    return jsonOk({ next_action: saved }, req);
  } catch (err) {
    console.error("next-best-action error:", err);
    return jsonError(err instanceof Error ? err.message : "Erro desconhecido", 500, req);
  }
});
