import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

interface EvolutionRequest {
  action: string;
  instanceName?: string;
  remoteJid?: string;
  message?: string;
  phoneNumber?: string;
  limit?: number;
  body?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateCheck = checkRateLimit(`evolution-api:${clientIP}`, { maxRequests: 30, windowMs: 60000 });
    if (!rateCheck.allowed) {
      return rateLimitResponse(corsHeaders, rateCheck.resetAt);
    }

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

    const { action, instanceName, remoteJid, message, phoneNumber, limit = 20, body: extraBody }: EvolutionRequest = await req.json();

    let endpoint = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      // ========================
      // INSTANCE MANAGEMENT
      // ========================
      case 'list-instances':
        endpoint = '/instance/fetchInstances';
        break;

      case 'instance-info':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/connectionState/${instanceName}`;
        break;

      case 'instance-detail':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/fetchInstances?instanceName=${instanceName}`;
        break;

      case 'create-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = '/instance/create';
        method = 'POST';
        body = JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          ...extraBody,
        });
        break;

      case 'connect-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/connect/${instanceName}`;
        break;

      case 'restart-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/restart/${instanceName}`;
        method = 'PUT';
        break;

      case 'logout-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/logout/${instanceName}`;
        method = 'DELETE';
        break;

      case 'delete-instance':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/delete/${instanceName}`;
        method = 'DELETE';
        break;

      case 'set-presence':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/instance/setPresence/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody || { presence: 'available' });
        break;

      // ========================
      // MESSAGING
      // ========================
      case 'send-message':
        if (!instanceName || !remoteJid || !message) {
          throw new Error('instanceName, remoteJid and message required');
        }
        endpoint = `/message/sendText/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          number: remoteJid.replace('@s.whatsapp.net', ''),
          text: message,
          ...(extraBody || {}),
        });
        break;

      case 'send-media':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendMedia/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-audio':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendWhatsAppAudio/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-location':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendLocation/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-contact':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendContact/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-reaction':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendReaction/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-poll':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendPoll/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-list':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendList/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-buttons':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendButtons/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'send-sticker':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/sendSticker/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'mark-read':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/markMessageAsRead/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'mark-unread':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/markMessageAsUnread/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'archive-chat':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/archiveChat/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'delete-message':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/delete/${instanceName}`;
        method = 'DELETE';
        body = JSON.stringify(extraBody);
        break;

      case 'edit-message':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/message/update/${instanceName}`;
        method = 'PUT';
        body = JSON.stringify(extraBody);
        break;

      // ========================
      // CHAT MANAGEMENT
      // ========================
      case 'fetch-chats':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findChats/${instanceName}`;
        break;

      case 'fetch-messages':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findMessages/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          where: remoteJid ? { key: { remoteJid } } : {},
          limit,
          ...(extraBody || {}),
        });
        break;

      case 'check-number':
        if (!instanceName || !phoneNumber) {
          throw new Error('instanceName and phoneNumber required');
        }
        endpoint = `/chat/whatsappNumbers/${instanceName}`;
        method = 'POST';
        body = JSON.stringify({
          numbers: Array.isArray(phoneNumber) ? phoneNumber : [phoneNumber],
        });
        break;

      case 'find-contacts':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/findContacts/${instanceName}`;
        break;

      case 'download-media':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/chat/getBase64FromMediaMessage/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      // ========================
      // GROUP MANAGEMENT
      // ========================
      case 'list-groups':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/fetchAllGroups/${instanceName}`;
        break;

      case 'group-info':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/findGroupInfos/${instanceName}?groupJid=${extraBody?.groupJid || ''}`;
        break;

      case 'group-participants':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/participants/${instanceName}?groupJid=${extraBody?.groupJid || ''}`;
        break;

      case 'create-group':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/create/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'update-group-participants':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/group/updateParticipant/${instanceName}`;
        method = 'PUT';
        body = JSON.stringify(extraBody);
        break;

      // ========================
      // PROFILE
      // ========================
      case 'fetch-profile':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchProfile/${instanceName}`;
        break;

      case 'fetch-profile-picture':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchProfilePicture/${instanceName}`;
        if (extraBody?.number) {
          endpoint += `?number=${extraBody.number}`;
        }
        break;

      case 'fetch-business-profile':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/profile/fetchBusinessProfile/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      // ========================
      // LABELS
      // ========================
      case 'list-labels':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/label/findLabels/${instanceName}`;
        break;

      case 'handle-label':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/label/handleLabel/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      // ========================
      // WEBHOOK CONFIG
      // ========================
      case 'set-webhook':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/webhook/set/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'find-webhook':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/webhook/find/${instanceName}`;
        break;

      // ========================
      // SETTINGS
      // ========================
      case 'set-settings':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/settings/set/${instanceName}`;
        method = 'POST';
        body = JSON.stringify(extraBody);
        break;

      case 'find-settings':
        if (!instanceName) throw new Error('instanceName required');
        endpoint = `/settings/find/${instanceName}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Evolution API call: ${method} ${baseUrl}${endpoint}`);

    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Evolution API error:', data);
      throw new Error(data.message || data.error || 'Evolution API error');
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
