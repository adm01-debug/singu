import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { motion, type MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InteractiveCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  children: ReactNode;
  /** Enable hover scale effect */
  hoverScale?: boolean;
  /** Enable press/tap feedback */
  pressEffect?: boolean;
  /** Enable subtle border glow on hover */
  glowOnHover?: boolean;
  /** Make the whole card clickable with proper cursor */
  clickable?: boolean;
  /** Variant for the glow color */
  glowVariant?: 'primary' | 'success' | 'warning' | 'destructive';
}

/**
 * Card wrapper with micro-interactions for hover, press and glow.
 * Uses framer-motion for smooth feedback.
 * Respects prefers-reduced-motion via framer-motion defaults.
 */
const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(({
  children,
  className,
  hoverScale = true,
  pressEffect = true,
  glowOnHover = false,
  clickable = false,
  glowVariant = 'primary',
  ...props
}, ref) => {
  const glowColors = {
    primary: 'hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.25)]',
    success: 'hover:shadow-[0_0_20px_-5px_hsl(var(--success)/0.25)]',
    warning: 'hover:shadow-[0_0_20px_-5px_hsl(var(--warning)/0.25)]',
    destructive: 'hover:shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.25)]',
  };

  const motionProps: MotionProps = {
    whileHover: hoverScale ? { scale: 1.015, y: -2 } : undefined,
    whileTap: pressEffect ? { scale: 0.98 } : undefined,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  };

  return (
    <motion.div
      ref={ref}
      {...motionProps}
      className={cn(
        'rounded-xl border border-border bg-card transition-shadow duration-200',
        clickable && 'cursor-pointer',
        glowOnHover && glowColors[glowVariant],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

InteractiveCard.displayName = 'InteractiveCard';

export { InteractiveCard };
