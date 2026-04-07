import { useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { friendlyErrorMessage } from "./retry";
import { logger } from "@/lib/logger";
import type { VoiceAgentPhase } from "./types";

const SESSION_START_TIMEOUT_MS = 8000;
const SCRIBE_CONNECT_OPTIONS = {
  modelId: "scribe_v2_realtime",
  microphone: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
} as const;

interface ScribeCallbacks {
  onSessionStarted: () => void;
  onPartialTranscript: (text: string) => void;
  onCommittedTranscript: (text: string) => void;
  onError: (error: unknown) => void;
  onDisconnect: () => void;
}

export function useScribeConnection(callbacks: ScribeCallbacks) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => { callbacksRef.current = callbacks; }, [callbacks]);

  const isStartingRef = useRef(false);
  const sessionStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectScribeRef = useRef<() => void>(() => undefined);

  const clearSessionStartTimer = useCallback(() => {
    if (sessionStartTimerRef.current !== null) {
      clearTimeout(sessionStartTimerRef.current);
      sessionStartTimerRef.current = null;
    }
  }, []);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
    onConnect: () => {
      logger.log("[Voice] Scribe socket connected");
    },
    onSessionStarted: () => {
      logger.log("[Voice] Scribe session started");
      isStartingRef.current = false;
      clearSessionStartTimer();
      callbacksRef.current.onSessionStarted();
    },
    onDisconnect: () => {
      logger.log("[Voice] Scribe disconnected");
      isStartingRef.current = false;
      clearSessionStartTimer();
      callbacksRef.current.onDisconnect();
    },
    onError: (err: unknown) => callbacksRef.current.onError(err),
    onPartialTranscript: (data: { text: string }) => {
      callbacksRef.current.onPartialTranscript(data.text);
    },
    onCommittedTranscript: (data: { text: string }) => {
      if (data.text.trim()) {
        callbacksRef.current.onCommittedTranscript(data.text.trim());
      }
    },
  });

  disconnectScribeRef.current = () => scribe.disconnect();

  const forceDisconnect = useCallback(() => {
    clearSessionStartTimer();
    try {
      disconnectScribeRef.current();
    } catch (e) {
      logger.warn("[Voice] Failed to disconnect Scribe:", e);
    }
  }, [clearSessionStartTimer]);

  const connect = useCallback(async () => {
    const scribeStatus = scribe.status ?? "disconnected";
    if (isStartingRef.current || scribeStatus === "connecting") return;

    if (scribeStatus !== "disconnected" || scribe.isConnected) {
      forceDisconnect();
    }

    isStartingRef.current = true;

    try {
      const { data, error: tokenError } = await supabase.functions.invoke("elevenlabs-scribe-token");
      if (tokenError || !data?.token) {
        logger.error("[Voice] Token error:", tokenError);
        throw new Error("Não foi possível obter token de transcrição");
      }

      logger.log("[Voice] Token obtained, connecting to Scribe...");

      sessionStartTimerRef.current = setTimeout(() => {
        if (!isStartingRef.current) return;
        callbacksRef.current.onError(new Error("Scribe session start timeout"));
      }, SESSION_START_TIMEOUT_MS);

      await scribe.connect({
        token: data.token,
        ...SCRIBE_CONNECT_OPTIONS,
      });

      logger.log("[Voice] Scribe connection initiated");
    } catch (err) {
      isStartingRef.current = false;
      clearSessionStartTimer();
      throw err;
    }
  }, [clearSessionStartTimer, forceDisconnect, scribe]);

  const disconnect = useCallback(() => {
    isStartingRef.current = false;
    clearSessionStartTimer();
    scribe.disconnect();
  }, [clearSessionStartTimer, scribe]);

  const cleanup = useCallback(() => {
    clearSessionStartTimer();
    try { disconnectScribeRef.current(); } catch { /* */ }
  }, [clearSessionStartTimer]);

  return {
    connect,
    disconnect,
    forceDisconnect,
    cleanup,
    isConnected: scribe.isConnected,
    isStarting: isStartingRef,
  };
}
