import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Endpoint público para receber dados de outros sistemas Lovable.
 * URL: /functions/v1/incoming-webhook/<token>
 * Auth: token na URL (path) OU header X-Webhook-Token.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const t0 = Date.now();

  const url = new URL(req.url);
  const pathToken = url.pathname.split("/").pop();
  const headerToken = req.headers.get("x-webhook-token");
  const token = pathToken && pathToken !== "incoming-webhook" ? pathToken : headerToken;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sourceIp = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  let payload: Record<string, unknown> = {};
  try { payload = await req.json(); } catch { /* empty body */ }

  if (!token) {
    return new Response(JSON.stringify({ error: "Token obrigatório" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: webhook, error: whErr } = await admin
    .from("incoming_webhooks")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (whErr || !webhook) {
    return new Response(JSON.stringify({ error: "Webhook inválido ou inativo" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Origem (opcional)
  if (webhook.allowed_origins?.length) {
    const origin = req.headers.get("origin") ?? "";
    const ok = webhook.allowed_origins.some((o: string) => origin.includes(o));
    if (!ok) {
      await admin.from("incoming_webhook_logs").insert({
        webhook_id: webhook.id, status: "error", http_status: 403,
        payload, error_message: "Origem não permitida", source_ip: sourceIp, user_agent: userAgent,
        latency_ms: Date.now() - t0,
      });
      return new Response(JSON.stringify({ error: "Origem não permitida" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Mapear payload via field_mapping (chave_destino: caminho.no.payload)
  const mapping = (webhook.field_mapping ?? {}) as Record<string, string>;
  const mapped: Record<string, unknown> = {};
  for (const [target, path] of Object.entries(mapping)) {
    const parts = path.split(".");
    let v: unknown = payload;
    for (const p of parts) v = (v as Record<string, unknown> | null)?.[p];
    if (v !== undefined) mapped[target] = v;
  }
  const finalRow = Object.keys(mapped).length ? mapped : payload;

  // Inserir na tabela alvo (limitado a entidades suportadas)
  const tableMap: Record<string, string> = {
    contact: "contacts", company: "companies", deal: "deals",
    interaction: "interactions", note: "notes",
  };
  const targetTable = tableMap[webhook.target_entity];

  let insertResult: unknown = null;
  let httpStatus = 200;
  let errorMessage: string | null = null;

  if (targetTable) {
    const row = { ...finalRow, user_id: webhook.created_by };
    const { data, error } = await admin.from(targetTable).insert(row).select().maybeSingle();
    if (error) {
      httpStatus = 500;
      errorMessage = error.message;
    } else insertResult = data;
  } else {
    insertResult = { received: true, payload: finalRow };
  }

  // Métricas
  await admin.from("incoming_webhooks").update({
    total_calls: (webhook.total_calls ?? 0) + 1,
    total_errors: (webhook.total_errors ?? 0) + (errorMessage ? 1 : 0),
    last_called_at: new Date().toISOString(),
  }).eq("id", webhook.id);

  await admin.from("incoming_webhook_logs").insert({
    webhook_id: webhook.id,
    status: errorMessage ? "error" : "success",
    http_status: httpStatus,
    payload, response: insertResult, error_message: errorMessage,
    source_ip: sourceIp, user_agent: userAgent,
    latency_ms: Date.now() - t0,
  });

  return new Response(JSON.stringify({ success: !errorMessage, data: insertResult, error: errorMessage }), {
    status: httpStatus, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
