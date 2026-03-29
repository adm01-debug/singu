import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with directional animations:
 * - Forward navigation: slide from right
 * - Back navigation: slide from left
 * - Respects prefers-reduced-motion
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { direction } = useNavigationStack();

  const slideOffset = direction === 'back' ? -12 : 12;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: prefersReducedMotion ? 0 : slideOffset,
      }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
