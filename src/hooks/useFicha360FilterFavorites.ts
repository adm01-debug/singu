import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ficha360-filter-favorites-v1';
const MAX_FAVORITES = 10;
const VALID_DAYS = [7, 30, 90, 365] as const;
const VALID_CHANNELS = ['whatsapp', 'call', 'email', 'meeting', 'note'] as const;

export interface FilterFavorite {
  id: string;
  name: string;
  days: number;
  channels: string[];
  createdAt: number;
}

export interface SharedFavoritePayload {
  name: string;
  days: number;
  channels: string[];
}

function isValidDays(d: unknown): d is number {
  return typeof d === 'number' && (VALID_DAYS as readonly number[]).includes(d);
}

function sanitizeChannels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(VALID_CHANNELS);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    if (typeof c !== 'string') continue;
    const norm = c.trim().toLowerCase();
    if (!allowed.has(norm) || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out.sort();
}

function sanitizeName(raw: unknown, fallback = 'Favorito'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim().slice(0, 40);
  return trimmed || fallback;
}

function readAll(): FilterFavorite[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: FilterFavorite[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const r = item as Record<string, unknown>;
      if (typeof r.id !== 'string' || !isValidDays(r.days)) continue;
      out.push({
        id: r.id,
        name: sanitizeName(r.name),
        days: r.days,
        channels: sanitizeChannels(r.channels),
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function writeAll(items: FilterFavorite[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fav_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sameCombo(a: FilterFavorite, days: number, channels: string[]): boolean {
  if (a.days !== days) return false;
  if (a.channels.length !== channels.length) return false;
  for (let i = 0; i < a.channels.length; i++) {
    if (a.channels[i] !== channels[i]) return false;
  }
  return true;
}

// ── Codificação para link compartilhado (base64url) ──

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUtf8(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeFavoriteToToken(payload: SharedFavoritePayload): string {
  const safe: SharedFavoritePayload = {
    name: sanitizeName(payload.name),
    days: isValidDays(payload.days) ? payload.days : 90,
    channels: sanitizeChannels(payload.channels),
  };
  // v1 = versão; mantém payload curto para URL
  return utf8ToBase64Url(JSON.stringify({ v: 1, ...safe }));
}

export function decodeFavoriteFromToken(token: string): SharedFavoritePayload | null {
  try {
    const json = base64UrlToUtf8(token);
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object') return null;
    const r = parsed as Record<string, unknown>;
    if (r.v !== 1) return null;
    if (!isValidDays(r.days)) return null;
    return {
      name: sanitizeName(r.name),
      days: r.days,
      channels: sanitizeChannels(r.channels),
    };
  } catch {
    return null;
  }
}

/**
 * Constrói a URL compartilhável preservando a rota atual e adicionando
 * `?favorito=<token>`. Remove `q` (busca textual é contextual e não vai junto).
 */
export function buildFavoriteShareUrl(token: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('favorito', token);
  url.searchParams.delete('q');
  return url.toString();
}

/**
 * Hook que gerencia favoritos de filtros (período + canais) em localStorage,
 * com sincronização entre abas via evento `storage`.
 */
export function useFicha360FilterFavorites() {
  const [favorites, setFavorites] = useState<FilterFavorite[]>(() => readAll());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setFavorites(readAll());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next: FilterFavorite[]) => {
    setFavorites(next);
    writeAll(next);
  }, []);

  const findMatch = useCallback(
    (days: number, channels: string[]): FilterFavorite | null => {
      const sorted = sanitizeChannels(channels);
      return favorites.find((f) => sameCombo(f, days, sorted)) ?? null;
    },
    [favorites],
  );

  const save = useCallback(
    (name: string, days: number, channels: string[]): FilterFavorite | null => {
      if (!isValidDays(days)) return null;
      const cleanName = sanitizeName(name, '');
      if (!cleanName) return null;
      const cleanChannels = sanitizeChannels(channels);
      const existing = favorites.find((f) => sameCombo(f, days, cleanChannels));
      if (existing) return existing;
      if (favorites.length >= MAX_FAVORITES) return null;
      const next: FilterFavorite = {
        id: genId(),
        name: cleanName,
        days,
        channels: cleanChannels,
        createdAt: Date.now(),
      };
      persist([next, ...favorites]);
      return next;
    },
    [favorites, persist],
  );

  const remove = useCallback(
    (id: string) => persist(favorites.filter((f) => f.id !== id)),
    [favorites, persist],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const cleanName = sanitizeName(name, '');
      if (!cleanName) return;
      persist(favorites.map((f) => (f.id === id ? { ...f, name: cleanName } : f)));
    },
    [favorites, persist],
  );

  /**
   * Importa um favorito recebido via link, evitando duplicatas.
   * Se já existe combinação igual, devolve a existente sem criar nova.
   */
  const importShared = useCallback(
    (payload: SharedFavoritePayload): FilterFavorite | null => {
      const cleanChannels = sanitizeChannels(payload.channels);
      const existing = favorites.find((f) => sameCombo(f, payload.days, cleanChannels));
      if (existing) return existing;
      if (favorites.length >= MAX_FAVORITES) return null;
      // dedupe de nome
      const used = new Set(favorites.map((f) => f.name));
      let finalName = sanitizeName(payload.name);
      if (used.has(finalName)) {
        let i = 2;
        while (used.has(`${finalName} (${i})`)) i++;
        finalName = `${finalName} (${i})`;
      }
      const next: FilterFavorite = {
        id: genId(),
        name: finalName,
        days: payload.days,
        channels: cleanChannels,
        createdAt: Date.now(),
      };
      persist([next, ...favorites]);
      return next;
    },
    [favorites, persist],
  );

  return {
    favorites,
    save,
    remove,
    rename,
    findMatch,
    importShared,
    canSaveMore: favorites.length < MAX_FAVORITES,
    maxFavorites: MAX_FAVORITES,
  };
}

export function suggestFavoriteName(days: number, channels: string[]): string {
  const periodLabel =
    days === 7 ? '7d' : days === 30 ? '30d' : days === 365 ? '1a' : '90d';
  const labels: Record<string, string> = {
    whatsapp: 'WhatsApp',
    call: 'Ligação',
    email: 'Email',
    meeting: 'Reunião',
    note: 'Nota',
  };
  const sorted = sanitizeChannels(channels);
  let chPart = '';
  if (sorted.length === 0) chPart = 'Todos';
  else if (sorted.length === 1) chPart = labels[sorted[0]] ?? sorted[0];
  else if (sorted.length === 2) chPart = sorted.map((c) => labels[c] ?? c).join('+');
  else chPart = `${sorted.length} canais`;
  return `${periodLabel} · ${chPart}`.slice(0, 40);
}
