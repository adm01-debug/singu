import { useRef, useCallback, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  className?: string;
  overscan?: number;
}

export function VirtualizedList<T>({
  items,
  height = 600,
  itemHeight = 80,
  renderItem,
  keyExtractor,
  onEndReached,
  endReachedThreshold = 5,
  loading = false,
  loadingComponent,
  emptyComponent,
  headerComponent,
  className,
  overscan = 5,
}: VirtualizedListProps<T>) {
  const listRef = useRef<FixedSizeList>(null);
  const hasCalledEndReached = useRef(false);

  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStopIndex: number }) => {
      if (
        onEndReached &&
        !loading &&
        !hasCalledEndReached.current &&
        visibleStopIndex >= items.length - endReachedThreshold
      ) {
        hasCalledEndReached.current = true;
        onEndReached();
      }
    },
    [items.length, endReachedThreshold, loading, onEndReached]
  );

  useEffect(() => {
    hasCalledEndReached.current = false;
  }, [items.length]);

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index];
      if (!item) return null;

      return (
        <div style={style}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.2 }}
          >
            {renderItem(item, index)}
          </motion.div>
        </div>
      );
    },
    [items, renderItem]
  );

  if (!loading && items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {headerComponent}
      
      <FixedSizeList
        ref={listRef}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={overscan}
        onItemsRendered={handleItemsRendered}
        itemKey={(index) => keyExtractor(items[index])}
      >
        {Row}
      </FixedSizeList>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            {loadingComponent || (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
