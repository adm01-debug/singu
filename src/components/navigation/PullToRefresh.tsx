import { useState, useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  /** Minimum pull distance to trigger refresh (px). Default: 80 */
  threshold?: number;
  /** Whether the component is enabled. Default: true */
  enabled?: boolean;
  className?: string;
}

/**
 * Global pull-to-refresh wrapper for list pages.
 * Only activates when the page is scrolled to the top.
 * Shows a rotating refresh indicator during pull.
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  enabled = true,
  className,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);
  const pullDistance = useMotionValue(0);
  const opacity = useTransform(pullDistance, [0, threshold], [0, 1]);
  const rotate = useTransform(pullDistance, [0, threshold], [0, 360]);
  const scale = useTransform(pullDistance, [0, threshold * 0.5, threshold], [0.5, 0.8, 1]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || isRefreshing) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 5) {
      touchStartRef.current = { y: e.touches[0].clientY, scrollTop };
    }
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isRefreshing) return;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    if (deltaY > 0 && window.scrollY <= 5) {
      pullDistance.set(Math.min(deltaY * 0.5, threshold * 1.5));
    }
  }, [isRefreshing, pullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchStartRef.current) return;
    const currentPull = pullDistance.get();

    if (currentPull >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      pullDistance.set(threshold * 0.6);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    pullDistance.set(0);
    touchStartRef.current = null;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none md:hidden"
        style={{ opacity, y: useTransform(pullDistance, [0, threshold], [-20, 12]) }}
      >
        <motion.div
          className="w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center"
          style={{ scale }}
        >
          <motion.div style={{ rotate }}>
            <RefreshCw className={cn('w-4 h-4 text-primary', isRefreshing && 'animate-spin')} />
          </motion.div>
        </motion.div>
      </motion.div>

      {children}
    </div>
  );
}
