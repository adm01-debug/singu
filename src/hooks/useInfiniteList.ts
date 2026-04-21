import { useEffect, useRef, useState, useCallback, startTransition, type RefObject } from 'react';

interface UseInfiniteListResult<T> {
  visible: T[];
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: RefObject<HTMLDivElement>;
}

/**
 * Revela progressivamente itens de uma lista in-memory usando IntersectionObserver.
 * Reseta para `pageSize` quando qualquer dependência em `deps` muda.
 */
export function useInfiniteList<T>(
  items: T[],
  pageSize = 50,
  deps: ReadonlyArray<unknown> = []
): UseInfiniteListResult<T> {
  const safeItems = Array.isArray(items) ? items : [];
  const [count, setCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset quando deps mudam (filtros, sort, etc.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCount(pageSize); }, [pageSize, ...deps]);

  const total = safeItems.length;
  const hasMore = count < total;

  const loadMore = useCallback(() => {
    startTransition(() => setCount(prev => Math.min(prev + pageSize, total === 0 ? prev + pageSize : total)));
  }, [pageSize, total]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const visible = safeItems.slice(0, count);
  return { visible, hasMore, loadMore, sentinelRef };
}
