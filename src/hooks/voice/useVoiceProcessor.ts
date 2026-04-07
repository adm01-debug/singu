import { useCallback, useRef } from "react";
import { playTtsAudio } from "./playTtsAudio";
import { processVoiceTranscript } from "./processTranscript";
import { withRetry, friendlyErrorMessage, RateLimiter } from "./retry";
import { logVoiceCommand } from "./logVoiceCommand";
import type { VoiceAgentAction, VoiceAgentPhase } from "./types";

interface ProcessorCallbacks {
  setPhase: (phase: VoiceAgentPhase) => void;
  setFinalTranscript: (text: string) => void;
  setAgentResponse: (text: string) => void;
  setCurrentAction: (action: VoiceAgentAction | null) => void;
  setError: (error: string | null) => void;
  onAction?: (action: VoiceAgentAction) => void;
  onError?: (error: string) => void;
}

export function useVoiceProcessor(callbacks: ProcessorCallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const isProcessingRef = useRef(false);
  const stopSpeakingRef = useRef<(() => void) | null>(null);

  const processTranscript = useCallback(async (text: string) => {
    if (isProcessingRef.current || !text.trim()) return;

    isProcessingRef.current = true;
    cbRef.current.setPhase("processing");
    cbRef.current.setFinalTranscript(text);
    cbRef.current.setAgentResponse("");
    const startTime = Date.now();

    try {
      const action = await withRetry(() => processVoiceTranscript(text));
      cbRef.current.setCurrentAction(action);
      cbRef.current.setAgentResponse(action.response);

      if (action.response) {
        cbRef.current.setPhase("speaking");
        try {
          const { promise, stop } = playTtsAudio(action.response);
          stopSpeakingRef.current = stop;
          await promise;
        } catch {
          // TTS failure is non-critical — command still executed
        } finally {
          stopSpeakingRef.current = null;
        }
      }

      logVoiceCommand(action, {
        transcript: text,
        durationMs: Date.now() - startTime,
        success: true,
      });

      cbRef.current.setPhase("idle");
      cbRef.current.onAction?.(action);
    } catch (err) {
      const message = friendlyErrorMessage(err);
      cbRef.current.setError(message);
      cbRef.current.setPhase("error");
      cbRef.current.onError?.(message);

      logVoiceCommand(
        { action: "answer", response: message, data: {} },
        { transcript: text, durationMs: Date.now() - startTime, success: false }
      );
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
  }, []);

  const resetProcessor = useCallback(() => {
    stopSpeakingRef.current?.();
    stopSpeakingRef.current = null;
    isProcessingRef.current = false;
  }, []);

  return {
    processTranscript,
    stopSpeaking,
    resetProcessor,
    isProcessing: isProcessingRef,
  };
}
