import { memo } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RelationshipScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const RelationshipScore = memo(function RelationshipScore({ score, size = 'md', showLabel, className }: RelationshipScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getBackgroundColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  const sizeClasses = {
    sm: { container: 'w-10 h-10', text: 'text-xs', bar: 'h-1' },
    md: { container: 'w-14 h-14', text: 'text-sm', bar: 'h-1.5' },
    lg: { container: 'w-20 h-20', text: 'text-lg', bar: 'h-2' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center border-2 border-current',
          sizes.container,
          getColor(score)
        )}
      >
        <span className={cn('font-bold', sizes.text)}>{score}</span>
      </div>
      {showLabel && (
        <div className="w-full">
          <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizes.bar)}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', getBackgroundColor(score))}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">Relacionamento</p>
        </div>
      )}
    </div>
  );
});
