import {
  SAVED_VIEWS_MAX_PER_SCOPE,
  SAVED_VIEWS_NAME_MAX_LENGTH,
  SAVED_VIEWS_SCHEMA_VERSION,
  SAVED_VIEWS_STORAGE_KEY,
} from '@/config/savedViews.config';

/**
 * Uma visualização salva: snapshot serializado dos parâmetros de URL
 * (filtros, sort, paginação) que pode ser reaplicado com 1 clique.
 */
export interface SavedView {
  id: string;
  name: string;
  /** Escopo (ex.: rota base como `/interacoes`) — isola views por página. */
  scope: string;
  /** String de query crua, sem `?`, ex.: `canais=email&sort=oldest&page=2`. */
  query: string;
  createdAt: number;
  updatedAt: number;
}

interface StoredPayload {
  version: number;
  views: SavedView[];
}

function safeRead(): StoredPayload {
  try {
    if (typeof localStorage === 'undefined') return { version: SAVED_VIEWS_SCHEMA_VERSION, views: [] };
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return { version: SAVED_VIEWS_SCHEMA_VERSION, views: [] };
    const parsed = JSON.parse(raw) as StoredPayload | SavedView[] | null;
    // Aceita formato legado (array puro) — promove para o envelope versionado.
    if (Array.isArray(parsed)) {
      return { version: SAVED_VIEWS_SCHEMA_VERSION, views: parsed.filter(isValidView) };
    }
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.views)) {
      return { version: SAVED_VIEWS_SCHEMA_VERSION, views: [] };
    }
    return {
      version: typeof parsed.version === 'number' ? parsed.version : SAVED_VIEWS_SCHEMA_VERSION,
      views: parsed.views.filter(isValidView),
    };
  } catch {
    return { version: SAVED_VIEWS_SCHEMA_VERSION, views: [] };
  }
}

function safeWrite(payload: StoredPayload): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

function isValidView(v: unknown): v is SavedView {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.scope === 'string' &&
    typeof o.query === 'string' &&
    typeof o.createdAt === 'number' &&
    typeof o.updatedAt === 'number'
  );
}

export function sanitizeViewName(name: string): string {
  return name.trim().slice(0, SAVED_VIEWS_NAME_MAX_LENGTH);
}

export function listSavedViews(scope: string): SavedView[] {
  const { views } = safeRead();
  return views
    .filter((v) => v.scope === scope)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `sv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SaveViewInput {
  scope: string;
  name: string;
  query: string;
  /** Se `true`, sobrescreve view existente com o mesmo nome no escopo. */
  overwrite?: boolean;
}

export type SaveViewResult =
  | { ok: true; view: SavedView }
  | { ok: false; reason: 'invalid-name' | 'duplicate' | 'limit-reached' };

export function saveView(input: SaveViewInput): SaveViewResult {
  const name = sanitizeViewName(input.name);
  if (!name) return { ok: false, reason: 'invalid-name' };

  const payload = safeRead();
  const sameScope = payload.views.filter((v) => v.scope === input.scope);
  const existing = sameScope.find((v) => v.name.toLowerCase() === name.toLowerCase());

  const now = Date.now();

  if (existing) {
    if (!input.overwrite) return { ok: false, reason: 'duplicate' };
    const updated: SavedView = { ...existing, name, query: input.query, updatedAt: now };
    const next = payload.views.map((v) => (v.id === existing.id ? updated : v));
    safeWrite({ version: SAVED_VIEWS_SCHEMA_VERSION, views: next });
    return { ok: true, view: updated };
  }

  if (sameScope.length >= SAVED_VIEWS_MAX_PER_SCOPE) {
    return { ok: false, reason: 'limit-reached' };
  }

  const view: SavedView = {
    id: genId(),
    name,
    scope: input.scope,
    query: input.query,
    createdAt: now,
    updatedAt: now,
  };
  safeWrite({ version: SAVED_VIEWS_SCHEMA_VERSION, views: [...payload.views, view] });
  return { ok: true, view };
}

export function deleteView(id: string): void {
  const payload = safeRead();
  const next = payload.views.filter((v) => v.id !== id);
  if (next.length === payload.views.length) return;
  safeWrite({ version: SAVED_VIEWS_SCHEMA_VERSION, views: next });
}

export function renameView(id: string, name: string): SaveViewResult {
  const cleaned = sanitizeViewName(name);
  if (!cleaned) return { ok: false, reason: 'invalid-name' };
  const payload = safeRead();
  const target = payload.views.find((v) => v.id === id);
  if (!target) return { ok: false, reason: 'invalid-name' };
  const dup = payload.views.find(
    (v) => v.scope === target.scope && v.id !== id && v.name.toLowerCase() === cleaned.toLowerCase(),
  );
  if (dup) return { ok: false, reason: 'duplicate' };
  const updated: SavedView = { ...target, name: cleaned, updatedAt: Date.now() };
  const next = payload.views.map((v) => (v.id === id ? updated : v));
  safeWrite({ version: SAVED_VIEWS_SCHEMA_VERSION, views: next });
  return { ok: true, view: updated };
}
