import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionRequest {
  action: 'list-instances' | 'instance-info' | 'fetch-messages' | 'send-message' | 'check-number';
  instanceName?: string;
  remoteJid?: string;
  message?: string;
  phoneNumber?: string;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API credentials not configured');
    }

    const baseUrl = evolutionUrl.replace(/\/$/, '');
    const headers = {
      'Content-Type': 'application/json',
      'apikey': evolutionKey,
    };

    const { action, instanceName, remoteJid, message, phoneNumber, limit = 20 }: EvolutionRequest = await req.json();

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      case 'list-instances':
        endpoint = '/instance/fetchInstances';
        break;

      case 'instance-info':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/connectionState/${instanceName}`;
        break;

      case 'fetch-messages':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findMessages/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          where: remoteJid ? { key: { remoteJid } } : {},
          limit,
        });
        break;

      case 'send-message':
        if (!instanceName || !remoteJid || !message) {
          throw new Error('instanceName, remoteJid and message required');
        }
        endpoint = `/message/sendText/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          number: remoteJid.replace('@s.whatsapp.net', ''),
          text: message,
        });
        break;

      case 'check-number':
        if (!instanceName || !phoneNumber) {
          throw new Error('instanceName and phoneNumber required');
        }
        endpoint = `/chat/whatsappNumbers/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          numbers: [phoneNumber],
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Evolution API call: ${method} ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Evolution API error:', data);
      throw new Error(data.message || 'Evolution API error');
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evolution API function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
