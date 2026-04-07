import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { VoiceAgentAction } from "./types";

/** Get a valid auth token, refreshing session if needed */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  const { data: refreshed } = await supabase.auth.refreshSession();
  if (refreshed?.session?.access_token) return refreshed.session.access_token;

  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

/**
 * processVoiceTranscript — Sends transcript to AI and returns structured action.
 */
export async function processVoiceTranscript(transcript: string): Promise<VoiceAgentAction> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const authToken = await getAuthToken();

    let response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-agent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ transcript }),
        signal: controller.signal,
      }
    );

    // Auto-retry on 401 with refreshed token
    if (response.status === 401) {
      logger.warn("[Voice] 401 received, refreshing session...");
      const { data: refreshed } = await supabase.auth.refreshSession();
      const newToken = refreshed?.session?.access_token;
      if (newToken) {
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-agent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify({ transcript }),
            signal: controller.signal,
          }
        );
      }
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`AI processing failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    return validateAction(data as VoiceAgentAction);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("timeout");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function validateAction(action: VoiceAgentAction): VoiceAgentAction {
  if (!action?.action || !action?.response) {
    return {
      action: "answer",
      response: action?.response || "Desculpe, não entendi. Pode repetir?",
      data: {},
    };
  }
  return action;
}
