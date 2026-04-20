import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TestPayload {
  connection_id?: string;
  connection_type: "supabase_external" | "bitrix24" | "n8n" | "mcp_claude" | "custom";
  config: Record<string, unknown>;
}

async function testSupabase(config: Record<string, unknown>) {
  const url = String(config.url ?? "");
  const key = String(config.anon_key ?? config.service_role_key ?? "");
  if (!url || !key) throw new Error("URL e chave (anon ou service role) obrigatórias");
  const t0 = Date.now();
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: "Supabase respondeu OK" };
}

async function testBitrix(config: Record<string, unknown>) {
  const webhook = String(config.webhook_url ?? "");
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await fetch(`${webhook.replace(/\/$/, "")}/profile.json`);
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { latency_ms: ms, message: `Bitrix24 OK — ${data?.result?.NAME ?? "user"}` };
}

async function testN8n(config: Record<string, unknown>) {
  const webhook = String(config.webhook_url ?? "");
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true, source: "lovable-singu", ts: Date.now() }),
  });
  const ms = Date.now() - t0;
  if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: `n8n respondeu HTTP ${res.status}` };
}

async function testMcpClaude(config: Record<string, unknown>) {
  const url = String(config.server_url ?? "");
  if (!url) throw new Error("server_url obrigatório");
  const t0 = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "singu", version: "1.0" } },
    }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: "MCP server respondeu" };
}

async function testCustom(config: Record<string, unknown>) {
  const url = String(config.url ?? "");
  if (!url) throw new Error("url obrigatória");
  const t0 = Date.now();
  const res = await fetch(url, { method: String(config.method ?? "GET") });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: `Custom OK — HTTP ${res.status}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as TestPayload;
    let result;
    switch (payload.connection_type) {
      case "supabase_external": result = await testSupabase(payload.config); break;
      case "bitrix24":          result = await testBitrix(payload.config); break;
      case "n8n":               result = await testN8n(payload.config); break;
      case "mcp_claude":        result = await testMcpClaude(payload.config); break;
      case "custom":            result = await testCustom(payload.config); break;
      default: throw new Error("Tipo de conexão desconhecido");
    }

    if (payload.connection_id) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await admin.from("connection_configs").update({
        last_tested_at: new Date().toISOString(),
        last_test_status: "success",
        last_test_latency_ms: result.latency_ms,
        last_test_message: result.message,
      }).eq("id", payload.connection_id);
      await admin.from("connection_test_logs").insert({
        connection_id: payload.connection_id,
        status: "success",
        latency_ms: result.latency_ms,
        message: result.message,
        tested_by: claims.claims.sub,
      });
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    try {
      const body = (await req.clone().json()) as TestPayload;
      if (body.connection_id) {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await admin.from("connection_configs").update({
          last_tested_at: new Date().toISOString(),
          last_test_status: "error",
          last_test_message: message,
        }).eq("id", body.connection_id);
        await admin.from("connection_test_logs").insert({
          connection_id: body.connection_id,
          status: "error",
          message,
        });
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
