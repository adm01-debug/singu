import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapear campos de companies do banco externo para o formato RelateIQ
function mapCompany(ext: any): any {
  return {
    id: ext.id,
    name: ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome',
    industry: ext.ramo_atividade || null,
    email: ext.email || null,
    phone: ext.phone || ext.telefone || null,
    website: ext.website || null,
    address: ext.address || ext.endereco || null,
    city: ext.city || ext.cidade || null,
    state: ext.state || ext.uf || null,
    annual_revenue: ext.annual_revenue || null,
    employee_count: ext.employee_count || null,
    financial_health: ext.financial_health || null,
    logo_url: ext.logo_url || null,
    notes: ext.notes || null,
    tags: ext.tags_array || ext.tags || [],
    challenges: ext.challenges || [],
    competitors: ext.competitors || [],
    user_id: ext.user_id || '',
    created_at: ext.created_at,
    updated_at: ext.updated_at,
  };
}

// Mapear campos de contacts do banco externo para o formato RelateIQ
function mapContact(ext: any): any {
  return {
    id: ext.id,
    first_name: ext.first_name || '',
    last_name: ext.last_name || '',
    email: ext.email || null,
    phone: ext.phone || ext.telefone || null,
    whatsapp: ext.whatsapp || ext.celular || null,
    role: ext.role || null,
    role_title: ext.role_title || ext.cargo || null,
    company_id: ext.company_id || null,
    birthday: ext.birthday || ext.data_nascimento || null,
    relationship_score: ext.relationship_score || 0,
    relationship_stage: ext.relationship_stage || 'unknown',
    sentiment: ext.sentiment || 'neutral',
    tags: ext.tags_array || ext.tags || [],
    hobbies: ext.hobbies || [],
    interests: ext.interests_array || ext.interests || [],
    avatar_url: ext.avatar_url || null,
    linkedin: ext.linkedin || null,
    instagram: ext.instagram || null,
    twitter: ext.twitter || null,
    notes: ext.notes || null,
    personal_notes: ext.personal_notes || null,
    family_info: ext.family_info || null,
    behavior: ext.behavior || null,
    life_events: ext.life_events || [],
    user_id: ext.user_id || '',
    created_at: ext.created_at,
    updated_at: ext.updated_at,
  };
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

    const { table, filters, select, order, range } = await req.json();

    if (!table || !['companies', 'contacts'].includes(table)) {
      throw new Error('Invalid table. Only "companies" and "contacts" are allowed.');
    }

    let query = externalClient.from(table).select(select || '*', { count: 'exact' });

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

    // Map data to RelateIQ format
    const mappedData = (data || []).map((item: any) => {
      if (table === 'companies') return mapCompany(item);
      if (table === 'contacts') return mapContact(item);
      return item;
    });

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
