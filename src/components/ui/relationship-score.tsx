import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

function getTrend(score: number, previousScore?: number) {
  if (previousScore === undefined || previousScore === score) return 'stable';
  return score > previousScore ? 'up' : 'down';
}

export function RelationshipScore({ score, previousScore, size = 'md', showLabel, showMilestone = false, className }: RelationshipScoreProps) {

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

  const getRingGlow = (_score: number) => {
    return ''; // Flat design — no glow
  };

  const sizeClasses = {
    sm: { container: 'w-10 h-10', text: 'text-xs', bar: 'h-1', trendIcon: 'w-2.5 h-2.5' },
    md: { container: 'w-14 h-14', text: 'text-sm', bar: 'h-1.5', trendIcon: 'w-3 h-3' },
    lg: { container: 'w-20 h-20', text: 'text-lg', bar: 'h-2', trendIcon: 'w-4 h-4' },
  };

  const sizes = sizeClasses[size];
  const trend = getTrend(score, previousScore);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const delta = previousScore !== undefined ? score - previousScore : 0;

  const scoreCircle = (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={cn(
          'rounded-full flex items-center justify-center border-2 border-current transition-shadow duration-300',
          sizes.container,
          getColor(score),
          getRingGlow(score)
        )}
      >
        <span className={cn('font-bold tabular-nums', sizes.text)}>{score}</span>
      </motion.div>
      {/* Trend indicator badge */}
      {previousScore !== undefined && trend !== 'stable' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.2 }}
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full p-0.5',
            trend === 'up' ? 'bg-success/20' : 'bg-destructive/20'
          )}
        >
          <TrendIcon className={cn(sizes.trendIcon, trendColor)} />
        </motion.div>
      )}
    </div>
  );

  return (
    <div className={cn('flex flex-col items-center gap-1', className)} role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de relacionamento: ${score}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          {scoreCircle}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1">
          <p className="font-medium">Score: {score}/100 — {getScoreLabel(score)}</p>
          {previousScore !== undefined && delta !== 0 && (
            <p className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="w-3 h-3" />
              {delta > 0 ? '+' : ''}{delta} pts
            </p>
          )}
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
