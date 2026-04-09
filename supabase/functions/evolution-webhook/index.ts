import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonOk,
  jsonError,
  requireWebhookSecret,
  sanitizePhone,
} from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Validate shared secret from Evolution API
  const secretError = requireWebhookSecret(
    req,
    "EVOLUTION_WEBHOOK_SECRET",
    "x-evolution-secret"
  );
  if (secretError) return secretError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const event = payload.event;
    const instance = payload.instance;

    console.log(`Evolution webhook [${event}] from instance: ${instance}`);

    switch (event) {
      case "messages.upsert":
        return await handleMessageUpsert(supabase, payload, instance);
      case "messages.update":
        return await handleMessageUpdate(supabase, payload, instance);
      case "connection.update":
        return await handleConnectionUpdate(supabase, payload, instance);
      case "contacts.upsert":
        return await handleContactsUpsert(supabase, payload, instance);
      case "presence.update":
        return await handlePresenceUpdate(supabase, payload, instance);
      case "call":
        return await handleCall(supabase, payload, instance);
      case "send.message":
        return await handleSendMessage(supabase, payload, instance);
      default:
        console.log(`Unhandled event: ${event}`);
        return jsonOk({ status: "ignored", event });
    }
  } catch (error) {
    console.error("Evolution webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonError(errorMessage, 500);
  }
});

// Helper: Find contact by phone number — local DB → external DB → create
async function findContactByPhone(supabase: any, phoneNumber: string): Promise<{
  contactId: string | null;
  userId: string | null;
  companyId: string | null;
  source: "local" | "external" | "created" | null;
}> {
  // 🔒 Sanitize input
  const cleanPhone = sanitizePhone(phoneNumber);
  if (!cleanPhone) {
    console.log("Invalid phone, skipping");
    return { contactId: null, userId: null, companyId: null, source: null };
  }

  const phoneVariants = [cleanPhone];
  if (!cleanPhone.startsWith("55") && cleanPhone.length >= 10) {
    phoneVariants.push("55" + cleanPhone);
  }

  console.log(`Searching contact for phone variants: ${phoneVariants.join(", ")}`);

  // 1. Local DB
  for (const variant of phoneVariants) {
    const { data: localContacts } = await supabase
      .from("contacts")
      .select("id, user_id, company_id")
      .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
      .limit(1);

    if (localContacts && localContacts.length > 0) {
      console.log(`Found contact in LOCAL DB: ${localContacts[0].id}`);
      return {
        contactId: localContacts[0].id,
        userId: localContacts[0].user_id,
        companyId: localContacts[0].company_id,
        source: "local",
      };
    }
  }

  // 2. External DB
  const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

  if (externalUrl && externalKey) {
    const externalSupabase = createClient(externalUrl, externalKey);

    for (const variant of phoneVariants) {
      const { data: extContacts, error: extError } = await externalSupabase
        .from("contacts")
        .select("id, company_id, first_name, last_name, cargo, whatsapp, phone")
        .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
        .limit(1);

      if (extError) {
        console.error("Error searching external contacts:", extError.message);
        continue;
      }

      if (extContacts && extContacts.length > 0) {
        const extContact = extContacts[0];
        console.log(`Found contact in EXTERNAL DB: ${extContact.id}`);

        const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
        const defaultUserId = profiles?.[0]?.id || null;

        if (!defaultUserId) {
          console.error("No user found in profiles to assign interaction");
          return {
            contactId: extContact.id,
            userId: null,
            companyId: extContact.company_id,
            source: "external",
          };
        }

        return {
          contactId: extContact.id,
          userId: defaultUserId,
          companyId: extContact.company_id,
          source: "external",
        };
      }
    }
  } else {
    console.log("External DB credentials not configured, skipping external search");
  }

  // 3. Create new local contact
  console.log(`Contact not found for phone ${cleanPhone}, creating new local contact`);

  const { data: profiles } = await supabase.from("profiles").select("id").limit(1);
  const defaultUserId = profiles?.[0]?.id || null;

  if (!defaultUserId) {
    console.error("No user found to create contact");
    return { contactId: null, userId: null, companyId: null, source: null };
  }

  const { data: newContact, error: createError } = await supabase
    .from("contacts")
    .insert({
      user_id: defaultUserId,
      first_name: "WhatsApp",
      last_name: cleanPhone,
      whatsapp: cleanPhone,
      phone: cleanPhone,
      notes: "Contato criado automaticamente via WhatsApp (Evolution API)",
      relationship_stage: "unknown",
      sentiment: "neutral",
    })
    .select("id, user_id, company_id")
    .single();

  if (createError) {
    console.error("Error creating contact:", createError.message);
    return { contactId: null, userId: defaultUserId, companyId: null, source: null };
  }

  console.log(`Created new local contact: ${newContact.id}`);
  return {
    contactId: newContact.id,
    userId: defaultUserId,
    companyId: null,
    source: "created",
  };
}

