import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      luxRecordId,
      serviceRoleKey,
      status,
      socialProfiles,
      socialAnalysis,
      fiscalData,
      stakeholders,
      audienceAnalysis,
      personalProfile,
      aiReport,
      aiSummary,
      fieldsUpdated,
      n8nExecutionId,
      errorMessage,
      // Fields to update on the entity itself
      entityUpdates,
    } = payload;

    if (!luxRecordId) {
      return new Response(JSON.stringify({ error: 'luxRecordId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const key = serviceRoleKey || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, key);

    // Update the lux_intelligence record
    const updateData: Record<string, any> = {
      status: status || 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (socialProfiles) updateData.social_profiles = socialProfiles;
    if (socialAnalysis) updateData.social_analysis = socialAnalysis;
    if (fiscalData) updateData.fiscal_data = fiscalData;
    if (stakeholders) updateData.stakeholders = stakeholders;
    if (audienceAnalysis) updateData.audience_analysis = audienceAnalysis;
    if (personalProfile) updateData.personal_profile = personalProfile;
    if (aiReport) updateData.ai_report = aiReport;
    if (aiSummary) updateData.ai_summary = aiSummary;
    if (fieldsUpdated) updateData.fields_updated = fieldsUpdated;
    if (n8nExecutionId) updateData.n8n_execution_id = n8nExecutionId;
    if (errorMessage) updateData.error_message = errorMessage;

    const { error: updateError } = await supabase
      .from('lux_intelligence')
      .update(updateData)
      .eq('id', luxRecordId);

    if (updateError) {
      console.error('Error updating lux record:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update record' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If there are entity updates, apply them
    if (entityUpdates) {
      const { data: luxRecord } = await supabase
        .from('lux_intelligence')
        .select('entity_type, entity_id, user_id')
        .eq('id', luxRecordId)
        .single();

      if (luxRecord) {
        const table = luxRecord.entity_type === 'company' ? 'companies' : 'contacts';
        await supabase
          .from(table)
          .update(entityUpdates)
          .eq('id', luxRecord.entity_id);
      }
    }

    // If stakeholders were found, auto-create contacts
    if (stakeholders && Array.isArray(stakeholders) && stakeholders.length > 0) {
      const { data: luxRecord } = await supabase
        .from('lux_intelligence')
        .select('entity_id, user_id')
        .eq('id', luxRecordId)
        .single();

      if (luxRecord) {
        for (const stakeholder of stakeholders) {
          try {
            await supabase.from('contacts').insert({
              user_id: luxRecord.user_id,
              company_id: luxRecord.entity_id,
              first_name: stakeholder.first_name || stakeholder.name?.split(' ')[0] || 'Unknown',
              last_name: stakeholder.last_name || stakeholder.name?.split(' ').slice(1).join(' ') || '',
              role_title: stakeholder.role_title || stakeholder.position || null,
              email: stakeholder.email || null,
              phone: stakeholder.phone || null,
              linkedin: stakeholder.linkedin || null,
            });
          } catch (e) {
            console.error('Error creating stakeholder contact:', e);
          }
        }
      }
    }

    console.log(`Lux record ${luxRecordId} updated successfully`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lux-webhook:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
