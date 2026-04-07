import { useState, useCallback, useRef, useEffect } from "react";
import { useScribeConnection } from "./voice/useScribeConnection";
import { useVoiceProcessor } from "./voice/useVoiceProcessor";
import { friendlyErrorMessage } from "./voice/retry";
import type { VoiceAgentAction, VoiceAgentPhase, UseVoiceAgentOptions } from "./voice/types";

export type { VoiceAgentAction, VoiceAgentPhase } from "./voice/types";

const ERROR_RESET_DELAY_MS = 5000;
const PROCESSING_ERROR_RESET_DELAY_MS = 3000;

export function useVoiceAgent({ onAction, onError }: UseVoiceAgentOptions = {}) {
  const onActionRef = useRef(onAction);
  const onErrorRef = useRef(onError);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const [phase, setPhase] = useState<VoiceAgentPhase>("idle");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<VoiceAgentAction | null>(null);

  const resetPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetPhaseTimer = useCallback(() => {
    if (resetPhaseTimerRef.current !== null) {
      clearTimeout(resetPhaseTimerRef.current);
      resetPhaseTimerRef.current = null;
    }
  }, []);

  const scheduleIdleReset = useCallback((delay = ERROR_RESET_DELAY_MS) => {
    clearResetPhaseTimer();
    resetPhaseTimerRef.current = setTimeout(() => {
      resetPhaseTimerRef.current = null;
      setPhase("idle");
      setError(null);
    }, delay);
  }, [clearResetPhaseTimer]);

  // --- Voice processor (TTS + AI) ---
  const processor = useVoiceProcessor({
    setPhase: (p) => { clearResetPhaseTimer(); setPhase(p); },
    setFinalTranscript,
    setAgentResponse,
    setCurrentAction,
    setError: (msg) => {
      if (msg) {
        setError(msg);
        scheduleIdleReset(PROCESSING_ERROR_RESET_DELAY_MS);
      } else {
        setError(null);
      }
    },
    onAction: (a) => onActionRef.current?.(a),
    onError: (msg) => onErrorRef.current?.(msg),
  });

  // --- Scribe connection (STT) ---
  const handleScribeError = useCallback((err: unknown) => {
    clearResetPhaseTimer();
    setPartialTranscript("");
    const message = friendlyErrorMessage(err);
    setError(message);
    setPhase("error");
    onErrorRef.current?.(message);
    scheduleIdleReset();
  }, [clearResetPhaseTimer, scheduleIdleReset]);

  const scribe = useScribeConnection({
    onSessionStarted: () => {
      clearResetPhaseTimer();
      setError(null);
      setPhase("listening");
    },
    onPartialTranscript: setPartialTranscript,
    onCommittedTranscript: (text) => {
      setPartialTranscript("");
      processor.processTranscript(text);
    },
    onError: (err) => {
      scribe.forceDisconnect();
      handleScribeError(err);
    },
    onDisconnect: () => {
      setPartialTranscript("");
      setPhase((current) =>
        current === "processing" || current === "speaking" || current === "error"
          ? current
          : "idle"
      );
    },
  });

  // --- Public API ---
  const startListening = useCallback(async () => {
    clearResetPhaseTimer();
    setError(null);
    setPartialTranscript("");
    setFinalTranscript("");
    setAgentResponse("");
    setCurrentAction(null);
    setPhase("idle");

    try {
      await scribe.connect();
    } catch (err) {
      handleScribeError(err);
    }
  }, [clearResetPhaseTimer, handleScribeError, scribe]);

  const stopListening = useCallback(() => {
    clearResetPhaseTimer();
    scribe.disconnect();

    if (phase === "listening") {
      if (partialTranscript.trim()) {
        processor.processTranscript(partialTranscript.trim());
      } else {
        setPhase("idle");
      }
    } else if (phase !== "processing" && phase !== "speaking") {
      setPhase("idle");
    }
  }, [clearResetPhaseTimer, partialTranscript, phase, processor, scribe]);

  const stopSpeaking = useCallback(() => {
    clearResetPhaseTimer();
    processor.stopSpeaking();
    setPhase("idle");
  }, [clearResetPhaseTimer, processor]);

  const reset = useCallback(() => {
    clearResetPhaseTimer();
    scribe.disconnect();
    processor.resetProcessor();
    setPhase("idle");
    setPartialTranscript("");
    setFinalTranscript("");
    setAgentResponse("");
    setError(null);
    setCurrentAction(null);
  }, [clearResetPhaseTimer, scribe, processor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearResetPhaseTimer();
      scribe.cleanup();
      processor.resetProcessor();
    };
  }, [clearResetPhaseTimer, scribe, processor]);

  return {
    phase,
    partialTranscript,
    finalTranscript,
    agentResponse,
    error,
    currentAction,
    isConnected: scribe.isConnected,
    startListening,
    stopListening,
    stopSpeaking,
    reset,
  };
}
