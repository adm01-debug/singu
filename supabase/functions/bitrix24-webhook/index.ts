import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonError,
  jsonOk,
  requireWebhookSecret,
  sanitizePhone,
} from "../_shared/auth.ts";

interface BitrixCallEvent {
  event: string;
  data: {
    CALL_ID?: string;
    PHONE_NUMBER?: string;
    CALL_TYPE?: number;
    CALL_DURATION?: number;
    CALL_START_DATE?: string;
    CALL_RECORD_URL?: string;
    PORTAL_USER_ID?: string;
    CRM_ENTITY_TYPE?: string;
    CRM_ENTITY_ID?: string;
    CALL_FAILED_CODE?: string;
    CALL_FAILED_REASON?: string;
  };
  auth?: { domain?: string; member_id?: string };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Validate shared secret from Bitrix24
  const secretError = requireWebhookSecret(
    req,
    "BITRIX24_WEBHOOK_SECRET",
    "x-bitrix-secret"
  );
  if (secretError) return secretError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let payload: BitrixCallEvent;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const formData = await req.formData();
      payload = {
        event: (formData.get("event") as string) || "",
        data: {
          CALL_ID: formData.get("data[CALL_ID]") as string,
          PHONE_NUMBER: formData.get("data[PHONE_NUMBER]") as string,
          CALL_TYPE: parseInt(formData.get("data[CALL_TYPE]") as string) || undefined,
          CALL_DURATION: parseInt(formData.get("data[CALL_DURATION]") as string) || undefined,
          CALL_START_DATE: formData.get("data[CALL_START_DATE]") as string,
          CALL_RECORD_URL: formData.get("data[CALL_RECORD_URL]") as string,
          PORTAL_USER_ID: formData.get("data[PORTAL_USER_ID]") as string,
          CRM_ENTITY_TYPE: formData.get("data[CRM_ENTITY_TYPE]") as string,
          CRM_ENTITY_ID: formData.get("data[CRM_ENTITY_ID]") as string,
        },
      };
    }

    console.log("Bitrix24 webhook received:", JSON.stringify(payload, null, 2));

    const validEvents = ["ONVOXIMPLANTCALLEND", "ONEXTERNALCALLFINISH", "ONCRMCALLEND"];
    if (!validEvents.includes(payload.event?.toUpperCase())) {
      return jsonOk({ status: "ignored", reason: "not a call end event", event: payload.event });
    }

    const { data } = payload;

    // 🔒 SECURITY: Sanitize phone (anti-injection in PostgREST .or() filter)
    const phoneNumber = sanitizePhone(data.PHONE_NUMBER);
    if (!phoneNumber) {
      return jsonOk({ status: "ignored", reason: "invalid or missing phone" });
    }

    const isOutgoing = data.CALL_TYPE === 1;
    const duration = data.CALL_DURATION || 0;
    const callDate = data.CALL_START_DATE ? new Date(data.CALL_START_DATE) : new Date();

    // 🔒 Use .eq instead of .ilike with wildcards
    const { data: contacts, error: contactError } = await supabase
      .from("contacts")
      .select("id, user_id, first_name, last_name, company_id")
      .or(`phone.eq.${phoneNumber},whatsapp.eq.${phoneNumber}`)
      .limit(1);

    if (contactError) {
      console.error("Error finding contact:", contactError);
      throw contactError;
    }

    if (!contacts || contacts.length === 0) {
      console.log(`No contact found for phone: ${phoneNumber}`);
      return jsonOk({ status: "skipped", reason: "contact not found", phone: phoneNumber });
    }

    const contact = contacts[0];

    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationFormatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    let callOutcome = "Ligação completada";
    if (duration === 0) {
      callOutcome = data.CALL_FAILED_REASON || "Ligação não atendida";
    }

    const interactionData = {
      contact_id: contact.id,
      company_id: contact.company_id,
      user_id: contact.user_id,
      type: "call",
      title: isOutgoing
        ? `Ligação Realizada para ${contact.first_name}`
        : `Ligação Recebida de ${contact.first_name}`,
      content: `${callOutcome}\nDuração: ${durationFormatted}`,
      sentiment: duration > 0 ? "neutral" : "negative",
      initiated_by: isOutgoing ? "us" : "them",
      follow_up_required: duration === 0,
      duration: duration,
      audio_url: data.CALL_RECORD_URL || null,
      tags: ["bitrix24", "auto-imported"],
      created_at: callDate.toISOString(),
    };

    const { data: interaction, error: interactionError } = await supabase
      .from("interactions")
      .insert(interactionData)
      .select()
      .single();

    if (interactionError) {
      console.error("Error creating interaction:", interactionError);
      throw interactionError;
    }

    console.log("Call interaction created:", interaction.id);

    return jsonOk({
      status: "success",
      interactionId: interaction.id,
      contactId: contact.id,
      duration: durationFormatted,
    });
  } catch (error) {
    console.error("Bitrix24 webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonError(errorMessage, 500);
  }
});
