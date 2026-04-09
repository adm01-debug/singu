import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

const ALLOWED_TABLES = [
  "companies", "contacts", "interactions", "insights", "alerts",
  "activities", "life_events", "contact_phones", "contact_emails",
  "contact_addresses", "contact_social_media", "contact_relatives",
  "contact_cadence", "contact_preferences", "contact_time_analysis",
  "communication_preferences", "client_values", "decision_criteria",
  "disc_analysis_history", "disc_communication_logs", "disc_conversion_metrics",
  "disc_profile_config", "eq_analysis_history", "cognitive_bias_history",
  "emotional_anchors", "emotional_states_history", "hidden_objections",
  "health_alerts", "health_alert_settings", "compatibility_alerts",
  "compatibility_settings", "automation_rules", "automation_logs",
  "favorite_templates", "lux_intelligence", "metaprogram_analysis",
  "vak_analysis_history", "rfm_analysis", "offer_suggestions",
  "trigger_bundles", "trigger_intensity_history",
  "company_phones", "company_emails", "company_addresses",
  "company_social_media", "company_cnaes", "company_rfm_scores",
  "company_stakeholder_map",
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

const READ_OPERATIONS = ["select", "list_tables", "schema", "distinct"] as const;
const WRITE_OPERATIONS = ["insert", "update", "delete"] as const;

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
const STATEMENT_TIMEOUT_MS = 15000;

function getExternalClient() {
  const url = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const key = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("External database credentials not configured");
  return createClient(url, key, {
    db: { schema: "public" },
    global: { headers: { "x-statement-timeout": String(STATEMENT_TIMEOUT_MS) } },
  });
}

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

function clampRange(range?: { from: number; to: number }): { from: number; to: number } {
  const from = Math.max(0, range?.from ?? 0);
  const to = Math.min(range?.to ?? from + DEFAULT_PAGE_SIZE - 1, from + MAX_PAGE_SIZE - 1);
  return { from, to };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries && lastError.message.includes("statement timeout")) {
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

/**
 * isAdmin — Uses the existing has_role(uuid, app_role) RPC instead of a
 * redundant column. This was a fix from the exhaustive audit.
 */
async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) {
    console.error("[external-data] has_role check failed:", error.message);
    return false;
  }
  return data === true;
}

