import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || 'https://singu.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('X-Webhook-Signature') || req.headers.get('X-Hub-Signature-256') || '';
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret) {
    return false; // Reject requests when WEBHOOK_SECRET is not configured
  }
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computed = 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(signature, computed);
}

interface BitrixCallEvent {
  event: string;
  data: {
    CALL_ID?: string;
    PHONE_NUMBER?: string;
    CALL_TYPE?: number; // 1 = outgoing, 2 = incoming
    CALL_DURATION?: number;
    CALL_START_DATE?: string;
    CALL_RECORD_URL?: string;
    PORTAL_USER_ID?: string;
    CRM_ENTITY_TYPE?: string;
    CRM_ENTITY_ID?: string;
    CALL_FAILED_CODE?: string;
    CALL_FAILED_REASON?: string;
  };
  auth?: {
    domain?: string;
    member_id?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const isValid = await verifyWebhookSignature(req, rawBody);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Bitrix24 sends data as form-urlencoded or JSON
    let payload: BitrixCallEvent;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = JSON.parse(rawBody);
    } else {
      // Handle form-urlencoded data from rawBody
      const params = new URLSearchParams(rawBody);
      payload = {
        event: params.get('event') || '',
        data: {
          CALL_ID: params.get('data[CALL_ID]') || undefined,
          PHONE_NUMBER: params.get('data[PHONE_NUMBER]') || undefined,
          CALL_TYPE: parseInt(params.get('data[CALL_TYPE]') || '') || undefined,
          CALL_DURATION: parseInt(params.get('data[CALL_DURATION]') || '') || undefined,
          CALL_START_DATE: params.get('data[CALL_START_DATE]') || undefined,
          CALL_RECORD_URL: params.get('data[CALL_RECORD_URL]') || undefined,
          PORTAL_USER_ID: params.get('data[PORTAL_USER_ID]') || undefined,
          CRM_ENTITY_TYPE: params.get('data[CRM_ENTITY_TYPE]') || undefined,
          CRM_ENTITY_ID: params.get('data[CRM_ENTITY_ID]') || undefined,
        }
      };
    }

    console.log('Bitrix24 webhook received:', JSON.stringify(payload, null, 2));

    // Handle call finish events
    const validEvents = ['ONVOXIMPLANTCALLEND', 'ONEXTERNALCALLFINISH', 'ONCRMCALLEND'];
    if (!validEvents.includes(payload.event?.toUpperCase())) {
      return new Response(JSON.stringify({ 
        status: 'ignored', 
        reason: 'not a call end event',
        event: payload.event 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data } = payload;
    
    // Clean phone number (remove country code formatting)
    let phoneNumber = data.PHONE_NUMBER?.replace(/\D/g, '') || '';
    if (phoneNumber.startsWith('55') && phoneNumber.length > 11) {
      phoneNumber = phoneNumber.substring(2); // Remove Brazil country code
    }

    const isOutgoing = data.CALL_TYPE === 1;
    const duration = data.CALL_DURATION || 0;
    const callDate = data.CALL_START_DATE ? new Date(data.CALL_START_DATE) : new Date();

    // Find contact by phone number
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id, first_name, last_name, company_id')
      .or(`phone.ilike.%${phoneNumber}%,whatsapp.ilike.%${phoneNumber}%`)
      .limit(1);

    if (contactError) {
      console.error('Error finding contact:', contactError);
      throw contactError;
    }

    if (!contacts || contacts.length === 0) {
      console.log(`No contact found for phone: ${phoneNumber}`);
      return new Response(JSON.stringify({ 
        status: 'skipped', 
        reason: 'contact not found',
        phone: phoneNumber 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contact = contacts[0];

    // Format duration as MM:SS
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Determine call outcome
    let callOutcome = 'Ligação completada';
    if (duration === 0) {
      callOutcome = data.CALL_FAILED_REASON || 'Ligação não atendida';
    }

    // Create interaction
    const interactionData = {
      contact_id: contact.id,
      company_id: contact.company_id,
      user_id: contact.user_id,
      type: 'call',
      title: isOutgoing 
        ? `Ligação Realizada para ${contact.first_name}` 
        : `Ligação Recebida de ${contact.first_name}`,
      content: `${callOutcome}\nDuração: ${durationFormatted}`,
      sentiment: duration > 0 ? 'neutral' : 'negative',
      initiated_by: isOutgoing ? 'us' : 'them',
      follow_up_required: duration === 0, // Follow up if call wasn't answered
      duration: duration,
      audio_url: data.CALL_RECORD_URL || null,
      tags: ['bitrix24', 'auto-imported'],
      created_at: callDate.toISOString(),
    };

    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();

    if (interactionError) {
      console.error('Error creating interaction:', interactionError);
      throw interactionError;
    }

    console.log('Call interaction created:', interaction.id);

    return new Response(JSON.stringify({ 
      status: 'success', 
      interactionId: interaction.id,
      contactId: contact.id,
      duration: durationFormatted
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bitrix24 webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
