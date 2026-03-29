import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

interface SwipeBackOptions {
  /** Minimum horizontal distance to trigger (px). Default: 80 */
  threshold?: number;
  /** Maximum start X from left edge (px). Default: 30 */
  edgeWidth?: number;
  /** Disable on certain routes */
  disabled?: boolean;
}

/**
 * Enables swipe-from-left-edge to navigate back on mobile.
 * Only triggers when the swipe starts within `edgeWidth` of the left edge.
 */
export function useSwipeBack({
  threshold = 80,
  edgeWidth = 30,
  disabled = false,
}: SwipeBackOptions = {}) {
  const { goBack } = useNavigationStack();
  const location = useLocation();
  const isRoot = location.pathname === '/';

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isEdgeSwipeRef = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= edgeWidth) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      isEdgeSwipeRef.current = true;
    } else {
      isEdgeSwipeRef.current = false;
    }
  }, [edgeWidth]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isEdgeSwipeRef.current || !touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Must be predominantly horizontal and exceed threshold
    if (deltaX > threshold && deltaX > deltaY * 1.5) {
      goBack('/');
    }

    touchStartRef.current = null;
    isEdgeSwipeRef.current = false;
  }, [threshold, goBack]);

  useEffect(() => {
    if (disabled || isRoot) return;

    // Only enable on touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRoot, handleTouchStart, handleTouchEnd]);
}
