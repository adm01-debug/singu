import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_TABLES = [
  'companies', 'contacts', 'interactions', 'insights', 'alerts',
  'activities', 'life_events', 'contact_phones', 'contact_emails',
  'contact_addresses', 'contact_social_media', 'contact_relatives',
  'contact_cadence', 'contact_preferences', 'contact_time_analysis',
  'communication_preferences', 'client_values', 'decision_criteria',
  'disc_analysis_history', 'disc_communication_logs', 'disc_conversion_metrics',
  'disc_profile_config', 'eq_analysis_history', 'cognitive_bias_history',
  'emotional_anchors', 'emotional_states_history', 'hidden_objections',
  'health_alerts', 'health_alert_settings', 'compatibility_alerts',
  'compatibility_settings', 'automation_rules', 'automation_logs',
  'favorite_templates', 'lux_intelligence', 'metaprogram_analysis',
  'vak_analysis_history', 'rfm_analysis', 'offer_suggestions',
  'trigger_bundles', 'trigger_intensity_history',
  // Company normalized tables
  'company_phones', 'company_emails', 'company_addresses',
  'company_social_media', 'company_cnaes', 'company_rfm_scores',
  'company_stakeholder_map',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;
const STATEMENT_TIMEOUT_MS = 15000;

function getExternalClient() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('External database credentials not configured');
  return createClient(url, key, {
    db: { schema: 'public' },
    global: { headers: { 'x-statement-timeout': String(STATEMENT_TIMEOUT_MS) } },
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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries && lastError.message.includes('statement timeout')) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const body = await req.json();
    const { action, table } = body;
    const operation = action || 'select';

    // ─── LIST TABLES (schema discovery) ───
    if (operation === 'list_tables') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();
      const tableNames = swagger?.definitions
        ? Object.keys(swagger.definitions)
        : swagger?.paths
          ? Object.keys(swagger.paths).map((p: string) => p.replace('/', ''))
          : [];
      return jsonResponse({ tables: tableNames });
    }

    // ─── FULL SCHEMA INTROSPECTION ───
    if (operation === 'schema') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();
      
      const tables: Record<string, { columns: { name: string; type: string; format: string; required: boolean; description?: string }[] }> = {};
      
      if (swagger?.definitions) {
        for (const [tableName, def] of Object.entries(swagger.definitions)) {
          const d = def as Record<string, unknown>;
          const props = (d.properties || {}) as Record<string, Record<string, unknown>>;
          const required = (d.required || []) as string[];
          const columns = Object.entries(props).map(([colName, colDef]) => ({
            name: colName,
            type: (colDef.type as string) || (colDef.anyOf ? 'nullable' : 'unknown'),
            format: (colDef.format as string) || '',
            required: required.includes(colName),
            ...(colDef.description ? { description: colDef.description as string } : {}),
            ...(colDef.default !== undefined ? { default: colDef.default } : {}),
            ...(colDef.maxLength ? { maxLength: colDef.maxLength } : {}),
            ...(colDef.enum ? { enum: colDef.enum } : {}),
          }));
          tables[tableName] = { columns };
        }
      }

      // Also try to get functions via rpc endpoint
      let functions: string[] = [];
      try {
        const rpcResp = await fetch(`${extUrl}/rest/v1/rpc/`, {
          headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
        });
        if (rpcResp.ok) {
          const rpcData = await rpcResp.json();
          functions = Array.isArray(rpcData) ? rpcData : Object.keys(rpcData || {});
        }
      } catch (_) { /* ignore */ }

      return jsonResponse({ 
        tableCount: Object.keys(tables).length,
        tables,
        functions,
      });
    }

    // ─── DISTINCT VALUES ───
    if (operation === 'distinct') {
      const { column } = body;
      if (!table || !isAllowedTable(table)) return errorResponse('Invalid table');
      if (!column || typeof column !== 'string') return errorResponse('Missing "column" for distinct');

      const client = getExternalClient();
      // Fetch up to 1000 rows of just that column, then dedupe client-side
      const { data, error } = await client
        .from(table)
        .select(column)
        .not(column, 'is', null)
        .neq(column, '')
        .order(column, { ascending: true })
        .limit(5000);

      if (error) throw new Error(`Distinct failed: ${error.message}`);

      const unique = [...new Set((data || []).map((r: Record<string, string>) => r[column]).filter(Boolean))].sort();
      return jsonResponse({ values: unique, count: unique.length });
    }

    if (!table || typeof table !== 'string' || !isAllowedTable(table)) {
      return errorResponse(`Invalid table "${table}". Only allowed tables are permitted.`);
    }

    const client = getExternalClient();

    // ─── SELECT (read) ───
    if (operation === 'select') {
      const { filters, select, order, range, search } = body;

      const result = await withRetry(async () => {
        let query = client.from(table).select(select || '*', { count: 'exact' });

        if (search?.term && typeof search.term === 'string' && search.term.trim()) {
          const term = `%${search.term.trim()}%`;
          const columns: string[] = Array.isArray(search.columns) ? search.columns : [];
          if (columns.length > 0) {
            query = query.or(columns.map((col: string) => `${col}.ilike.${term}`).join(','));
          }
        }

        if (Array.isArray(filters)) {
          for (const f of filters) {
            if (!f.column || !f.type) continue;
            switch (f.type) {
              case 'eq': query = query.eq(f.column, f.value); break;
              case 'ilike': query = query.ilike(f.column, f.value); break;
              case 'in': query = query.in(f.column, f.value); break;
              case 'neq': query = query.neq(f.column, f.value); break;
              case 'is': query = query.is(f.column, f.value); break;
              case 'gt': query = query.gt(f.column, f.value); break;
              case 'gte': query = query.gte(f.column, f.value); break;
              case 'lt': query = query.lt(f.column, f.value); break;
              case 'lte': query = query.lte(f.column, f.value); break;
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

      return jsonResponse(result);
    }

    // ─── INSERT (create) ───
    if (operation === 'insert') {
      const { record } = body;
      if (!record || typeof record !== 'object') return errorResponse('Missing or invalid "record" for insert');

      const { data, error } = await client.from(table).insert(record).select().single();
      if (error) throw new Error(`Insert failed: ${error.message}`);
      return jsonResponse({ data });
    }

    // ─── UPDATE ───
    if (operation === 'update') {
      const { id, updates } = body;
      if (!id) return errorResponse('Missing "id" for update');
      if (!updates || typeof updates !== 'object') return errorResponse('Missing or invalid "updates" for update');

      const { data, error } = await client.from(table).update(updates).eq('id', id).select().single();
      if (error) throw new Error(`Update failed: ${error.message}`);
      return jsonResponse({ data });
    }

    // ─── DELETE ───
    if (operation === 'delete') {
      const { id } = body;
      if (!id) return errorResponse('Missing "id" for delete');

      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(`Delete failed: ${error.message}`);
      return jsonResponse({ success: true });
    }

    return errorResponse(`Unknown action: ${operation}`);

  } catch (error) {
    const elapsed = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[external-data] Error after ${elapsed}ms:`, message);

    const status = message.includes('timeout') ? 504 : 500;
    return errorResponse(message, status);
  }
});
