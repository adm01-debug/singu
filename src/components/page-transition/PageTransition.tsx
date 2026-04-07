import { ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface PageTransitionProps {
  children: ReactNode;
  mode?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
}

const transitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  return <div>{children}</div>;
}


// Number morphing animation for stats
interface MorphingNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}

export function MorphingNumber({
  value,
  duration = 1,
  format = (v) => v.toLocaleString('pt-BR'),
  className,
}: MorphingNumberProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {format(value)}
      </motion.span>
    </motion.span>
  );
}

// Success checkmark animation
interface SuccessCheckmarkProps {
  show: boolean;
  size?: 'sm' | 'md' | 'lg';
  onComplete?: () => void;
}

export function SuccessCheckmark({
  show,
  size = 'md',
  onComplete,
}: SuccessCheckmarkProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const strokeWidth = {
    sm: 3,
    md: 2.5,
    lg: 2,
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          onAnimationComplete={() => onComplete?.()}
          className={`${sizes[size]} flex items-center justify-center`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-full h-full text-success"
          >
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth={strokeWidth[size]}
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            <motion.path
              d="M8 12l2.5 2.5L16 9"
              stroke="currentColor"
              strokeWidth={strokeWidth[size]}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shimmer loading effect
interface ShimmerProps {
  className?: string;
  children?: ReactNode;
}

export function Shimmer({ className, children }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['0%', '200%'] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Pulse animation for notifications
interface PulseRingProps {
  show: boolean;
  color?: string;
  size?: number;
}

export function PulseRing({ show, color = 'hsl(var(--primary))', size = 12 }: PulseRingProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{
            opacity: [0.6, 0],
            scale: [1, 2],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </AnimatePresence>
  );
}
