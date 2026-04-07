import { logger } from "@/lib/logger";
import { getAuthToken, refreshAuthToken } from "./auth";

/**
 * calculateTimeout — Returns a dynamic fetch timeout (ms) based on text length.
 * Base 10s + 2s per 100 chars, capped at 30s.
 */
function calculateTimeout(textLength: number): number {
  const base = 10000;
  const perHundredChars = 2000;
  const extra = Math.ceil(textLength / 100) * perHundredChars;
  return Math.min(base + extra, 30000);
}

/**
 * playTtsAudio — Fetches TTS audio from the edge function and plays it.
 * Returns a controllable { promise, stop } handle.
 *
 * Features:
 * - Dynamic timeout based on text length
 * - Auto-retry on 401 with session refresh
 * - Proper cleanup of object URLs
 */
export function playTtsAudio(
  text: string,
  options?: { onStart?: () => void }
): { promise: Promise<void>; stop: () => void } {
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let resolvePromise: (() => void) | null = null;

  const promise = (async () => {
    const authToken = await getAuthToken();
    const timeout = calculateTimeout(text.length);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let ttsResponse: Response;
    try {
      ttsResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timer);
    }

    // Auto-retry on 401 with refreshed token
    if (ttsResponse.status === 401) {
      logger.warn("[TTS] 401 received, refreshing session...");
      const newToken = await refreshAuthToken();
      if (newToken) {
        const retryController = new AbortController();
        const retryTimer = setTimeout(() => retryController.abort(), timeout);
        try {
          ttsResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({ text }),
              signal: retryController.signal,
            }
          );
        } finally {
          clearTimeout(retryTimer);
        }
      }
    }

    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.status}`);
    }

    const contentType = ttsResponse.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await ttsResponse.json();
      throw new Error(errorData?.error || "TTS returned error JSON");
    }

    const blob = await ttsResponse.blob();
    if (blob.size === 0) {
      throw new Error("Empty audio response");
    }

    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);
    options?.onStart?.();

    return new Promise<void>((resolve, reject) => {
      resolvePromise = resolve;
      audio!.onended = () => {
        cleanup();
        resolve();
      };
      audio!.onerror = () => {
        cleanup();
        reject(new Error("Audio playback error"));
      };
      audio!.play().catch((err) => {
        cleanup();
        reject(err);
      });
    });
  })();

  function cleanup() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    audio = null;
    resolvePromise = null;
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      const resolve = resolvePromise;
      cleanup();
      resolve?.();
    }
  }

  return { promise, stop };
}