async function handleMessageUpsert(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const phoneNumber = data.key?.remoteJid?.replace("@s.whatsapp.net", "").replace("@g.us", "");
  const isFromMe = data.key?.fromMe;
  const senderName = data.pushName || "Desconhecido";
  const messageId = data.key?.id;

  let messageContent = "";
  let messageType = "text";

  if (data.message?.conversation) {
    messageContent = data.message.conversation;
  } else if (data.message?.extendedTextMessage?.text) {
    messageContent = data.message.extendedTextMessage.text;
  } else if (data.message?.imageMessage) {
    messageType = "image";
    messageContent = data.message.imageMessage.caption || "[Imagem]";
  } else if (data.message?.videoMessage) {
    messageType = "video";
    messageContent = data.message.videoMessage.caption || "[Vídeo]";
  } else if (data.message?.audioMessage) {
    messageType = "audio";
    messageContent = "[Áudio]";
  } else if (data.message?.documentMessage) {
    messageType = "document";
    messageContent = data.message.documentMessage.fileName || "[Documento]";
  } else if (data.message?.stickerMessage) {
    messageType = "sticker";
    messageContent = "[Figurinha]";
  } else if (data.message?.locationMessage) {
    messageType = "location";
    messageContent = `[Localização: ${data.message.locationMessage.degreesLatitude}, ${data.message.locationMessage.degreesLongitude}]`;
  } else if (data.message?.contactMessage) {
    messageType = "contact";
    messageContent = `[Contato: ${data.message.contactMessage.displayName || ""}]`;
  } else if (data.message?.reactionMessage) {
    messageType = "reaction";
    messageContent = data.message.reactionMessage.text || "";
  } else if (data.message?.pollCreationMessage) {
    messageType = "poll";
    messageContent = data.message.pollCreationMessage.name || "[Enquete]";
  }

  if (!messageContent && messageType === "text") {
    return jsonOk({ status: "ignored", reason: "no text content" });
  }

  let status = "sent";
  if (data.status === "DELIVERY_ACK") status = "delivered";
  else if (data.status === "READ") status = "read";
  else if (data.status === "PLAYED") status = "played";
  else if (data.status === "ERROR") status = "error";
  else if (data.status === "PENDING") status = "pending";

  const { contactId, userId, companyId, source } = await findContactByPhone(supabase, phoneNumber || "");

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
        contactSource: source,
      },
    };

    const { error: msgError } = await supabase
      .from("whatsapp_messages")
      .upsert(messageData, { onConflict: "message_id" })
      .select();

    if (msgError) {
      console.error("Error upserting whatsapp_message:", msgError.message);
      const { error: insertError } = await supabase.from("whatsapp_messages").insert(messageData);
      if (insertError) console.error("Error inserting whatsapp_message:", insertError.message);
    }
  }

  if (messageContent && contactId && userId && messageType === "text") {
    if (source === "created" && senderName && senderName !== "Desconhecido") {
      await supabase
        .from("contacts")
        .update({ first_name: senderName, last_name: "" })
        .eq("id", contactId);
    }

    const interactionTitle = isFromMe
      ? "Mensagem Enviada (WhatsApp)"
      : `Mensagem de ${senderName} (WhatsApp)`;

    const interactionData = {
      contact_id: contactId,
      company_id: companyId,
      user_id: userId,
      type: "whatsapp",
      title: interactionTitle,
      content: messageContent,
      sentiment: "neutral",
      initiated_by: isFromMe ? "us" : "them",
      follow_up_required: !isFromMe,
      tags: ["evolution-api", "auto-imported"],
      created_at: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
    };

    const { data: interaction, error: interactionError } = await supabase
      .from("interactions")
      .insert(interactionData)
      .select()
      .single();

    if (interactionError) {
      console.error("Error creating interaction:", interactionError.message);
    } else {
      console.log(`Interaction created: ${interaction.id}`);

      if (messageContent.length >= 100 && contactId) {
        // Note: disc-analyzer is now authenticated. Service-role calls between
        // edge functions need to use the supabase.functions.invoke() WITH the
        // service role key in Authorization header, OR refactor to direct DB call.
        supabase.functions
          .invoke("disc-analyzer", {
            body: { texts: [messageContent], contactId, interactionId: interaction.id },
            headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          })
          .catch((err: any) => console.error("DISC analyzer error:", err));
      }
    }
  }

  return jsonOk({
    status: "success",
    contactId,
    contactSource: source,
    messageType,
    analyzed: (messageContent?.length || 0) >= 100,
  });
}

