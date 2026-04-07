import { logger } from "@/lib/logger";
import { getAuthToken, refreshAuthToken } from "./auth";
import type { VoiceAgentAction } from "./types";

const VALID_ACTIONS = new Set(["search", "navigate", "answer", "create_interaction", "create_reminder"]);

/**
 * processVoiceTranscript — Sends a voice transcript to the AI edge function
 * and returns a structured VoiceAgentAction.
 *
 * Features:
 * - 15s abort timeout
 * - Auto-retry on 401 with session refresh
 * - Strict action validation
 */
export async function processVoiceTranscript(transcript: string): Promise<VoiceAgentAction> {
  const sanitized = transcript.trim().slice(0, 1000);
  if (!sanitized) {
    return { action: "answer", response: "Não recebi nenhum comando. Pode repetir?", data: {} };
  }

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
        body: JSON.stringify({ transcript: sanitized }),
        signal: controller.signal,
      }
    );

    // Auto-retry on 401 with refreshed token
    if (response.status === 401) {
      logger.warn("[Voice] 401 received, refreshing session...");
      const newToken = await refreshAuthToken();
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
            body: JSON.stringify({ transcript: sanitized }),
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

/**
 * validateAction — Ensures the AI response has a valid action and response string.
 * Falls back to a safe "answer" action if malformed.
 */
function validateAction(action: VoiceAgentAction): VoiceAgentAction {
  if (!action?.action || !action?.response || !VALID_ACTIONS.has(action.action)) {
    return {
      action: "answer",
      response: action?.response || "Desculpe, não entendi. Pode repetir?",
      data: {},
    };
  }
  return action;
}
