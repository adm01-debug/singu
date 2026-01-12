import { useState, useRef, ReactNode, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PullToRefreshProps {
  children: ReactNode;
  /** Callback when refresh is triggered */
  onRefresh: () => Promise<void>;
  /** Threshold to trigger refresh (default: 80) */
  threshold?: number;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom pulling component */
  pullingComponent?: ReactNode;
  /** Whether refresh is disabled */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  loadingComponent,
  pullingComponent,
  disabled = false,
  className,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const haptic = useHapticFeedback();
  const prefersReducedMotion = useReducedMotion();

  const y = useMotionValue(0);
  const progress = useTransform(y, [0, threshold], [0, 1]);
  const rotation = useTransform(y, [0, threshold], [0, 180]);
  const indicatorY = useTransform(y, [0, threshold, threshold * 2], [-40, 0, 20]);
  const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const scale = useTransform(y, [0, threshold], [0.5, 1]);

  // Check if at top of scroll
  const isAtTop = () => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop <= 0;
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled) return;

    const offsetY = info.offset.y;

    if (state === 'ready' && offsetY > threshold) {
      setState('refreshing');
      haptic.medium();
      
      try {
        await onRefresh();
        setState('complete');
        haptic.success();
        
        // Reset after showing complete state
        setTimeout(() => {
          setState('idle');
        }, 500);
      } catch (error) {
        setState('idle');
      }
    } else {
      setState('idle');
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !isAtTop()) return;

    const offsetY = info.offset.y;

    if (offsetY > 0) {
      if (offsetY >= threshold && state !== 'ready') {
        setState('ready');
        haptic.light();
      } else if (offsetY < threshold && state === 'ready') {
        setState('pulling');
      } else if (offsetY > 0 && state === 'idle') {
        setState('pulling');
      }
    }
  };

  // Prevent body scroll when pulling
  useEffect(() => {
    if (state === 'pulling' || state === 'ready') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <motion.div
        style={{ y: indicatorY, opacity, scale }}
        className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
      >
        {state === 'refreshing' ? (
          loadingComponent || (
            <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )
        ) : state === 'complete' ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-success/95 backdrop-blur-sm rounded-full p-3 shadow-lg"
          >
            <span className="text-success-foreground">✓</span>
          </motion.div>
        ) : (
          pullingComponent || (
            <div className={cn(
              'bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg transition-colors',
              state === 'ready' && 'bg-primary/10'
            )}>
              <motion.div style={{ rotate: prefersReducedMotion ? 0 : rotation }}>
                <RefreshCw className={cn(
                  'w-6 h-6 transition-colors',
                  state === 'ready' ? 'text-primary' : 'text-muted-foreground'
                )} />
              </motion.div>
            </div>
          )
        )}
      </motion.div>

      {/* Pull text */}
      <motion.div
        style={{ opacity, y: indicatorY }}
        className="absolute top-14 left-0 right-0 text-center z-10 pointer-events-none"
      >
        <span className="text-xs text-muted-foreground">
          {state === 'ready' 
            ? 'Solte para atualizar' 
            : state === 'refreshing'
              ? 'Atualizando...'
              : state === 'complete'
                ? 'Atualizado!'
                : 'Puxe para atualizar'}
        </span>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag={prefersReducedMotion ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{
          y: state === 'refreshing' ? threshold / 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{ y: state === 'refreshing' ? undefined : y }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
