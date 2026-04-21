import React, { type RefObject } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  sentinelRef: RefObject<HTMLDivElement>;
  hasMore: boolean;
  totalLoaded: number;
  total: number;
}

export const InfiniteScrollSentinel = React.memo(function InfiniteScrollSentinel({
  sentinelRef, hasMore, totalLoaded, total,
}: Props) {
  if (total === 0) return null;

  if (hasMore) {
    return (
      <div ref={sentinelRef} className="space-y-3 py-4" aria-live="polite" aria-busy="true">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <p className="text-center text-xs text-muted-foreground">Carregando mais interações…</p>
      </div>
    );
  }

  return (
    <div className="py-4 text-center text-xs text-muted-foreground">
      Fim da lista — {totalLoaded} {totalLoaded === 1 ? 'interação exibida' : 'interações exibidas'}
    </div>
  );
});
