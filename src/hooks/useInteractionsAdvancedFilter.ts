import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import type { SortKey } from '@/lib/sortInteractions';

export type DirecaoFilter = 'all' | 'inbound' | 'outbound';

export interface AdvancedFilters {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  direcao: DirecaoFilter;
  de?: Date;
  ate?: Date;
  sort: SortKey;
}

const KEYS = ['q', 'contact', 'company', 'canais', 'direcao', 'de', 'ate', 'sort'] as const;

const VALID_DIRECAO: DirecaoFilter[] = ['all', 'inbound', 'outbound'];
function parseDirecao(v: string | null): DirecaoFilter {
  return (VALID_DIRECAO as string[]).includes(v ?? '') ? (v as DirecaoFilter) : 'all';
}

const VALID_SORTS: SortKey[] = ['recent', 'oldest', 'relevance', 'entity'];
function parseSort(v: string | null): SortKey {
  return (VALID_SORTS as string[]).includes(v ?? '') ? (v as SortKey) : 'recent';
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
  }), [searchParams]);

  const debouncedQ = useDebounce(filters.q, 300);

  const setFilter = useCallback(<K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => {
    const next = new URLSearchParams(searchParams);
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

  const activeCount =
    (filters.q ? 1 : 0) +
    (filters.contact ? 1 : 0) +
    (filters.company ? 1 : 0) +
    (filters.canais.length > 0 ? 1 : 0) +
    (filters.direcao !== 'all' ? 1 : 0) +
    (filters.de ? 1 : 0) +
    (filters.ate ? 1 : 0);

  return { filters, debouncedQ, setFilter, clear, activeCount };
}
