import { supabase } from "@/integrations/supabase/client";

// Dynamic timeout: base 10s + 2s per 100 chars (max 30s)
function calculateTimeout(textLength: number): number {
  const base = 10000;
  const perHundredChars = 2000;
  const extra = Math.ceil(textLength / 100) * perHundredChars;
  return Math.min(base + extra, 30000);
}

export function playTtsAudio(
  text: string,
  options?: { onStart?: () => void }
): { promise: Promise<void>; stop: () => void } {
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  let resolvePromise: (() => void) | null = null;

  const promise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let authToken = session?.access_token;

    if (!authToken) {
      // Try refreshing session before giving up
      const { data } = await supabase.auth.refreshSession();
      authToken = data.session?.access_token;
      if (!authToken) {
        throw new Error("Sessão expirada");
      }
    }

    const timeoutMs = calculateTimeout(text.length);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
      clearTimeout(timeout);
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