import { useCallback, useRef, useEffect } from "react";
import { playTtsAudio } from "./playTtsAudio";
import { processVoiceTranscript } from "./processTranscript";
import { withRetry, friendlyErrorMessage } from "./retry";
import { logVoiceCommand } from "./logVoiceCommand";
import type { VoiceAgentAction, UseVoiceAgentOptions } from "./types";
import type { useVoiceState } from "./useVoiceState";

const PROCESSING_ERROR_RESET_DELAY_MS = 3000;

type VoiceState = ReturnType<typeof useVoiceState>;

/**
 * Handles transcript processing: AI call → TTS playback → action dispatch.
 */
export function useTranscriptProcessor(
  state: VoiceState,
  options: UseVoiceAgentOptions
) {
  const onActionRef = useRef(options.onAction);
  const onErrorRef = useRef(options.onError);
  useEffect(() => { onActionRef.current = options.onAction; }, [options.onAction]);
  useEffect(() => { onErrorRef.current = options.onError; }, [options.onError]);

  const stopSpeakingRef = useRef<(() => void) | null>(null);

  const processTranscript = useCallback(async (text: string) => {
    if (state.isProcessingRef.current || !text.trim()) return;

    state.clearResetPhaseTimer();
    state.isProcessingRef.current = true;
    state.setPhase("processing");
    state.setFinalTranscript(text);
    state.setAgentResponse("");
    const startTime = Date.now();

    try {
      const action = await withRetry(() => processVoiceTranscript(text));
      state.setCurrentAction(action);
      state.setAgentResponse(action.response);

      if (action.response) {
        state.setPhase("speaking");
        try {
          const { promise, stop } = playTtsAudio(action.response);
          stopSpeakingRef.current = stop;
          await promise;
        } catch {
          // TTS playback failure is non-critical
        } finally {
          stopSpeakingRef.current = null;
        }
      }

      logVoiceCommand(action, {
        transcript: text,
        durationMs: Date.now() - startTime,
        success: true,
      });

      state.setPhase("idle");
      onActionRef.current?.(action);
    } catch (err) {
      const message = friendlyErrorMessage(err);
      state.setError(message);
      state.setPhase("error");
      onErrorRef.current?.(message);

      logVoiceCommand(
        { action: "answer", response: message, data: {} },
        { transcript: text, durationMs: Date.now() - startTime, success: false }
      );

      state.scheduleIdleReset(PROCESSING_ERROR_RESET_DELAY_MS);
    } finally {
      state.isProcessingRef.current = false;
    }
  }, [state]);

  const stopSpeaking = useCallback(() => {
    state.clearResetPhaseTimer();
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
    state.setPhase("idle");
  }, [state]);

  const cleanupSpeaking = useCallback(() => {
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
  }, []);

  return { processTranscript, stopSpeaking, cleanupSpeaking, onActionRef, onErrorRef };
}