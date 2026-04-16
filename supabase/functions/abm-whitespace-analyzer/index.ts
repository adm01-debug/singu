import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: "Análise de whitespace muito frequente. Aguarde." });

interface AIOpportunity {
  opportunity_type: "cross_sell" | "up_sell" | "expansion" | "renewal";
  product_category: string;
  estimated_value: number;
  confidence: number;
  rationale: string;
}

async function callLovableAI(account: Record<string, unknown>, committee: unknown[]): Promise<AIOpportunity[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = `Analise a conta ABM e gere 3-5 oportunidades de whitespace (cross-sell, up-sell, expansão, renovação).

Conta:
- Nome: ${account.company_name}
- Tier: ${account.tier}
- Score atual: ${account.account_score}
- Receita-alvo: ${account.target_revenue ?? "não definida"}
- Status: ${account.status}
- Tamanho do comitê de compra: ${committee.length}

Para cada oportunidade, retorne tipo, categoria de produto/serviço, valor estimado em BRL, confiança (0-100) e justificativa em português.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Você é um analista sênior de Account-Based Marketing especializado em identificar oportunidades de expansão de conta." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_whitespace_opportunities",
            description: "Submete oportunidades de whitespace identificadas na conta",
            parameters: {
              type: "object",
              properties: {
                opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      opportunity_type: { type: "string", enum: ["cross_sell", "up_sell", "expansion", "renewal"] },
                      product_category: { type: "string" },
                      estimated_value: { type: "number" },
                      confidence: { type: "number" },
                      rationale: { type: "string" },
                    },
                    required: ["opportunity_type", "product_category", "estimated_value", "confidence", "rationale"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["opportunities"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_whitespace_opportunities" } },
    }),
  });

  if (response.status === 429) throw new Error("Rate limit do Lovable AI atingido. Tente novamente em alguns instantes.");
  if (response.status === 402) throw new Error("Créditos do Lovable AI esgotados. Adicione créditos na workspace.");
  if (!response.ok) throw new Error(`Lovable AI error: ${response.status}`);

  const data = await response.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];

  const args = JSON.parse(toolCall.function.arguments);
  return Array.isArray(args.opportunities) ? args.opportunities : [];
}

Deno.serve(async (req) => {
  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const limited = limiter(userId);
  if (limited) return jsonError(limited.message, 429, req);

  try {
    const { account_id } = await req.json();
    if (!account_id) return jsonError("account_id is required", 400, req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: account, error: accErr } = await supabase
      .from("abm_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", userId)
      .single();
    if (accErr || !account) return jsonError("Conta não encontrada", 404, req);

    const { data: committee } = await supabase
      .from("abm_buying_committee")
      .select("*")
      .eq("account_id", account_id);

    const opportunities = await callLovableAI(account, committee ?? []);

    const inserts = opportunities.map((opp) => ({
      account_id,
      user_id: userId,
      opportunity_type: opp.opportunity_type,
      product_category: opp.product_category,
      estimated_value: opp.estimated_value,
      confidence: Math.min(100, Math.max(0, Math.round(opp.confidence))),
      rationale: opp.rationale,
      status: "identified",
    }));

    if (inserts.length === 0) return jsonOk({ generated: 0, opportunities: [] }, req);

    const { data: created, error: insErr } = await supabase
      .from("abm_whitespace_opportunities")
      .insert(inserts)
      .select();
    if (insErr) return jsonError(insErr.message, 500, req);

    return jsonOk({ generated: created?.length ?? 0, opportunities: created ?? [] }, req);
  } catch (err) {
    console.error("abm-whitespace-analyzer error:", err);
    return jsonError(err instanceof Error ? err.message : "Unknown error", 500, req);
  }
});
