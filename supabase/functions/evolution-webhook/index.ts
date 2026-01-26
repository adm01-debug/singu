import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      audioMessage?: {
        url: string;
        mimetype: string;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: EvolutionMessage = await req.json();
    console.log('Evolution webhook received:', JSON.stringify(payload, null, 2));

    // Only process message events
    if (payload.event !== 'messages.upsert') {
      return new Response(JSON.stringify({ status: 'ignored', reason: 'not a message event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data } = payload;
    const phoneNumber = data.key.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
    const isFromMe = data.key.fromMe;
    const senderName = data.pushName || 'Desconhecido';
    
    // Extract message content
    let messageContent = '';
    if (data.message?.conversation) {
      messageContent = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
      messageContent = data.message.extendedTextMessage.text;
    }

    // Skip if no content
    if (!messageContent) {
      return new Response(JSON.stringify({ status: 'ignored', reason: 'no text content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find contact by WhatsApp number
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id, first_name, last_name, company_id')
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .limit(1);

    if (contactError) {
      console.error('Error finding contact:', contactError);
      throw contactError;
    }

    let contactId: string | null = null;
    let userId: string | null = null;
    let companyId: string | null = null;

    if (contacts && contacts.length > 0) {
      contactId = contacts[0].id;
      userId = contacts[0].user_id;
      companyId = contacts[0].company_id;
    } else {
      // If contact not found, log and skip (could create contact here if desired)
      console.log(`No contact found for phone: ${phoneNumber}`);
      return new Response(JSON.stringify({ 
        status: 'skipped', 
        reason: 'contact not found',
        phone: phoneNumber 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create interaction
    const interactionData = {
      contact_id: contactId,
      company_id: companyId,
      user_id: userId,
      type: 'whatsapp',
      title: isFromMe ? 'Mensagem Enviada (WhatsApp)' : `Mensagem de ${senderName} (WhatsApp)`,
      content: messageContent,
      sentiment: 'neutral', // Will be analyzed by AI later
      initiated_by: isFromMe ? 'us' : 'them',
      follow_up_required: !isFromMe, // Follow up if they messaged us
      tags: ['evolution-api', 'auto-imported'],
      created_at: data.messageTimestamp 
        ? new Date(data.messageTimestamp * 1000).toISOString() 
        : new Date().toISOString(),
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

    console.log('Interaction created:', interaction.id);

    // Trigger DISC analysis in background if content is long enough
    if (messageContent.length >= 100 && contactId) {
      // Fire and forget - don't await
      supabase.functions.invoke('disc-analyzer', {
        body: {
          texts: [messageContent],
          contactId: contactId,
          interactionId: interaction.id,
          userId: userId,
        },
      }).catch(console.error);
    }

    return new Response(JSON.stringify({ 
      status: 'success', 
      interactionId: interaction.id,
      contactId: contactId,
      analyzed: messageContent.length >= 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evolution webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
