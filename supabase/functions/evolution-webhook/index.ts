import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const event = payload.event;
    const instance = payload.instance;

    console.log(`Evolution webhook [${event}] from instance: ${instance}`);

    // Route to handler based on event type
    switch (event) {
      case 'messages.upsert':
        return await handleMessageUpsert(supabase, payload, instance);

      case 'messages.update':
        return await handleMessageUpdate(supabase, payload, instance);

      case 'connection.update':
        return await handleConnectionUpdate(supabase, payload, instance);

      case 'contacts.upsert':
        return await handleContactsUpsert(supabase, payload, instance);

      case 'presence.update':
        return await handlePresenceUpdate(supabase, payload, instance);

      case 'call':
        return await handleCall(supabase, payload, instance);

      case 'send.message':
        return await handleSendMessage(supabase, payload, instance);

      default:
        console.log(`Unhandled event: ${event}`);
        return jsonResponse({ status: 'ignored', event });
    }

  } catch (error) {
    console.error('Evolution webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ========================
// MESSAGES.UPSERT - New message received/sent
// ========================
async function handleMessageUpsert(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const phoneNumber = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
  const isFromMe = data.key?.fromMe;
  const senderName = data.pushName || 'Desconhecido';
  const messageId = data.key?.id;

  // Extract message content
  let messageContent = '';
  let messageType = 'text';

  if (data.message?.conversation) {
    messageContent = data.message.conversation;
  } else if (data.message?.extendedTextMessage?.text) {
    messageContent = data.message.extendedTextMessage.text;
  } else if (data.message?.imageMessage) {
    messageType = 'image';
    messageContent = data.message.imageMessage.caption || '[Imagem]';
  } else if (data.message?.videoMessage) {
    messageType = 'video';
    messageContent = data.message.videoMessage.caption || '[Vídeo]';
  } else if (data.message?.audioMessage) {
    messageType = 'audio';
    messageContent = '[Áudio]';
  } else if (data.message?.documentMessage) {
    messageType = 'document';
    messageContent = data.message.documentMessage.fileName || '[Documento]';
  } else if (data.message?.stickerMessage) {
    messageType = 'sticker';
    messageContent = '[Figurinha]';
  } else if (data.message?.locationMessage) {
    messageType = 'location';
    messageContent = `[Localização: ${data.message.locationMessage.degreesLatitude}, ${data.message.locationMessage.degreesLongitude}]`;
  } else if (data.message?.contactMessage) {
    messageType = 'contact';
    messageContent = `[Contato: ${data.message.contactMessage.displayName || ''}]`;
  } else if (data.message?.reactionMessage) {
    messageType = 'reaction';
    messageContent = data.message.reactionMessage.text || '';
  } else if (data.message?.pollCreationMessage) {
    messageType = 'poll';
    messageContent = data.message.pollCreationMessage.name || '[Enquete]';
  }

  // Skip if no content
  if (!messageContent && messageType === 'text') {
    return jsonResponse({ status: 'ignored', reason: 'no text content' });
  }

  // Map message status from Evolution
  let status = 'sent';
  if (data.status === 'DELIVERY_ACK') status = 'delivered';
  else if (data.status === 'READ') status = 'read';
  else if (data.status === 'PLAYED') status = 'played';
  else if (data.status === 'ERROR') status = 'error';
  else if (data.status === 'PENDING') status = 'pending';
  else if (data.status === 'SERVER_ACK') status = 'sent';

  // Save to whatsapp_messages table (using service role, no user_id filter needed)
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, user_id, company_id')
    .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
    .limit(1);

  let contactId: string | null = null;
  let userId: string | null = null;
  let companyId: string | null = null;

  if (contacts && contacts.length > 0) {
    contactId = contacts[0].id;
    userId = contacts[0].user_id;
    companyId = contacts[0].company_id;
  }

  // Save WhatsApp message
  if (userId) {
    const messageData = {
      user_id: userId,
      contact_id: contactId,
      instance_name: instance,
      remote_jid: data.key.remoteJid,
      message_id: messageId,
      from_me: isFromMe,
      message_type: messageType,
      content: messageContent,
      status,
      sender_name: senderName,
      timestamp: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
      metadata: {
        messageType: data.messageType,
        participant: data.participant,
        instanceId: data.instanceId,
      },
    };

    const { error: msgError } = await supabase
      .from('whatsapp_messages')
      .upsert(messageData, { onConflict: 'message_id' })
      .select();

    if (msgError) {
      // If upsert fails (no unique constraint on message_id), just insert
      await supabase.from('whatsapp_messages').insert(messageData);
    }
  }

  // Create interaction for text messages from contacts
  if (messageContent && contactId && userId && messageType === 'text') {
    const interactionData = {
      contact_id: contactId,
      company_id: companyId,
      user_id: userId,
      type: 'whatsapp',
      title: isFromMe ? 'Mensagem Enviada (WhatsApp)' : `Mensagem de ${senderName} (WhatsApp)`,
      content: messageContent,
      sentiment: 'neutral',
      initiated_by: isFromMe ? 'us' : 'them',
      follow_up_required: !isFromMe,
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
    } else {
      console.log('Interaction created:', interaction.id);

      // Trigger DISC analysis for long messages
      if (messageContent.length >= 100 && contactId) {
        supabase.functions.invoke('disc-analyzer', {
          body: {
            texts: [messageContent],
            contactId,
            interactionId: interaction.id,
            userId,
          },
        }).catch(console.error);
      }
    }
  }

  return jsonResponse({
    status: 'success',
    contactId,
    messageType,
    analyzed: (messageContent?.length || 0) >= 100,
  });
}

// ========================
// MESSAGES.UPDATE - Message status update (delivered, read, etc.)
// ========================
async function handleMessageUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (!data?.key?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no message key' });
  }

  const updates: Record<string, any> = {};

  if (data.update?.status === 3 || data.update?.status === 'DELIVERY_ACK') {
    updates.status = 'delivered';
    updates.delivered_at = new Date().toISOString();
  } else if (data.update?.status === 4 || data.update?.status === 'READ') {
    updates.status = 'read';
    updates.read_at = new Date().toISOString();
  } else if (data.update?.status === 5 || data.update?.status === 'PLAYED') {
    updates.status = 'played';
    updates.played_at = new Date().toISOString();
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('whatsapp_messages')
      .update(updates)
      .eq('message_id', data.key.id);

    if (error) {
      console.error('Error updating message status:', error);
    }
  }

  return jsonResponse({ status: 'success', messageId: data.key.id, updates });
}

// ========================
// CONNECTION.UPDATE - Instance connection state changed
// ========================
async function handleConnectionUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const state = data?.state; // open, close, connecting

  console.log(`Instance ${instance} connection: ${state}`);

  const updates: Record<string, any> = {
    status: state === 'open' ? 'connected' : state === 'close' ? 'disconnected' : 'connecting',
    updated_at: new Date().toISOString(),
  };

  if (state === 'open') {
    updates.last_connected_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('whatsapp_instances')
    .update(updates)
    .eq('instance_name', instance);

  if (error) {
    console.error('Error updating instance status:', error);
  }

  return jsonResponse({ status: 'success', instance, state });
}

// ========================
// CONTACTS.UPSERT - WhatsApp contact synced
// ========================
async function handleContactsUpsert(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (!data?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no contact data' });
  }

  const phoneNumber = data.id?.replace('@s.whatsapp.net', '');
  const profileName = data.pushName || data.name;

  if (profileName && phoneNumber) {
    // Update existing contacts with WhatsApp profile info
    const { error } = await supabase
      .from('contacts')
      .update({
        avatar_url: data.profilePictureUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .not('avatar_url', 'is', null); // Only update if they don't already have a custom avatar

    if (error) {
      console.log('Contact not found for update:', phoneNumber);
    }
  }

  return jsonResponse({ status: 'success', phone: phoneNumber });
}

// ========================
// PRESENCE.UPDATE - Online/offline/typing status
// ========================
async function handlePresenceUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  // Presence updates are ephemeral - we log but don't persist them heavily
  console.log(`Presence update: ${data?.id} -> ${JSON.stringify(data?.presences)}`);
  return jsonResponse({ status: 'logged', presenceId: data?.id });
}

// ========================
// CALL - Voice/video call received
// ========================
async function handleCall(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const phoneNumber = data?.from?.replace('@s.whatsapp.net', '');

  console.log(`Call from ${phoneNumber}, isVideo: ${data?.isVideo}`);

  // Find contact and create interaction for calls
  if (phoneNumber) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, user_id, company_id')
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .limit(1);

    if (contacts && contacts.length > 0) {
      await supabase.from('interactions').insert({
        contact_id: contacts[0].id,
        company_id: contacts[0].company_id,
        user_id: contacts[0].user_id,
        type: 'call',
        title: `Chamada ${data?.isVideo ? 'de Vídeo' : 'de Voz'} (WhatsApp)`,
        content: `Chamada ${data?.isVideo ? 'de vídeo' : 'de voz'} recebida via WhatsApp. Status: ${data?.status || 'recebida'}`,
        sentiment: 'neutral',
        initiated_by: 'them',
        tags: ['evolution-api', 'auto-imported', data?.isVideo ? 'video-call' : 'voice-call'],
      });
    }
  }

  return jsonResponse({ status: 'success', from: phoneNumber });
}

// ========================
// SEND.MESSAGE - Outgoing message confirmation
// ========================
async function handleSendMessage(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (data?.key?.id) {
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('message_id', data.key.id);
  }

  return jsonResponse({ status: 'success' });
}
