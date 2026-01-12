import { useState, useRef, useCallback, TouchEvent } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface SwipeConfig {
  /** Minimum distance to trigger swipe (default: 50px) */
  threshold?: number;
  /** Maximum time for swipe in ms (default: 300ms) */
  maxTime?: number;
  /** Enable haptic feedback */
  haptic?: boolean;
}

interface SwipeState {
  swiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
  velocity: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: (direction: SwipeState['direction']) => void;
}

/**
 * Hook for handling swipe gestures on touch devices
 */
export function useSwipeGestures(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 50, maxTime = 300, haptic = true } = config;
  const hapticFeedback = useHapticFeedback();
  
  const [state, setState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    distance: 0,
    velocity: 0,
  });
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    currentPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    
    setState(prev => ({ ...prev, swiping: true }));
    handlers.onSwipeStart?.();
  }, [handlers]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    
    currentPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    
    // Determine direction
    let direction: SwipeState['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }
    
    const timeElapsed = Date.now() - touchStartRef.current.time;
    const velocity = distance / timeElapsed;
    
    setState({
      swiping: true,
      direction,
      distance,
      velocity,
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !currentPosRef.current) {
      setState({ swiping: false, direction: null, distance: 0, velocity: 0 });
      return;
    }
    
    const deltaX = currentPosRef.current.x - touchStartRef.current.x;
    const deltaY = currentPosRef.current.y - touchStartRef.current.y;
    const timeElapsed = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    
    if (distance >= threshold && timeElapsed <= maxTime) {
      let direction: SwipeState['direction'] = null;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          direction = 'right';
          handlers.onSwipeRight?.();
        } else {
          direction = 'left';
          handlers.onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          direction = 'down';
          handlers.onSwipeDown?.();
        } else {
          direction = 'up';
          handlers.onSwipeUp?.();
        }
      }
      
      if (haptic && direction) {
        hapticFeedback.light();
      }
      
      handlers.onSwipeEnd?.(direction);
    } else {
      handlers.onSwipeEnd?.(null);
    }
    
    touchStartRef.current = null;
    currentPosRef.current = null;
    setState({ swiping: false, direction: null, distance: 0, velocity: 0 });
  }, [threshold, maxTime, haptic, hapticFeedback, handlers]);

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd,
  };

  return {
    state,
    handlers: touchHandlers,
    /** Get horizontal offset for swipe animations */
    getSwipeOffset: () => {
      if (!state.swiping || !touchStartRef.current || !currentPosRef.current) return 0;
      return currentPosRef.current.x - touchStartRef.current.x;
    },
    /** Get vertical offset for swipe animations */
    getVerticalOffset: () => {
      if (!state.swiping || !touchStartRef.current || !currentPosRef.current) return 0;
      return currentPosRef.current.y - touchStartRef.current.y;
    },
  };
}

/**
 * Hook for pull-to-refresh gesture
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, options: { threshold?: number } = {}) {
  const { threshold = 80 } = options;
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number | null>(null);
  const hapticFeedback = useHapticFeedback();

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only activate if at top of scroll
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);
    
    // Apply resistance
    const dampedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(dampedDistance);
    
    if (dampedDistance >= threshold && pullDistance < threshold) {
      hapticFeedback.medium();
    }
  }, [refreshing, threshold, pullDistance, hapticFeedback]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true);
      hapticFeedback.success();
      
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    startYRef.current = null;
  }, [pullDistance, threshold, refreshing, onRefresh, hapticFeedback]);

  return {
    refreshing,
    pullDistance,
    progress: Math.min(pullDistance / threshold, 1),
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
    },
  };
}

export default useSwipeGestures;
