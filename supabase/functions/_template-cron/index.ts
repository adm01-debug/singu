// ============================================================================
// SINGU CRM — Template de Cron Function com requireCronSecret
//
// Este é o template oficial pra TODAS as 6 funções de cron:
// - check-notifications
// - check-health-alerts
// - client-notifications
// - template-success-notifications
// - smart-reminders
// - weekly-digest
//
// Padrão: copie o início (até "// 🚀 Lógica da função") em cada index.ts
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  requireCronSecret,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Cron secret obrigatório
  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🚀 Lógica da função abaixo deste ponto
    // ----------------------------------------------------------------
    // EXEMPLO: check-notifications
    //
    // Busca eventos disparados pelo sistema e envia notificações push
    // para os usuários relevantes.

    const { data: pendingNotifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(100);

    if (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }

    let processed = 0;
    let failed = 0;

    for (const notification of pendingNotifications ?? []) {
      try {
        // Aqui chama o serviço de push, ou outro tipo de notificação
        // (essa parte é específica de cada cron — adapte)

        await supabase
          .from("notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", notification.id);

        processed++;
      } catch (err) {
        console.error("Failed to process notification:", notification.id, err);
        await supabase
          .from("notifications")
          .update({
            status: "error",
            error_message: err instanceof Error ? err.message : "unknown",
          })
          .eq("id", notification.id);

        failed++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[cron] check-notifications done: processed=${processed}, failed=${failed}, elapsed=${elapsed}ms`
    );

    return jsonOk({
      success: true,
      processed,
      failed,
      elapsed_ms: elapsed,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[cron] Error after ${elapsed}ms:`, error);
    return jsonError(
      error instanceof Error ? error.message : "Unknown error",
      500
    );
  }
});
