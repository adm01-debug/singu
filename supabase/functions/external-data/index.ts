import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALLOWED_TABLES = ['companies', 'contacts'];

function getExternalClient() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('External database credentials not configured');
  return createClient(url, key, {
    db: { schema: 'public' },
    global: { headers: { 'x-statement-timeout': '8000' } },
  });
}

function getUserId(req: Request): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      const payload = JSON.parse(atob(auth.substring(7).split('.')[1]));
      return payload.sub || null;
    }
  } catch (_) { /* ignore */ }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, table } = body;

    const client = getExternalClient();
    const operation = action || 'select';

    // ─── LIST TABLES (schema discovery) ───
    if (operation === 'list_tables') {
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetch(`${extUrl}/rest/v1/`, {
        headers: {
          'apikey': extKey,
          'Authorization': `Bearer ${extKey}`,
        }
      });
      const swagger = await resp.json();
      const tableNames = swagger?.definitions ? Object.keys(swagger.definitions) : swagger?.paths ? Object.keys(swagger.paths).map((p: string) => p.replace('/', '')) : [];
      return jsonResponse({ tables: tableNames });
    }

    if (!table || !ALLOWED_TABLES.includes(table)) {
      throw new Error('Invalid table. Only allowed tables are permitted.');
    }

    // ─── SELECT (read) ───
    if (operation === 'select') {
      const { filters, select, order, range, search } = body;

      let query = client.from(table).select(select || '*', { count: 'exact' });

      if (search?.term) {
        const term = `%${search.term}%`;
        const columns = search.columns || [];
        if (columns.length > 0) {
          query = query.or(columns.map((col: string) => `${col}.ilike.${term}`).join(','));
        }
      }

      if (filters) {
        for (const f of filters) {
          if (f.type === 'eq') query = query.eq(f.column, f.value);
          else if (f.type === 'ilike') query = query.ilike(f.column, f.value);
          else if (f.type === 'in') query = query.in(f.column, f.value);
          else if (f.type === 'neq') query = query.neq(f.column, f.value);
          else if (f.type === 'is') query = query.is(f.column, f.value);
        }
      }

      if (order) query = query.order(order.column, { ascending: order.ascending ?? false });
      const queryRange = range || { from: 0, to: 49 };
      query = query.range(queryRange.from, queryRange.to);

      const { data, error, count } = await query;
      if (error) throw new Error(`Select failed: ${error.message}`);

      return jsonResponse({ data: data || [], count });
    }

    // ─── INSERT (create) ───
    if (operation === 'insert') {
      const { record } = body;
      if (!record) throw new Error('Missing "record" for insert');

      const { data, error } = await client.from(table).insert(record).select().single();
      if (error) throw new Error(`Insert failed: ${error.message}`);

      return jsonResponse({ data });
    }

    // ─── UPDATE ───
    if (operation === 'update') {
      const { id, updates } = body;
      if (!id || !updates) throw new Error('Missing "id" or "updates" for update');

      const { data, error } = await client.from(table).update(updates).eq('id', id).select().single();
      if (error) throw new Error(`Update failed: ${error.message}`);

      return jsonResponse({ data });
    }

    // ─── DELETE ───
    if (operation === 'delete') {
      const { id } = body;
      if (!id) throw new Error('Missing "id" for delete');

      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw new Error(`Delete failed: ${error.message}`);

      return jsonResponse({ success: true });
    }

    throw new Error(`Unknown action: ${operation}`);

  } catch (error) {
    console.error('Error in external-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
