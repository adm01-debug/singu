import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

/**
 * Visual edge indicator + swipe-back gesture handler for mobile.
 * Shows a subtle gradient bar on the left edge when the user starts
 * swiping from the edge, providing visual feedback before the gesture completes.
 */
export function SwipeBackIndicator() {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const location = useLocation();
  const { goBack } = useNavigationStack();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isEdgeRef = useRef(false);

  const isRoot = location.pathname === '/';

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= 25 && !isRoot) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      isEdgeRef.current = true;
      setIsActive(true);
    }
  }, [isRoot]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isEdgeRef.current || !touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Only track horizontal swipes
    if (deltaX > 0 && deltaX > deltaY) {
      const progress = Math.min(deltaX / 120, 1); // 120px = full progress
      setSwipeProgress(progress);
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isEdgeRef.current || !touchStartRef.current) {
      setIsActive(false);
      setSwipeProgress(0);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (deltaX > 80 && deltaX > deltaY * 1.5) {
      goBack('/');
    }

    touchStartRef.current = null;
    isEdgeRef.current = false;
    setIsActive(false);
    setSwipeProgress(0);
  }, [goBack]);

  useEffect(() => {
    if (isRoot) return;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRoot, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (isRoot) return null;

  return (
    <AnimatePresence>
      {isActive && swipeProgress > 0.05 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: swipeProgress }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-y-0 left-0 z-50 pointer-events-none md:hidden"
          style={{ width: `${Math.max(4, swipeProgress * 40)}px` }}
        >
          <div 
            className="h-full bg-gradient-to-r from-primary/30 to-transparent rounded-r-full"
            style={{ opacity: swipeProgress }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
