import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entityType, entityId, entityData, webhookUrl } = await req.json();

    if (!entityType || !entityId) {
      return new Response(JSON.stringify({ error: 'entityType and entityId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create lux_intelligence record
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: luxRecord, error: insertError } = await serviceClient
      .from('lux_intelligence')
      .insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating lux record:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create intelligence record' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build callback URL for n8n to send results back
    const callbackUrl = `${supabaseUrl}/functions/v1/lux-webhook`;

    // Trigger n8n webhook (fire and forget)
    const n8nWebhookUrl = webhookUrl || Deno.env.get('N8N_LUX_WEBHOOK_URL');
    
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            luxRecordId: luxRecord.id,
            entityType,
            entityId,
            entityData,
            userId: user.id,
            callbackUrl,
          }),
        });
        console.log('n8n webhook triggered successfully');
      } catch (webhookError) {
        console.error('Error triggering n8n webhook:', webhookError);
        // Update status to error
        await serviceClient
          .from('lux_intelligence')
          .update({ status: 'error', error_message: 'Failed to trigger n8n workflow' })
          .eq('id', luxRecord.id);
      }
    } else {
      console.warn('N8N_LUX_WEBHOOK_URL not configured');
      await serviceClient
        .from('lux_intelligence')
        .update({ status: 'error', error_message: 'n8n webhook URL not configured' })
        .eq('id', luxRecord.id);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      luxRecordId: luxRecord.id,
      message: 'Lux intelligence scan started' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in lux-trigger:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
