import { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useLazySection } from '@/hooks/useLazySection';
import { DashboardSectionSkeleton } from '@/components/skeletons/ContextualSkeletons';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface LazyDashboardSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  priority?: 'high' | 'normal' | 'low';
  className?: string;
  skeleton?: ReactNode;
  delay?: number;
}

/**
 * A dashboard section that lazy loads its content
 * High priority sections render immediately
 * Normal/low priority sections render when scrolled into view
 */
export function LazyDashboardSection({
  title,
  icon: Icon,
  children,
  priority = 'normal',
  className,
  skeleton,
  delay = 0,
}: LazyDashboardSectionProps) {
  const { ref, hasBeenVisible } = useLazySection({
    threshold: 0.1,
    rootMargin: '150px',
  });

  // High priority sections always render
  const shouldRender = priority === 'high' || hasBeenVisible;

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn('space-y-4', className)}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      {shouldRender ? (
        <Suspense fallback={skeleton || <DashboardSectionSkeleton />}>
          {children}
        </Suspense>
      ) : (
        skeleton || <DashboardSectionSkeleton />
      )}
    </motion.section>
  );
}

/**
 * Create a lazy-loaded component with automatic code splitting
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DashboardSectionSkeleton />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Grid of lazy sections with staggered loading
 */
interface LazyGridProps {
  children: ReactNode[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 4 | 6 | 8;
  className?: string;
}

export function LazyGrid({ 
  children, 
  columns = 3, 
  gap = 6,
  className 
}: LazyGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}

/**
 * Progressive loading wrapper - loads content in stages
 */
interface ProgressiveLoaderProps {
  stages: Array<{
    content: ReactNode;
    delay: number;
  }>;
  className?: string;
}

export function ProgressiveLoader({ stages, className }: ProgressiveLoaderProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {stages.map((stage, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stage.delay, duration: 0.3 }}
        >
          {stage.content}
        </motion.div>
      ))}
    </div>
  );
}
