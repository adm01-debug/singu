import { useRef, useCallback, useEffect } from 'react';
import { List, RowComponentProps } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CSSProperties, ReactElement } from 'react';

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

interface RowData<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
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
  const hasCalledEndReached = useRef(false);

  useEffect(() => {
    hasCalledEndReached.current = false;
  }, [items.length]);

  if (!loading && items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  // Row component following react-window v2 API
  const Row = (props: RowComponentProps<RowData<T>>): ReactElement => {
    const { index, style, items: rowItems, renderItem: rowRenderItem } = props;
    const item = rowItems[index];
    
    if (!item) {
      return <div style={style} />;
    }

    return (
      <div style={style}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(index * 0.02, 0.2), duration: 0.2 }}
        >
          {rowRenderItem(item, index)}
        </motion.div>
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {headerComponent}
      
      <List<RowData<T>>
        style={{ height, width: '100%' }}
        rowCount={items.length}
        rowHeight={itemHeight}
        rowComponent={Row}
        rowProps={{
          items,
          renderItem,
        }}
        overscanCount={overscan}
      />

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
