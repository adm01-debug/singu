import { ReactNode, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DirectionalSkeletonProps {
  /** Variant controls the placeholder shape */
  variant?: 'card' | 'list' | 'detail' | 'grid';
  className?: string;
}

/**
 * Skeleton with a shimmer animation that fades in smoothly.
 * Used as Suspense fallback during lazy-loaded transitions.
 */
export function DirectionalSkeleton({ variant = 'card', className }: DirectionalSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn('p-4 space-y-3', className)}
    >
      {variant === 'card' && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === 'detail' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      )}
      {variant === 'grid' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface SuspenseWithSkeletonProps {
  children: ReactNode;
  variant?: DirectionalSkeletonProps['variant'];
  className?: string;
}

/**
 * Suspense wrapper with directional skeleton fallback.
 * Use this instead of raw <Suspense> for consistent loading states.
 */
export function SuspenseWithSkeleton({ children, variant = 'card', className }: SuspenseWithSkeletonProps) {
  return (
    <Suspense fallback={<DirectionalSkeleton variant={variant} className={className} />}>
      {children}
    </Suspense>
  );
}
