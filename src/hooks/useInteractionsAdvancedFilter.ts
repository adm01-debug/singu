import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import type { SortKey } from '@/lib/sortInteractions';
import { readAppliedCanais, writeAppliedCanais } from '@/lib/channelPersistence';

export type DirecaoFilter = 'all' | 'inbound' | 'outbound';
export type ViewMode = 'list' | 'by-contact' | 'by-company';

export interface AdvancedFilters {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  direcao: DirecaoFilter;
  de?: Date;
  ate?: Date;
  sort: SortKey;
  view: ViewMode;
  page: number;
  perPage: number;
}

const KEYS = ['q', 'contact', 'company', 'canais', 'direcao', 'de', 'ate', 'sort', 'view', 'page', 'perPage'] as const;

const VALID_VIEWS: ViewMode[] = ['list', 'by-contact', 'by-company'];
function parseView(v: string | null): ViewMode {
  return (VALID_VIEWS as string[]).includes(v ?? '') ? (v as ViewMode) : 'list';
}

const VALID_DIRECAO: DirecaoFilter[] = ['all', 'inbound', 'outbound'];
function parseDirecao(v: string | null): DirecaoFilter {
  return (VALID_DIRECAO as string[]).includes(v ?? '') ? (v as DirecaoFilter) : 'all';
}

const VALID_SORTS: SortKey[] = ['recent', 'oldest', 'relevance', 'entity'];
function parseSort(v: string | null): SortKey {
  return (VALID_SORTS as string[]).includes(v ?? '') ? (v as SortKey) : 'recent';
}

export const VALID_PER_PAGE = [10, 25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 25;
function parsePage(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}
function parsePerPage(v: string | null): number {
  const n = parseInt(v ?? '', 10);
  return (VALID_PER_PAGE as readonly number[]).includes(n) ? n : DEFAULT_PER_PAGE;
}

function parseDate(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export function useInteractionsAdvancedFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: AdvancedFilters = useMemo(() => ({
    q: searchParams.get('q') ?? '',
    contact: searchParams.get('contact') ?? '',
    company: searchParams.get('company') ?? '',
    canais: (searchParams.get('canais') ?? '').split(',').filter(Boolean),
    direcao: parseDirecao(searchParams.get('direcao')),
    de: parseDate(searchParams.get('de')),
    ate: parseDate(searchParams.get('ate')),
    sort: parseSort(searchParams.get('sort')),
    page: parsePage(searchParams.get('page')),
    perPage: parsePerPage(searchParams.get('perPage')),
  }), [searchParams]);

  const debouncedQ = useDebounce(filters.q, 300);

  // Hidratação one-shot do localStorage no mount: URL sempre ganha sobre cache.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (searchParams.get('canais')) return;
    const cached = readAppliedCanais();
    if (cached && cached.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set('canais', cached.join(','));
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persistência reativa: sincroniza canais aplicados com localStorage.
  useEffect(() => {
    writeAppliedCanais(filters.canais);
  }, [filters.canais]);

  const setFilter = useCallback(<K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    const next = new URLSearchParams(searchParams);
    // Reset automático de page sempre que QUALQUER outro filtro mudar.
    if (key !== 'page') next.delete('page');
    if (key === 'canais') {
      const arr = value as string[];
      if (Array.isArray(arr) && arr.length > 0) next.set('canais', arr.join(','));
      else next.delete('canais');
    } else if (key === 'de' || key === 'ate') {
      const d = value as Date | undefined;
      if (d) next.set(key, d.toISOString().slice(0, 10));
      else next.delete(key);
    } else if (key === 'sort') {
      const s = (value as SortKey) ?? 'recent';
      if (s && s !== 'recent') next.set('sort', s);
      else next.delete('sort');
    } else if (key === 'direcao') {
      const d = (value as DirecaoFilter) ?? 'all';
      if (d && d !== 'all') next.set('direcao', d);
      else next.delete('direcao');
    } else if (key === 'page') {
      const n = value as number;
      if (Number.isFinite(n) && n > 1) next.set('page', String(n));
      else next.delete('page');
    } else if (key === 'perPage') {
      const n = value as number;
      if ((VALID_PER_PAGE as readonly number[]).includes(n) && n !== DEFAULT_PER_PAGE) next.set('perPage', String(n));
      else next.delete('perPage');
    } else {
      const v = (value as string) ?? '';
      if (v) next.set(key, v);
      else next.delete(key);
    }
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const clear = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    KEYS.forEach(k => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const applyAll = useCallback((next: Partial<AdvancedFilters>) => {
    const sp = new URLSearchParams(searchParams);
    KEYS.forEach(k => sp.delete(k));
    if (next.q) sp.set('q', next.q);
    if (next.contact) sp.set('contact', next.contact);
    if (next.company) sp.set('company', next.company);
    if (Array.isArray(next.canais) && next.canais.length > 0) sp.set('canais', next.canais.join(','));
    if (next.direcao && next.direcao !== 'all') sp.set('direcao', next.direcao);
    if (next.de instanceof Date && !isNaN(next.de.getTime())) sp.set('de', next.de.toISOString().slice(0, 10));
    if (next.ate instanceof Date && !isNaN(next.ate.getTime())) sp.set('ate', next.ate.toISOString().slice(0, 10));
    if (next.sort && next.sort !== 'recent') sp.set('sort', next.sort);
    if (typeof next.perPage === 'number'
        && (VALID_PER_PAGE as readonly number[]).includes(next.perPage)
        && next.perPage !== DEFAULT_PER_PAGE) {
      sp.set('perPage', String(next.perPage));
    }
    // page nunca é persistida via applyAll: qualquer mudança em filtros deve voltar pra página 1.
    setSearchParams(sp, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Aplica um intervalo de datas atomicamente. Se `de > ate`, faz swap silencioso.
   * Preserva todos os outros filtros e zera page automaticamente.
   * Retorna `true` se houve swap (útil pra UI exibir feedback).
   */
  const applyDateRange = useCallback((de?: Date, ate?: Date): boolean => {
    let swapped = false;
    let from = de;
    let to = ate;
    if (from instanceof Date && to instanceof Date && from.getTime() > to.getTime()) {
      [from, to] = [to, from];
      swapped = true;
    }
    const sp = new URLSearchParams(searchParams);
    sp.delete('page');
    if (from instanceof Date && !isNaN(from.getTime())) sp.set('de', from.toISOString().slice(0, 10));
    else sp.delete('de');
    if (to instanceof Date && !isNaN(to.getTime())) sp.set('ate', to.toISOString().slice(0, 10));
    else sp.delete('ate');
    setSearchParams(sp, { replace: true });
    return swapped;
  }, [searchParams, setSearchParams]);

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.contact ? 1 : 0) +
    (filters.company ? 1 : 0) +
    (filters.canais.length > 0 ? 1 : 0) +
    (filters.direcao !== 'all' ? 1 : 0) +
    (filters.de ? 1 : 0) +
    (filters.ate ? 1 : 0);

  return { filters, debouncedQ, setFilter, clear, activeCount, applyAll, applyDateRange };
}
