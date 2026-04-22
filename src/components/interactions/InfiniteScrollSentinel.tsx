import React, { type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  sentinelRef: RefObject<HTMLDivElement>;
  hasMore: boolean;
  totalLoaded: number;
  total: number;
  density?: 'comfortable' | 'compact';
  onLoadMore?: () => void;
}

export const InfiniteScrollSentinel = React.memo(function InfiniteScrollSentinel({
  sentinelRef, hasMore, totalLoaded, total, density = 'comfortable',
}: Props) {
  if (total === 0) return null;

  if (hasMore) {
    const isCompact = density === 'compact';
    const pct = total > 0 ? Math.min(100, Math.round((totalLoaded / total) * 100)) : 0;
    const skeletonCount = isCompact ? 2 : 3;
    const skeletonHeight = isCompact ? 'h-12' : 'h-20';

    return (
      <div
        ref={sentinelRef}
        className={cn(isCompact ? 'space-y-2 py-2' : 'space-y-3 py-4')}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={totalLoaded}
          aria-label="Carregando mais interações"
          className="h-1 w-full rounded-full bg-muted overflow-hidden"
        >
          <div
            className="h-full bg-primary/70 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className={cn(skeletonHeight, 'w-full rounded-lg')} />
        ))}
        <p className="text-center text-xs text-muted-foreground">
          Carregando mais interações… ({totalLoaded} de {total})
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 text-center text-xs text-muted-foreground">
      Fim da lista — {totalLoaded} {totalLoaded === 1 ? 'interação exibida' : 'interações exibidas'}
    </div>
  );
});
