import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with directional animations:
 * - Forward navigation: slide from right + fade in, exit slide to left
 * - Back navigation: slide from left + fade in, exit slide to right
 * - Uses AnimatePresence with location key for proper exit animations
 * - Respects prefers-reduced-motion
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { direction } = useNavigationStack();
  const location = useLocation();

  const slideOffset = direction === 'back' ? -16 : 16;
  const exitOffset = direction === 'back' ? 16 : -16;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: slideOffset }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: exitOffset }}
        transition={{
          duration: 0.18,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
