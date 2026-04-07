import type { VoiceAgentAction } from "./types";

/**
 * logVoiceCommand — Logs a voice command for analytics (console only, no DB table needed).
 * Fire-and-forget.
 */
export function logVoiceCommand(
  action: VoiceAgentAction,
  meta: { transcript: string; durationMs?: number; success?: boolean }
) {
  try {
    if (import.meta.env.DEV) {
      console.log("[Voice] Command:", {
        action: action.action,
        transcript: meta.transcript,
        durationMs: meta.durationMs,
        success: meta.success,
      });
    }
  } catch {
    // Silent
  }
}