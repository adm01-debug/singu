import { cn } from '@/lib/utils';
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

/** Flat pill-style score — no circles, no borders */
function getScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-500/15 text-emerald-400';
  if (score >= 60) return 'bg-primary/15 text-primary';
  if (score >= 40) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/15 text-red-400';
}

export function RelationshipScore({ score, previousScore, size = 'md', showLabel, showMilestone = false, className }: RelationshipScoreProps) {
  const trend = getTrend(score, previousScore);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';
  const delta = previousScore !== undefined ? score - previousScore : 0;

  const sizeClasses = {
    sm: { pill: 'px-2 py-0.5 text-xs', trendIcon: 'w-2.5 h-2.5' },
    md: { pill: 'px-2.5 py-1 text-sm', trendIcon: 'w-3 h-3' },
    lg: { pill: 'px-3 py-1.5 text-base', trendIcon: 'w-4 h-4' },
  };

  const sizes = sizeClasses[size];

  const scorePill = (
    <div className={cn(
      'inline-flex items-center gap-1 rounded-md font-semibold tabular-nums',
      sizes.pill,
      getScoreBg(score)
    )}>
      <span>{score}</span>
      {previousScore !== undefined && trend !== 'stable' && (
        <TrendIcon className={cn(sizes.trendIcon, trendColor)} />
      )}
    </div>
  );

  return (
    <div className={cn('flex flex-col items-center gap-1', className)} role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Score de relacionamento: ${score}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          {scorePill}
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
          <div className="w-full bg-muted rounded-full overflow-hidden h-1">
            <div
              style={{ width: `${score}%` }}
              className={cn('h-full rounded-full transition-all duration-500', score >= 60 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500')}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">Relacionamento</p>
        </div>
      )}
    </div>
  );
}
