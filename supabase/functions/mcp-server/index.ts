import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-mcp-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * MCP Server (Streamable HTTP, JSON-RPC 2.0) para o Claude.
 * Auth: header X-MCP-Token (deve corresponder a uma connection_config tipo mcp_claude ativa).
 * Métodos: initialize, tools/list, tools/call (search_contacts, search_companies, list_deals).
 */

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
  const limit = Number(args.limit ?? 10);
  if (name === "search_contacts") {
    const q = String(args.query ?? "");
    const { data } = await admin.from("contacts")
      .select("id,first_name,last_name,email,phone")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "search_companies") {
    const q = String(args.query ?? "");
    const { data } = await admin.from("companies").select("id,name,cnpj,industry").ilike("name", `%${q}%`).limit(limit);
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  }
  if (name === "list_deals") {
    const stage = args.stage ? String(args.stage) : null;
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

  let body: { jsonrpc: string; id: number | string | null; method: string; params?: Record<string, unknown> };
  try { body = await req.json(); }
  catch {
    return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "singu-crm-mcp", version: "1.0.0" },
        };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call": {
        const params = body.params ?? {};
        result = await callTool(String(params.name), (params.arguments ?? {}) as Record<string, unknown>, admin);
        break;
      }
      case "ping":
        result = {};
        break;
      default:
        return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32601, message: `Método ${body.method} não suportado` }, id: body.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro";
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, error: { code: -32000, message } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
