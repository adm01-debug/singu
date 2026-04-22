import React, { type RefObject } from 'react';
import { ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useListDensity } from '@/contexts/DensityContext';

interface Props {
  sentinelRef: RefObject<HTMLDivElement>;
  hasMore: boolean;
  totalLoaded: number;
  total: number;
  /**
   * Override explícito. Quando omitido, herda do `DensityProvider` ou do
   * localStorage (`singu-table-density`) via `useListDensity`.
   */
  density?: 'comfortable' | 'compact';
  onLoadMore?: () => void;
}

export const InfiniteScrollSentinel = React.memo(function InfiniteScrollSentinel({
  sentinelRef, hasMore, totalLoaded, total, density, onLoadMore,
}: Props) {
  const ambient = useListDensity();
  const effectiveDensity = density ?? ambient;

  if (total === 0) return null;

  if (hasMore) {
    const isCompact = effectiveDensity === 'compact';
    const pct = total > 0 ? Math.min(100, Math.round((totalLoaded / total) * 100)) : 0;
    const skeletonCount = isCompact ? 2 : 3;

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
        {onLoadMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              className="h-7 px-3 text-xs gap-1"
              aria-label="Carregar mais interações"
            >
              <ChevronDown className="h-3 w-3" /> Carregar mais
            </Button>
          </div>
        )}
        {Array.from({ length: skeletonCount }).map((_, i) => {
          const variant = SKELETON_VARIANTS[i % SKELETON_VARIANTS.length];
          return isCompact ? (
            <CompactItemSkeleton
              key={i}
              titleMaxWidth={variant.titleWidth}
              metaWidth={variant.metaWidth}
              tagCount={variant.tagCount}
            />
          ) : (
            <ComfortableItemSkeleton
              key={i}
              titleWidth={variant.titleWidth}
              bodyLines={variant.bodyLines}
              tagCount={variant.tagCount}
            />
          );
        })}
        <p className="text-center text-xs text-muted-foreground">
          Carregando mais interações… ({totalLoaded} de {total})
        </p>
      </div>
    );
  }

  const densityLabel = effectiveDensity === 'compact' ? 'compacta' : 'confortável';
  return (
    <div className="py-4 text-center text-xs text-muted-foreground">
      Fim da lista — {totalLoaded} de {total}{' '}
      {totalLoaded === 1 ? 'interação exibida' : 'interações exibidas'}
      {' · '}densidade {densityLabel}
    </div>
  );
});

export function CompactItemSkeleton({ titleMaxWidth = 'max-w-[60%]' }: { titleMaxWidth?: string }) {
  return (
    <div className="flex items-start gap-3 px-2 py-2">
      <Skeleton className="mt-0.5 h-7 w-7 rounded-md shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Skeleton className={cn('h-3.5 flex-1 rounded-sm', titleMaxWidth)} />
          <Skeleton className="h-1.5 w-1.5 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-2/5 rounded-sm" />
      </div>
    </div>
  );
}
