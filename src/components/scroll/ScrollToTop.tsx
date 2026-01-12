import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScrollToTopProps {
  threshold?: number;
  smooth?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'pill';
  showProgress?: boolean;
}

export function ScrollToTop({
  threshold = 300,
  smooth = true,
  className,
  variant = 'default',
  showProgress = false,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      setIsVisible(scrollY > threshold);
      setScrollProgress(documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [smooth]);

  const variants = {
    default: 'h-10 w-10 rounded-full',
    minimal: 'h-8 w-8 rounded-lg',
    pill: 'h-10 px-4 rounded-full gap-2',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className={cn(
            'fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40',
            className
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            onClick={scrollToTop}
            className={cn(
              'shadow-lg hover:shadow-xl transition-all',
              'bg-card/90 backdrop-blur-sm border',
              'hover:bg-primary hover:text-primary-foreground',
              variants[variant]
            )}
          >
            {showProgress ? (
              <div className="relative">
                <svg className="w-6 h-6 -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - scrollProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                </svg>
                <ArrowUp className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
            ) : (
              <>
                {variant === 'pill' ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span className="text-sm">Topo</span>
                  </>
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </>
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Reading progress indicator
export function ReadingProgress({ className }: { className?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50',
        className
      )}
    >
      <motion.div
        className="h-full bg-primary"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  );
}

// Infinite scroll hook
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
    container?: React.RefObject<HTMLElement>;
  } = {}
) {
  const { threshold = 100, enabled = true, container } = options;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || isLoading) return;

    const handleScroll = () => {
      const target = container?.current || document.documentElement;
      const scrollTop = target.scrollTop || window.scrollY;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight || window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        setIsLoading(true);
        callback();
      }
    };

    const scrollTarget = container?.current || window;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, [callback, threshold, enabled, isLoading, container]);

  const resetLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return { isLoading, resetLoading };
}
