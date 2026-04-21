const KEY = 'channel-applied-canais';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VALID = new Set(['whatsapp', 'call', 'email', 'meeting', 'video_call', 'note']);

interface Stored {
  canais: string[];
  ts: number;
}

export function readAppliedCanais(): string[] | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed || !Array.isArray(parsed.canais) || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    const filtered = parsed.canais.filter((v) => typeof v === 'string' && VALID.has(v));
    return filtered.length > 0 ? filtered : null;
  } catch {
    return null;
  }
}

export function writeAppliedCanais(canais: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (!Array.isArray(canais) || canais.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }
    const filtered = canais.filter((v) => typeof v === 'string' && VALID.has(v));
    if (filtered.length === 0) {
      localStorage.removeItem(KEY);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify({ canais: filtered, ts: Date.now() } satisfies Stored));
  } catch {
    /* noop */
  }
}

export function clearAppliedCanais(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
