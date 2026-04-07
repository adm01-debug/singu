import { useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceState } from "./voice/useVoiceState";
import { useTranscriptProcessor } from "./voice/useTranscriptProcessor";
import { friendlyErrorMessage } from "./voice/retry";
import type { UseVoiceAgentOptions } from "./voice/types";
import { logger } from '@/lib/logger';

export type { VoiceAgentAction, VoiceAgentPhase } from "./voice/types";

const SESSION_START_TIMEOUT_MS = 8000;
const SCRIBE_CONNECT_OPTIONS = {
  modelId: "scribe_v2_realtime",
  microphone: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

export function useVoiceAgent({ onAction, onError }: UseVoiceAgentOptions = {}) {
  const state = useVoiceState();
  const { processTranscript, stopSpeaking, cleanupSpeaking, onErrorRef } =
    useTranscriptProcessor(state, { onAction, onError });

  const processTranscriptRef = useRef(processTranscript);
  useEffect(() => { processTranscriptRef.current = processTranscript; }, [processTranscript]);

  const disconnectScribeRef = useRef<() => void>(() => undefined);
  const handleScribeErrorRef = useRef<(err: unknown) => void>(() => undefined);

  const forceDisconnectScribe = useCallback(() => {
    state.clearSessionStartTimer();
    try {
      disconnectScribeRef.current();
    } catch (e) {
      logger.warn("[Voice] Failed to disconnect Scribe:", e);
    }
  }, [state]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => logger.log("[Voice] Scribe socket connected"),
    onSessionStarted: () => {
      logger.log("[Voice] Scribe session started");
      state.isStartingRef.current = false;
      state.clearResetPhaseTimer();
      state.clearSessionStartTimer();
      state.setError(null);
      state.setPhase("listening");
    },
    onDisconnect: () => {
      logger.log("[Voice] Scribe disconnected");
      state.isStartingRef.current = false;
      state.clearSessionStartTimer();
      state.setPartialTranscript("");
      state.setPhase((current) =>
        current === "processing" || current === "speaking" || current === "error"
          ? current
          : "idle"
      );
    },
    onError: (err: unknown) => handleScribeErrorRef.current(err),
    onPartialTranscript: (data: { text: string }) => {
      state.setPartialTranscript(data.text);
    },
    onCommittedTranscript: (data: { text: string }) => {
      if (data.text.trim()) {
        state.setPartialTranscript("");
        processTranscriptRef.current(data.text.trim());
      }
    },
  });

  disconnectScribeRef.current = () => scribe.disconnect();

  const handleScribeError = useCallback((err: unknown) => {
    logger.error("[Voice] Scribe runtime error:", err);
    state.isStartingRef.current = false;
    state.clearResetPhaseTimer();
    state.clearSessionStartTimer();
    forceDisconnectScribe();
    state.setPartialTranscript("");

    const message = friendlyErrorMessage(err);
    state.setError(message);
    state.setPhase("error");
    onErrorRef.current?.(message);
    state.scheduleIdleReset();
  }, [state, forceDisconnectScribe, onErrorRef]);

  useEffect(() => { handleScribeErrorRef.current = handleScribeError; }, [handleScribeError]);

  const startListening = useCallback(async () => {
    const scribeStatus = scribe.status ?? "disconnected";
    if (state.isStartingRef.current || scribeStatus === "connecting") return;

    state.clearResetPhaseTimer();
    state.clearSessionStartTimer();

    if (scribeStatus !== "disconnected" || scribe.isConnected) {
      forceDisconnectScribe();
    }

    state.isStartingRef.current = true;
    state.setError(null);
    state.setPartialTranscript("");
    state.setFinalTranscript("");
    state.setAgentResponse("");
    state.setCurrentAction(null);
    state.setPhase("idle");

    try {
      const { data, error: tokenError } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (tokenError || !data?.token) {
        logger.error("[Voice] Token error:", tokenError);
        throw new Error("Não foi possível obter token de transcrição");
      }

      logger.log("[Voice] Token obtained, connecting to Scribe...");

      state.sessionStartTimerRef.current = setTimeout(() => {
        if (!state.isStartingRef.current) return;
        handleScribeError(new Error("Scribe session start timeout"));
      }, SESSION_START_TIMEOUT_MS);

      await scribe.connect({
        token: data.token,
        ...SCRIBE_CONNECT_OPTIONS,
      });

      logger.log("[Voice] Scribe connection initiated");
    } catch (err) {
      state.isStartingRef.current = false;
      state.clearSessionStartTimer();
      logger.error("[Voice] startListening error:", err);
      const message = friendlyErrorMessage(err);
      state.setError(message);
      state.setPhase("error");
      onErrorRef.current?.(message);
      state.scheduleIdleReset();
    }
  }, [state, forceDisconnectScribe, handleScribeError, onErrorRef, scribe]);

  const stopListening = useCallback(() => {
    state.isStartingRef.current = false;
    state.clearResetPhaseTimer();
    state.clearSessionStartTimer();
    scribe.disconnect();

    if (state.phase === "listening") {
      if (state.partialTranscript.trim()) {
        processTranscript(state.partialTranscript.trim());
      } else {
        state.setPhase("idle");
      }
    } else if (state.phase !== "processing" && state.phase !== "speaking") {
      state.setPhase("idle");
    }
  }, [state, processTranscript, scribe]);

  const reset = useCallback(() => {
    scribe.disconnect();
    cleanupSpeaking();
    state.resetAll();
  }, [scribe, cleanupSpeaking, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      state.clearResetPhaseTimer();
      state.clearSessionStartTimer();
      try { disconnectScribeRef.current(); } catch { /* noop */ }
      cleanupSpeaking();
    };
  }, [state, cleanupSpeaking]);

  return {
    phase: state.phase,
    partialTranscript: state.partialTranscript,
    finalTranscript: state.finalTranscript,
    agentResponse: state.agentResponse,
    error: state.error,
    currentAction: state.currentAction,
    isConnected: scribe.isConnected,
    startListening,
    stopListening,
    stopSpeaking,
    reset,
  };
}