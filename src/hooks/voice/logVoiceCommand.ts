import { logger } from "@/lib/logger";
import type { VoiceAgentAction } from "./types";

/**
 * logVoiceCommand — Logs a voice command for analytics.
 * Fire-and-forget.
 */
export function logVoiceCommand(
  action: VoiceAgentAction,
  meta: { transcript: string; durationMs?: number; success?: boolean }
) {
  try {
    logger.log("[Voice] Command:", {
      action: action.action,
      transcript: meta.transcript,
      durationMs: meta.durationMs,
      success: meta.success,
    });
  } catch {
    // Silent
  }
}
