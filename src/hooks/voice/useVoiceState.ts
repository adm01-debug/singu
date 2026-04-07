import { useState, useCallback, useRef } from "react";
import type { VoiceAgentAction, VoiceAgentPhase } from "./types";

const ERROR_RESET_DELAY_MS = 5000;

/**
 * Manages all voice agent state and timer-based phase resets.
 */
export function useVoiceState() {
  const [phase, setPhase] = useState<VoiceAgentPhase>("idle");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<VoiceAgentAction | null>(null);

  const isProcessingRef = useRef(false);
  const isStartingRef = useRef(false);
  const resetPhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetPhaseTimer = useCallback(() => {
    if (resetPhaseTimerRef.current !== null) {
      clearTimeout(resetPhaseTimerRef.current);
      resetPhaseTimerRef.current = null;
    }
  }, []);

  const clearSessionStartTimer = useCallback(() => {
    if (sessionStartTimerRef.current !== null) {
      clearTimeout(sessionStartTimerRef.current);
      sessionStartTimerRef.current = null;
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

  const resetAll = useCallback(() => {
    isStartingRef.current = false;
    isProcessingRef.current = false;
    clearResetPhaseTimer();
    clearSessionStartTimer();
    setPhase("idle");
    setPartialTranscript("");
    setFinalTranscript("");
    setAgentResponse("");
    setError(null);
    setCurrentAction(null);
  }, [clearResetPhaseTimer, clearSessionStartTimer]);

  return {
    // State
    phase, setPhase,
    partialTranscript, setPartialTranscript,
    finalTranscript, setFinalTranscript,
    agentResponse, setAgentResponse,
    error, setError,
    currentAction, setCurrentAction,
    // Refs
    isProcessingRef,
    isStartingRef,
    resetPhaseTimerRef,
    sessionStartTimerRef,
    // Timer helpers
    clearResetPhaseTimer,
    clearSessionStartTimer,
    scheduleIdleReset,
    resetAll,
  };
}