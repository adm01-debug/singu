import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SLOW_QUERY_THRESHOLD_MS = 3000;
const VERY_SLOW_QUERY_THRESHOLD_MS = 8000;

function emitTelemetry(meta: {
  operation: string;
  table?: string;
  rpcName?: string;
  limit?: number;
  offset?: number;
  countMode?: string;
  durationMs: number;
  recordCount?: number;
  status: 'ok' | 'error' | 'slow' | 'very_slow';
  error?: string;
  userId?: string | null;
}) {
  const icon = meta.status === 'very_slow' ? '🔴'
    : meta.status === 'slow' ? '🟡'
    : meta.status === 'error' ? '❌'
    : '✅';

  const target = meta.rpcName || meta.table || 'unknown';
  const line = `${icon} [telemetry] ${meta.operation}:${target} ${meta.durationMs}ms` +
    ` | records=${meta.recordCount ?? '-'}` +
    ` limit=${meta.limit ?? '-'}` +
    ` offset=${meta.offset ?? '-'}` +
    ` count=${meta.countMode ?? '-'}`;

  if (meta.status === 'very_slow') {
    console.warn(`⚠️ VERY SLOW QUERY: ${line}`);
  } else if (meta.status === 'slow') {
    console.warn(`⚠️ SLOW QUERY: ${line}`);
  } else if (meta.status === 'error') {
    console.error(line + ` error=${meta.error}`);
  } else {
    console.info(line);
  }

  // Fire-and-forget persistence (only for non-ok status)
  if (meta.status !== 'ok') {
    try {
      const localUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (localUrl && serviceKey) {
        const localClient = createClient(localUrl, serviceKey);
        localClient.from('query_telemetry').insert({
          operation: meta.operation,
          table_name: meta.table || null,
          rpc_name: meta.rpcName || null,
          duration_ms: meta.durationMs,
          record_count: meta.recordCount ?? null,
          query_limit: meta.limit ?? null,
          query_offset: meta.offset ?? null,
          count_mode: meta.countMode || null,
          severity: meta.status,
          error_message: meta.error || null,
          user_id: meta.userId || null,
        }).then(({ error: insertErr }) => {
          if (insertErr) console.warn('[telemetry-persist] Insert failed:', insertErr.message);
        });
      }
    } catch (_e) {
      // Fire-and-forget: NEVER block the main response
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EXTERNAL_URL = Deno.env.get('EXTERNAL_SUPABASE_URL');
    const EXTERNAL_KEY = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');

    if (!EXTERNAL_URL || !EXTERNAL_KEY) {
      throw new Error('External database credentials not configured');
    }

    const externalClient = createClient(EXTERNAL_URL, EXTERNAL_KEY);

    const { table, filters, select, order, range, search } = await req.json();

    if (!table || !['companies', 'contacts'].includes(table)) {
      throw new Error('Invalid table. Only "companies" and "contacts" are allowed.');
    }

    // Extract pagination metadata for telemetry
    const queryLimit = range ? (range.to - range.from + 1) : undefined;
    const queryOffset = range?.from ?? undefined;
    const countMode = 'exact';

    // Extract user ID from auth header
    let userId: string | null = null;
    try {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || null;
      }
    } catch (_) { /* ignore */ }

    let query = externalClient.from(table).select(select || '*', { count: countMode });

    // Apply search (OR across multiple columns)
    if (search && search.term) {
      const term = `%${search.term}%`;
      const columns = search.columns || [];
      if (columns.length > 0) {
        const orConditions = columns.map((col: string) => `${col}.ilike.${term}`).join(',');
        query = query.or(orConditions);
      }
    }

    // Apply filters
    if (filters) {
      for (const filter of filters) {
        if (filter.type === 'eq') {
          query = query.eq(filter.column, filter.value);
        } else if (filter.type === 'ilike') {
          query = query.ilike(filter.column, filter.value);
        } else if (filter.type === 'in') {
          query = query.in(filter.column, filter.value);
        }
      }
    }

    // Apply ordering
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }

    // Apply range for pagination
    if (range) {
      query = query.range(range.from, range.to);
    }

    // ─── Measure query execution time ───
    const startTime = performance.now();
    const { data, error, count } = await query;
    const durationMs = Math.round(performance.now() - startTime);

    // ─── Classify and emit telemetry ───
    if (error) {
      emitTelemetry({
        operation: 'select',
        table,
        limit: queryLimit,
        offset: queryOffset,
        countMode,
        durationMs,
        status: 'error',
        error: error.message,
        userId,
      });
      console.error('External DB query error:', error);
      throw new Error(`External query failed: ${error.message}`);
    }

    const selectStatus = durationMs >= VERY_SLOW_QUERY_THRESHOLD_MS ? 'very_slow'
      : durationMs >= SLOW_QUERY_THRESHOLD_MS ? 'slow'
      : 'ok';

    emitTelemetry({
      operation: 'select',
      table,
      limit: queryLimit,
      offset: queryOffset,
      countMode,
      durationMs,
      status: selectStatus,
      recordCount: data?.length ?? 0,
      userId,
    });

    const mappedData = data || [];

    return new Response(JSON.stringify({ data: mappedData, count }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in external-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
