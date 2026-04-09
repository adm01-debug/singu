// ============================================================================
// SINGU CRM — Template de Edge Function chamada pelo Frontend
//
// Use este template como base para QUALQUER nova edge function que seja
// chamada pelo frontend autenticado.
//
// Aplicar em: ai-writing-assistant, generate-insights, generate-offer-suggestions,
//             suggest-next-action, enrichlayer-linkedin, firecrawl-scrape,
//             enrich-contacts, social-*, rfm-analyzer, elevenlabs-*, voice-agent,
//             send-push-notification
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  withAuth,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

interface RequestPayload {
  // Defina aqui o shape do payload esperado
  // ⚠️ NUNCA inclua userId no payload — sempre use o do JWT
  contactId?: string;
  someParam?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Auth obrigatória
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // SEMPRE use este, NUNCA o do payload

  try {
    const payload: RequestPayload = await req.json();

    // Validação de input
    if (payload.contactId && typeof payload.contactId !== "string") {
      return jsonError("contactId must be a string", 400);
    }

    // Setup Supabase client com service_role para queries internas
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔒 Se a função vai mexer em algum recurso, valida ownership PRIMEIRO
    if (payload.contactId) {
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .select("id, user_id")
        .eq("id", payload.contactId)
        .maybeSingle();

      if (contactError || !contact) {
        return jsonError("Contact not found", 404);
      }
      if (contact.user_id !== userId) {
        return jsonError("Forbidden: contact does not belong to user", 403);
      }
    }

    // 🚀 Lógica da função aqui
    // ...

    // Retorno padrão
    return jsonOk({
      success: true,
      // ... outros dados
    });
  } catch (error) {
    console.error("[function-name] Error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
});
