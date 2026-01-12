import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete';

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [state, setState] = useState<RefreshState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const isAtTop = useRef(true);

  // Transform values for indicator
  const indicatorY = useTransform(y, [0, threshold], [-40, 0]);
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorRotation = useTransform(y, [0, threshold], [0, 180]);
  const indicatorScale = useTransform(y, [0, threshold, threshold * 1.5], [0.8, 1, 1.1]);

  // Check if at top of scroll
  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      isAtTop.current = containerRef.current.scrollTop <= 0;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !isAtTop.current) {
      y.set(0);
      return;
    }

    if (info.offset.y >= threshold && state === 'ready') {
      setState('refreshing');
      
      try {
        await onRefresh();
        setState('complete');
        
        // Show success state briefly
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      y.set(0);
      setState('idle');
    } else {
      y.set(0);
      setState('idle');
    }
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !isAtTop.current || info.offset.y < 0) {
      return;
    }

    if (info.offset.y >= threshold) {
      setState('ready');
    } else if (info.offset.y > 0) {
      setState('pulling');
    }
  };

  const getIndicatorContent = () => {
    switch (state) {
      case 'pulling':
        return (
          <motion.div style={{ rotate: indicatorRotation }}>
            <ArrowDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        );
      case 'ready':
        return <RefreshCw className="w-5 h-5 text-primary" />;
      case 'refreshing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.div>
        );
      case 'complete':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Check className="w-5 h-5 text-success" />
          </motion.div>
        );
      default:
        return <ArrowDown className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'pulling':
        return 'Puxe para atualizar';
      case 'ready':
        return 'Solte para atualizar';
      case 'refreshing':
        return 'Atualizando...';
      case 'complete':
        return 'Atualizado!';
      default:
        return '';
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Refresh Indicator */}
      <motion.div
        className="absolute left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-10"
        style={{
          y: indicatorY,
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <div className={cn(
          'flex flex-col items-center gap-2 py-3 px-4 rounded-full',
          'bg-background/80 backdrop-blur-sm shadow-lg',
          state === 'refreshing' && 'bg-primary/10',
          state === 'complete' && 'bg-success/10'
        )}>
          {getIndicatorContent()}
          <span className="text-xs text-muted-foreground">{getMessage()}</span>
        </div>
      </motion.div>

      {/* Scrollable Content */}
      <motion.div
        ref={containerRef}
        drag={state !== 'refreshing' ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: state === 'refreshing' ? threshold / 2 : y }}
        className="min-h-full overflow-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Hook version for more control
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullProgress(0);
    }
  }, [onRefresh]);

  return {
    isRefreshing,
    pullProgress,
    setPullProgress,
    handleRefresh,
  };
}
