import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mcp-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * MCP Server (Streamable HTTP, JSON-RPC 2.0) para o Claude.
 * Auth: header X-MCP-Token (deve corresponder a uma connection_config tipo mcp_claude ativa).
 * Rate limit: 120 req/min por token.
 * Métodos: initialize, tools/list, tools/call (search_contacts, search_companies, list_deals).
 */

const limiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: "Limite de requisições MCP atingido. Aguarde 1 minuto.",
});

const JsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().min(1).max(64),
  params: z.record(z.unknown()).optional(),
});

const ToolsCallSchema = z.object({
  name: z.string().min(1).max(64),
  arguments: z.record(z.unknown()).optional().default({}),
});

const TOOLS = [
  {
    name: "search_contacts",
    description: "Busca contatos no CRM por nome ou email",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number", default: 10 } },
      required: ["query"],
    },
  },
  {
    name: "search_companies",
    description: "Busca empresas por nome",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "number", default: 10 } },
      required: ["query"],
    },
  },
  {
    name: "list_deals",
    description: "Lista oportunidades em aberto",
    inputSchema: {
      type: "object",
      properties: { stage: { type: "string" }, limit: { type: "number", default: 20 } },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>, admin: ReturnType<typeof createClient>) {
  const limit = Math.min(Number(args.limit ?? 10), 100);
  if (name === "search_contacts") {
    const q = String(args.query ?? "").slice(0, 200);
    const { data } = await admin.from("contacts")
      .select("id,first_name,last_name,email,phone")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "search_companies") {
    const q = String(args.query ?? "").slice(0, 200);
    const { data } = await admin.from("companies").select("id,name,cnpj,industry").ilike("name", `%${q}%`).limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "list_deals") {
    const stage = args.stage ? String(args.stage).slice(0, 64) : null;
    let q = admin.from("deals").select("id,title,value,stage,company_id").limit(limit);
    if (stage) q = q.eq("stage", stage);
    const { data } = await q;
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  throw new Error(`Tool desconhecida: ${name}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = req.headers.get("x-mcp-token");
  if (!token) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Missing X-MCP-Token" }, id: null }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit por token
  const limited = limiter.check(`mcp:${token}`);
  if (limited) return limited;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: conn } = await admin
    .from("connection_configs")
    .select("id,is_active,config")
    .eq("connection_type", "mcp_claude")
    .eq("is_active", true)
    .filter("config->>token", "eq", token)
    .maybeSingle();

  if (!conn) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Token MCP inválido" }, id: null }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let rawBody: unknown;
  try { rawBody = await req.json(); }
  catch {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = JsonRpcSchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0", id: null,
      error: { code: -32600, message: "Invalid Request", data: parsed.error.flatten() },
    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const body = parsed.data;

  try {
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "singu-crm-mcp", version: "1.1.0" },
        };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call": {
        const callParsed = ToolsCallSchema.safeParse(body.params ?? {});
        if (!callParsed.success) {
          return new Response(JSON.stringify({
            jsonrpc: "2.0", id: body.id ?? null,
            error: { code: -32602, message: "Invalid params", data: callParsed.error.flatten() },
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        result = await callTool(callParsed.data.name, callParsed.data.arguments, admin);
        break;
      }
      case "ping":
        result = {};
        break;
      default:
        return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: `Método ${body.method} não suportado` }, id: body.id ?? null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? null, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id ?? null, error: { code: -32000, message } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
