import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ScoreMilestone } from './score-milestone';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RelationshipScoreProps {
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showMilestone?: boolean;
  className?: string;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  if (score >= 20) return 'Baixo';
  return 'Crítico';
}

export function RelationshipScore({ score, previousScore, size = 'md', showLabel, showMilestone = false, className }: RelationshipScoreProps) {
  // Use gamified milestone version when enabled
  if (showMilestone) {
    return (
      <ScoreMilestone
        score={score}
        previousScore={previousScore}
        size={size}
        showProgress={showLabel}
        className={className}
      />
    );
  }

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

  const scoreCircle = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center border-2 border-current',
        sizes.container,
        getColor(score)
      )}
    >
      <span className={cn('font-bold', sizes.text)}>{score}</span>
    </div>
  );

  return (
    <div className={cn('flex flex-col items-center gap-1', className)} role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de relacionamento: ${score}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          {scoreCircle}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">Score: {score}/100 — {getScoreLabel(score)}</p>
          <p className="text-muted-foreground">Nível de relacionamento</p>
        </TooltipContent>
      </Tooltip>
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
}
