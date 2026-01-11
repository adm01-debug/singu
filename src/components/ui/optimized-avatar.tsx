import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  loading?: 'lazy' | 'eager';
  showSkeleton?: boolean;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
};

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  className,
  size = 'md',
  loading = 'lazy',
  showSkeleton = true,
}: OptimizedAvatarProps) {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for true lazy loading
  useEffect(() => {
    if (loading === 'eager' || !src) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, src]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !src || hasError) {
      setIsLoading(false);
      return;
    }

    const img = new Image();
    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, hasError]);

  const getFallbackInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div ref={containerRef} className={cn('relative', sizeMap[size], className)}>
      {isLoading && showSkeleton ? (
        <Skeleton className="h-full w-full rounded-full" />
      ) : (
        <Avatar className={cn('h-full w-full', className)}>
          {!hasError && isInView && src && (
            <AvatarImage
              src={src}
              alt={alt}
              loading={loading}
              decoding="async"
              onError={() => setHasError(true)}
              className="object-cover"
            />
          )}
          <AvatarFallback 
            className="bg-primary/10 text-primary font-medium"
            delayMs={hasError ? 0 : 600}
          >
            {getFallbackInitials(fallback)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
