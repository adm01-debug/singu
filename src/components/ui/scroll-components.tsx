import { motion } from 'framer-motion';
import { ArrowUp, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { useSmoothScroll } from '@/hooks/useScrollEffects';
import { useScrollState } from '@/hooks/useScrollEffects';
import { cn } from '@/lib/utils';

interface ScrollToTopProps {
  threshold?: number;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  variant?: 'default' | 'minimal' | 'floating';
  className?: string;
}

export function ScrollToTop({
  threshold = 300,
  position = 'bottom-right',
  variant = 'default',
  className,
}: ScrollToTopProps) {
  const { scrollY } = useScrollState();
  const { scrollToTop } = useSmoothScroll();
  
  const isVisible = scrollY > threshold;

  const positionClasses = {
    'bottom-right': 'right-4 bottom-4 md:right-6 md:bottom-6',
    'bottom-left': 'left-4 bottom-4 md:left-6 md:bottom-6',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-4 md:bottom-6',
  };

  const variants = {
    default: (
      <Button
        size="icon"
        onClick={scrollToTop}
        className={cn(
          'rounded-full shadow-lg',
          'bg-primary hover:bg-primary/90',
          className
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-4 h-4" />
      </Button>
    ),
    minimal: (
      <button
        onClick={scrollToTop}
        className={cn(
          'p-2 rounded-full bg-muted/80 backdrop-blur-sm',
          'hover:bg-muted transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary',
          className
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp className="w-5 h-5 text-foreground" />
      </button>
    ),
    floating: (
      <Button
        size="sm"
        onClick={scrollToTop}
        className={cn(
          'rounded-full shadow-xl gap-2',
          'bg-gradient-to-r from-primary to-primary/80',
          'hover:shadow-2xl hover:scale-105 transition-all',
          className
        )}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="w-4 h-4" />
        <span className="text-xs">Topo</span>
      </Button>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20,
        scale: isVisible ? 1 : 0.8,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
      transition={{ duration: 0.2 }}
      className={cn(
        'fixed z-40',
        positionClasses[position]
      )}
    >
      {variants[variant]}
    </motion.div>
  );
}

// Scroll Progress Bar
interface ScrollProgressBarProps {
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
  className?: string;
}

export function ScrollProgressBar({
  color = 'bg-primary',
  height = 3,
  position = 'top',
  className,
}: ScrollProgressBarProps) {
  const { scrollProgress } = useScrollState();

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{ height }}
    >
      <motion.div
        className={cn('h-full', color)}
        initial={{ width: '0%' }}
        animate={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

// Scroll Indicator for long content
interface ScrollIndicatorProps {
  className?: string;
}

export function ScrollIndicator({ className }: ScrollIndicatorProps) {
  const { isAtBottom, scrollProgress } = useScrollState();

  if (isAtBottom || scrollProgress > 90) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-30',
        'flex flex-col items-center gap-1',
        className
      )}
    >
      <span className="text-xs text-muted-foreground">Role para ver mais</span>
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ChevronUp className="w-5 h-5 text-muted-foreground rotate-180" />
      </motion.div>
    </motion.div>
  );
}
