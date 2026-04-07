import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

const TTS_TIMEOUT_MS = 15000;
const MIN_AUDIO_SIZE = 100; // bytes

export function playTtsAudio(
  text: string,
  options?: { onStart?: () => void }
): { promise: Promise<void>; stop: () => void } {
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let resolvePromise: (() => void) | null = null;
  let stopped = false;

  const promise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

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
          body: JSON.stringify({ text: text.slice(0, 5000) }),
          signal: controller.signal,
        }
      );
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("TTS request timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    // Check if stopped while fetching
    if (stopped) return;

    if (!ttsResponse.ok) {
      // Try to extract error message from JSON body
      const errBody = await ttsResponse.text().catch(() => "");
      throw new Error(`TTS failed: ${ttsResponse.status} ${errBody}`.trim());
    }

    const contentType = ttsResponse.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      const errorData = await ttsResponse.json();
      throw new Error(errorData?.error || "TTS returned error JSON");
    }

    if (!contentType.includes("audio/")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const blob = await ttsResponse.blob();
    if (blob.size < MIN_AUDIO_SIZE) {
      throw new Error("Audio response too small — likely empty or corrupted");
    }

    // Check if stopped while processing blob
    if (stopped) return;

    objectUrl = URL.createObjectURL(blob);
    audio = new Audio(objectUrl);
    options?.onStart?.();

    return new Promise<void>((resolve, reject) => {
      resolvePromise = resolve;
      if (!audio) { resolve(); return; }

      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error("Audio playback error"));
      };
      audio.play().catch((err) => {
        cleanup();
        // NotAllowedError = autoplay blocked — resolve silently
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          logger.warn("[Voice] Autoplay blocked, resolving silently");
          resolve();
        } else {
          reject(err);
        }
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
    stopped = true;
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
