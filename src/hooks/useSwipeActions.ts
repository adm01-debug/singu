import { useState, useRef, useCallback, useEffect } from 'react';

interface SwipeAction {
  id: string;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeActionsOptions {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  isSwipping: boolean;
  direction: 'left' | 'right' | null;
  distance: number;
  activeAction: SwipeAction | null;
}

export function useSwipeActions({
  leftActions = [],
  rightActions = [],
  threshold = 80,
  enabled = true,
}: SwipeActionsOptions) {
  const [state, setState] = useState<SwipeState>({
    isSwipping: false,
    direction: null,
    distance: 0,
    activeAction: null,
  });

  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    setState(prev => ({ ...prev, isSwipping: true }));
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isSwipping || !enabled) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    if (isHorizontal.current === null) {
      isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
    }

    if (!isHorizontal.current) {
      setState(prev => ({ ...prev, isSwipping: false, distance: 0 }));
      return;
    }

    e.preventDefault();

    const direction = diffX > 0 ? 'right' : 'left';
    const distance = Math.abs(diffX);
    const actions = direction === 'right' ? leftActions : rightActions;
    
    let activeAction: SwipeAction | null = null;
    if (distance >= threshold && actions.length > 0) {
      const actionIndex = Math.min(
        Math.floor((distance - threshold) / threshold),
        actions.length - 1
      );
      activeAction = actions[actionIndex];
    }

    setState({
      isSwipping: true,
      direction,
      distance,
      activeAction,
    });
  }, [state.isSwipping, enabled, leftActions, rightActions, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!state.isSwipping || !enabled) return;

    if (state.activeAction) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      state.activeAction.onAction();
    }

    setState({
      isSwipping: false,
      direction: null,
      distance: 0,
      activeAction: null,
    });
  }, [state.isSwipping, state.activeAction, enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getSwipeStyles = useCallback(() => {
    if (!state.isSwipping || state.distance === 0) {
      return {
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease-out',
      };
    }

    const translateX = state.direction === 'right' ? state.distance : -state.distance;
    return {
      transform: `translateX(${translateX}px)`,
      transition: 'none',
    };
  }, [state]);

  return {
    ...state,
    containerRef,
    getSwipeStyles,
    leftActionsVisible: state.direction === 'right' && state.distance > 20,
    rightActionsVisible: state.direction === 'left' && state.distance > 20,
  };
}
