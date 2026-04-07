/**
 * withRetry — Retries an async operation with exponential backoff and jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number; shouldRetry?: (error: unknown) => boolean } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelay = 500, shouldRetry = isRetryableError } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && shouldRetry(err)) {
        // Exponential backoff with jitter to avoid thundering herd
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = delay * 0.2 * Math.random();
        await new Promise((r) => setTimeout(r, delay + jitter));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    // Don't retry auth errors or client validation errors
    if (msg.includes("401") || msg.includes("403") || msg.includes("402")) return false;
    return (
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("fetch") ||
      msg.includes("500") ||
      msg.includes("503") ||
      msg.includes("429") ||
      msg.includes("aborted") ||
      msg.includes("failed to fetch")
    );
  }
  return false;
}

/**
 * Translates technical error messages to user-friendly Portuguese messages.
 */
export function friendlyErrorMessage(error: unknown): string {
  if (error instanceof Event) {
    return "Não foi possível conectar ao serviço de voz. Tente novamente.";
  }

  if (!(error instanceof Error)) return "Erro desconhecido. Tente novamente.";

  const rawMessage = error.message?.trim();
  if (!rawMessage) {
    return "Não foi possível conectar ao serviço de voz. Tente novamente.";
  }

  const msg = rawMessage.toLowerCase();

  if (msg.includes("microphone") || msg.includes("microfone") || msg.includes("permission") || msg.includes("notallowederror"))
    return "Permissão do microfone negada. Habilite o microfone nas configurações do navegador.";
  if (msg.includes("notfounderror") || msg.includes("no audio input"))
    return "Nenhum microfone encontrado. Conecte um microfone e tente novamente.";
  if (msg.includes("token"))
    return "Não foi possível iniciar a transcrição. Tente novamente.";
  if (msg.includes("timeout"))
    return "A conexão de voz demorou demais para responder. Tente novamente.";
  if (msg.includes("429") || msg.includes("rate limit"))
    return "Muitas requisições. Aguarde alguns segundos e tente novamente.";
  if (msg.includes("402") || msg.includes("credits"))
    return "Créditos de IA esgotados. Contate o administrador.";
  if (msg.includes("401") || msg.includes("unauthorized"))
    return "Erro de autenticação. Faça login novamente e tente.";
  if (msg.includes("websocket") || msg.includes("scribe") || msg.includes("closed unexpectedly") || msg.includes("no reason provided"))
    return "Não foi possível conectar ao serviço de voz. Tente novamente.";
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch"))
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  if (msg.includes("tts") || msg.includes("audio"))
    return "Não foi possível reproduzir o áudio. O comando foi executado silenciosamente.";
  if (msg.includes("abort"))
    return "A operação foi cancelada. Tente novamente.";

  return rawMessage.length > 100 ? "Erro inesperado. Tente novamente." : rawMessage;
}

/**
 * Simple client-side rate limiter to prevent accidental rapid-fire calls.
 */
export class RateLimiter {
  private lastCallTime = 0;

  constructor(private minIntervalMs: number = 1000) {}

  canProceed(): boolean {
    const now = Date.now();
    if (now - this.lastCallTime < this.minIntervalMs) return false;
    this.lastCallTime = now;
    return true;
  }

  reset(): void {
    this.lastCallTime = 0;
  }
}
