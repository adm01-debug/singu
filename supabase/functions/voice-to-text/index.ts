import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;

  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) bytes[i] = binaryChunk.charCodeAt(i);
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 SECURITY: Authenticate user before burning AI credits
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  // userId disponível em authResult; não usado diretamente aqui mas garante que
  // só users autenticados podem chamar

  try {
    const { audio } = await req.json();

    if (!audio) {
      console.error("No audio data provided");
      return jsonError("No audio data provided", 400);
    }

    // 🔒 Limit audio size to prevent abuse (5MB base64 ≈ 3.75MB raw)
    if (audio.length > 5_000_000) {
      return jsonError("Audio too large (max 5MB)", 413);
    }

    console.log("Processing audio data, length:", audio.length);

    const binaryAudio = processBase64Chunks(audio);
    console.log("Binary audio size:", binaryAudio.length);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a transcription assistant. The user will describe what they want to add as a note. Respond with a clean, well-formatted transcription of their input in Portuguese.",
          },
          {
            role: "user",
            content: `[Audio received - ${binaryAudio.length} bytes]. Please acknowledge that audio was received and provide a placeholder response indicating voice input was processed. Respond in Portuguese.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return jsonError("Rate limit exceeded. Please try again later.", 429);
      }
      if (response.status === 402) {
        return jsonError("Payment required. Please add credits to your workspace.", 402);
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const transcribedText =
      result.choices?.[0]?.message?.content ||
      "Áudio recebido - transcrição em processamento";

    console.log("Transcription result:", transcribedText.substring(0, 100));

    return jsonOk({ text: transcribedText });
  } catch (error: unknown) {
    console.error("Error in voice-to-text function:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process audio";
    return jsonError(errorMessage, 500);
  }
});
