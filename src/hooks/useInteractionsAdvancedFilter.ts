import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';

export interface AdvancedFilters {
  q: string;
  contact: string;
  company: string;
  canais: string[];
  de?: Date;
  ate?: Date;
}

const KEYS = ['q', 'contact', 'company', 'canais', 'de', 'ate'] as const;

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
    de: parseDate(searchParams.get('de')),
    ate: parseDate(searchParams.get('ate')),
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
    (filters.de ? 1 : 0) +
    (filters.ate ? 1 : 0);

  return { filters, debouncedQ, setFilter, clear, activeCount };
}