async function handleMessageUpdate(supabase: any, payload: any, _instance: string) {
  const { data } = payload;

  if (!data?.key?.id) {
    return jsonOk({ status: "ignored", reason: "no message key" });
  }

  const updates: Record<string, any> = {};

  if (data.update?.status === 3 || data.update?.status === "DELIVERY_ACK") {
    updates.status = "delivered";
    updates.delivered_at = new Date().toISOString();
  } else if (data.update?.status === 4 || data.update?.status === "READ") {
    updates.status = "read";
    updates.read_at = new Date().toISOString();
  } else if (data.update?.status === 5 || data.update?.status === "PLAYED") {
    updates.status = "played";
    updates.played_at = new Date().toISOString();
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();
    const { error } = await supabase
      .from("whatsapp_messages")
      .update(updates)
      .eq("message_id", data.key.id);
    if (error) console.error("Error updating message status:", error);
  }

  return jsonOk({ status: "success", messageId: data.key.id, updates });
}

async function handleConnectionUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const state = data?.state;

  console.log(`Instance ${instance} connection: ${state}`);

  const updates: Record<string, any> = {
    status: state === "open" ? "connected" : state === "close" ? "disconnected" : "connecting",
    updated_at: new Date().toISOString(),
  };

  if (state === "open") updates.last_connected_at = new Date().toISOString();

  const { error } = await supabase
    .from("whatsapp_instances")
    .update(updates)
    .eq("instance_name", instance);

  if (error) console.error("Error updating instance status:", error);

  return jsonOk({ status: "success", instance, state });
}

async function handleContactsUpsert(supabase: any, payload: any, _instance: string) {
  const { data } = payload;

  if (!data?.id) return jsonOk({ status: "ignored", reason: "no contact data" });

  const phoneNumber = sanitizePhone(data.id?.replace("@s.whatsapp.net", ""));
  const profileName = data.pushName || data.name;

  if (profileName && phoneNumber) {
    const { error } = await supabase
      .from("contacts")
      .update({
        avatar_url: data.profilePictureUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .not("avatar_url", "is", null);

    if (error) console.log("Contact not found for update:", phoneNumber);
  }

  return jsonOk({ status: "success", phone: phoneNumber });
}

async function handlePresenceUpdate(_supabase: any, payload: any, _instance: string) {
  const { data } = payload;
  console.log(`Presence update: ${data?.id} -> ${JSON.stringify(data?.presences)}`);
  return jsonOk({ status: "logged", presenceId: data?.id });
}

async function handleCall(supabase: any, payload: any, _instance: string) {
  const { data } = payload;
  const phoneNumber = data?.from?.replace("@s.whatsapp.net", "");

  console.log(`Call from ${phoneNumber}, isVideo: ${data?.isVideo}`);

  if (phoneNumber) {
    const { contactId, userId, companyId } = await findContactByPhone(supabase, phoneNumber);

    if (contactId && userId) {
      await supabase.from("interactions").insert({
        contact_id: contactId,
        company_id: companyId,
        user_id: userId,
        type: "call",
        title: `Chamada ${data?.isVideo ? "de Vídeo" : "de Voz"} (WhatsApp)`,
        content: `Chamada ${data?.isVideo ? "de vídeo" : "de voz"} recebida via WhatsApp. Status: ${data?.status || "recebida"}`,
        sentiment: "neutral",
        initiated_by: "them",
        tags: ["evolution-api", "auto-imported", data?.isVideo ? "video-call" : "voice-call"],
      });
    }
  }

  return jsonOk({ status: "success", from: phoneNumber });
}

async function handleSendMessage(supabase: any, payload: any, _instance: string) {
  const { data } = payload;

  if (data?.key?.id) {
    await supabase
      .from("whatsapp_messages")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("message_id", data.key.id);
  }

  return jsonOk({ status: "success" });
}
