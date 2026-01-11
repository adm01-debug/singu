import { useState, useEffect, useCallback, useRef } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
  disabled = false,
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false,
  });

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || state.isRefreshing) return;
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
    setState(prev => ({ ...prev, isPulling: true }));
  }, [disabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isPulling || disabled || state.isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff < 0) {
      setState(prev => ({ ...prev, pullDistance: 0, canRefresh: false }));
      return;
    }
    
    const resistance = 0.5;
    const pullDistance = Math.min(diff * resistance, maxPull);
    const canRefresh = pullDistance >= threshold;
    
    if (pullDistance > 0) {
      e.preventDefault();
    }
    
    setState(prev => ({ ...prev, pullDistance, canRefresh }));
  }, [state.isPulling, state.isRefreshing, disabled, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || disabled) return;
    
    if (state.canRefresh && !state.isRefreshing) {
      setState(prev => ({ ...prev, isPulling: false, isRefreshing: true, pullDistance: threshold }));
      
      try {
        await onRefresh();
      } finally {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
          canRefresh: false,
        });
      }
    } else {
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
        canRefresh: false,
      });
    }
  }, [state.isPulling, state.canRefresh, state.isRefreshing, disabled, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document.body;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(state.pullDistance / threshold, 1);

  return {
    ...state,
    progress,
    containerRef,
    pullStyles: {
      transform: `translateY(${state.pullDistance}px)`,
      transition: state.isPulling ? 'none' : 'transform 0.3s ease-out',
    },
  };
}