async function logAudit(
  callerUserId: string,
  operation: string,
  table: string,
  payload: unknown,
  outcome: "success" | "denied" | "error",
  req?: Request
) {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const ipAddress = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                      req?.headers.get("x-real-ip") || null;
    const userAgent = req?.headers.get("user-agent") || null;
    await supabase.from("external_data_audit_log").insert({
      user_id: callerUserId,
      operation,
      table_name: table,
      payload,
      outcome,
      ip_address: ipAddress,
      user_agent: userAgent?.slice(0, 500),
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: All requests must be authenticated
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const callerUserId = authResult;

  const startTime = performance.now();

  try {
    const body = await req.json();
    const { action, table } = body;
    const operation = action || "select";

    // 🔒 SECURITY: Write operations require admin role (via existing has_role RPC)
    if ((WRITE_OPERATIONS as readonly string[]).includes(operation)) {
      const admin = await isAdmin(callerUserId);
      if (!admin) {
        await logAudit(callerUserId, operation, table || "(no table)", body, "denied", req);
        return jsonError("Forbidden: write operations require admin role", 403);
      }
    } else if (!(READ_OPERATIONS as readonly string[]).includes(operation)) {
      return jsonError(`Unknown operation: ${operation}`, 400);
    }

    // ─── LIST TABLES ───
    if (operation === "list_tables") {
      const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
      const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { apikey: extKey, Authorization: `Bearer ${extKey}` },
      });
      const swagger = await resp.json();
      const tableNames = swagger?.definitions
        ? Object.keys(swagger.definitions)
        : swagger?.paths
        ? Object.keys(swagger.paths).map((p: string) => p.replace("/", ""))
        : [];
      return jsonOk({ tables: tableNames });
    }

    // ─── SCHEMA ───
    if (operation === "schema") {
      const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
      const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { apikey: extKey, Authorization: `Bearer ${extKey}` },
      });
      const swagger = await resp.json();

      const tables: Record<
        string,
        { columns: { name: string; type: string; format: string; required: boolean; description?: string }[] }
      > = {};

      if (swagger?.definitions) {
        for (const [tableName, def] of Object.entries(swagger.definitions)) {
          const d = def as Record<string, unknown>;
          const props = (d.properties || {}) as Record<string, Record<string, unknown>>;
          const required = (d.required || []) as string[];
          const columns = Object.entries(props).map(([colName, colDef]) => ({
            name: colName,
            type: (colDef.type as string) || (colDef.anyOf ? "nullable" : "unknown"),
            format: (colDef.format as string) || "",
            required: required.includes(colName),
            ...(colDef.description ? { description: colDef.description as string } : {}),
            ...(colDef.default !== undefined ? { default: colDef.default } : {}),
            ...(colDef.maxLength ? { maxLength: colDef.maxLength } : {}),
            ...(colDef.enum ? { enum: colDef.enum } : {}),
          }));
          tables[tableName] = { columns };
        }
      }

      return jsonOk({ tableCount: Object.keys(tables).length, tables, functions: [] });
    }

    // ─── DISTINCT ───
    if (operation === "distinct") {
      const { column } = body;
      if (!table || !isAllowedTable(table)) return jsonError("Invalid table", 400);
      if (!column || typeof column !== "string") return jsonError('Missing "column" for distinct', 400);

      const client = getExternalClient();
      const { data, error } = await client
        .from(table)
        .select(column)
        .not(column, "is", null)
        .order(column, { ascending: true })
        .limit(5000);

      if (error) throw new Error(`Distinct failed: ${error.message}`);

      const unique = [
        ...new Set((data || []).map((r: Record<string, string>) => r[column]).filter(Boolean)),
      ].sort();
      return jsonOk({ values: unique, count: unique.length });
    }

    if (!table || typeof table !== "string" || !isAllowedTable(table)) {
      return jsonError(`Invalid table "${table}". Only allowed tables are permitted.`, 400);
    }

    const client = getExternalClient();

    // ─── SELECT ───
    if (operation === "select") {
      const { filters, select, order, range, search } = body;

      const result = await withRetry(async () => {
        let query = client.from(table).select(select || "*", { count: "exact" });

        if (search?.term && typeof search.term === "string" && search.term.trim()) {
          const term = `%${search.term.trim()}%`;
          const columns: string[] = Array.isArray(search.columns) ? search.columns : [];
          if (columns.length > 0) {
            query = query.or(columns.map((col: string) => `${col}.ilike.${term}`).join(","));
          }
        }

        if (Array.isArray(filters)) {
          for (const f of filters) {
            if (!f.column || !f.type) continue;
            switch (f.type) {
              case "eq": query = query.eq(f.column, f.value); break;
              case "ilike": query = query.ilike(f.column, f.value); break;
              case "in": query = query.in(f.column, f.value); break;
              case "neq": query = query.neq(f.column, f.value); break;
              case "is": query = query.is(f.column, f.value); break;
              case "gt": query = query.gt(f.column, f.value); break;
              case "gte": query = query.gte(f.column, f.value); break;
              case "lt": query = query.lt(f.column, f.value); break;
              case "lte": query = query.lte(f.column, f.value); break;
            }
          }
        }

        if (order?.column) query = query.order(order.column, { ascending: order.ascending ?? false });
        const clamped = clampRange(range);
        query = query.range(clamped.from, clamped.to);

        const { data, error, count } = await query;
        if (error) throw new Error(`Select failed: ${error.message}`);
        return { data: data || [], count };
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (elapsed > 5000) {
        console.warn(`[external-data] Slow query: ${table} took ${elapsed}ms`);
      }

      return jsonOk(result);
    }

    // ─── INSERT (admin only, audited) ───
    if (operation === "insert") {
      const { record } = body;
      if (!record || typeof record !== "object") return jsonError('Missing or invalid "record"', 400);

      const { data, error } = await client.from(table).insert(record).select().single();
      if (error) {
        await logAudit(callerUserId, "insert", table, body, "error", req);
        throw new Error(`Insert failed: ${error.message}`);
      }
      await logAudit(callerUserId, "insert", table, { id: data?.id }, "success", req);
      return jsonOk({ data });
    }

    // ─── UPDATE (admin only, audited) ───
    if (operation === "update") {
      const { id, updates } = body;
      if (!id) return jsonError('Missing "id" for update', 400);
      if (!updates || typeof updates !== "object") return jsonError('Missing or invalid "updates"', 400);

      const { data, error } = await client.from(table).update(updates).eq("id", id).select().single();
      if (error) {
        await logAudit(callerUserId, "update", table, body, "error", req);
        throw new Error(`Update failed: ${error.message}`);
      }
      await logAudit(callerUserId, "update", table, { id, fields: Object.keys(updates) }, "success", req);
      return jsonOk({ data });
    }

    // ─── DELETE (admin only, audited) ───
    if (operation === "delete") {
      const { id } = body;
      if (!id) return jsonError('Missing "id" for delete', 400);

      const { error } = await client.from(table).delete().eq("id", id);
      if (error) {
        await logAudit(callerUserId, "delete", table, body, "error", req);
        throw new Error(`Delete failed: ${error.message}`);
      }
      await logAudit(callerUserId, "delete", table, { id }, "success", req);
      return jsonOk({ success: true });
    }

    return jsonError(`Unknown action: ${operation}`, 400);
  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[external-data] Error after ${elapsed}ms:`, message);

    const status = message.includes("timeout") ? 504 : 500;
    return jsonError(message, status);
  }
});
