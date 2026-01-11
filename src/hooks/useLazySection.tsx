import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazySectionOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useLazySection(options: UseLazySectionOptions = {}) {
  const { threshold = 0.1, rootMargin = '100px', triggerOnce = true } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);
        
        if (isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

  return { ref, isVisible, hasBeenVisible };
}

// Hook for prefetching data when section is about to be visible
export function useLazySectionWithPrefetch<T>(
  prefetchFn: () => Promise<T>,
  options: UseLazySectionOptions = {}
) {
  const { ref, isVisible, hasBeenVisible } = useLazySection({
    ...options,
    rootMargin: options.rootMargin || '200px', // Start prefetching earlier
  });
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasBeenVisible && !hasFetched.current) {
      hasFetched.current = true;
      setIsLoading(true);
      
      prefetchFn()
        .then(setData)
        .catch(setError)
        .finally(() => setIsLoading(false));
    }
  }, [hasBeenVisible, prefetchFn]);

  return { ref, isVisible, hasBeenVisible, data, isLoading, error };
}

// Component wrapper for lazy sections
interface LazyRenderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  priority?: 'high' | 'normal' | 'low';
}

export function LazyRender({ 
  children, 
  fallback, 
  threshold = 0.1,
  rootMargin = '100px',
  className,
  priority = 'normal'
}: LazyRenderProps) {
  const { ref, hasBeenVisible } = useLazySection({ threshold, rootMargin });
  
  // High priority items render immediately
  const shouldRender = priority === 'high' || hasBeenVisible;

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
}
