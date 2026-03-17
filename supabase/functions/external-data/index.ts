import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The external DB already uses the same column names as the SINGU schema,
// so no mapping is needed. Data passes through as-is.

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

    const allowedColumns = ['name', 'email', 'phone', 'company', 'tags', 'status', 'first_name', 'last_name', 'city', 'state', 'role', 'created_at', 'updated_at'];
    if (filters) {
      for (const filter of filters) {
        if (!allowedColumns.includes(filter.column)) {
          return new Response(JSON.stringify({ error: `Invalid filter column: ${filter.column}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }
    if (search?.columns) {
      for (const col of search.columns) {
        if (!allowedColumns.includes(col)) {
          return new Response(JSON.stringify({ error: `Invalid search column: ${col}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    let query = externalClient.from(table).select(select || '*', { count: 'exact' });

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

    const { data, error, count } = await query;

    if (error) {
      console.error('External DB query error:', error);
      throw new Error(`External query failed: ${error.message}`);
    }

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
