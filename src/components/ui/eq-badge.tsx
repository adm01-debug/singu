import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EQPillar, EQLevel } from '@/types/emotional-intelligence';
import { EQ_PILLAR_INFO, EQ_LEVEL_INFO } from '@/data/emotionalIntelligenceData';

interface EQBadgeProps {
  pillar: EQPillar;
  score?: number;
  showScore?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function EQBadge({
  pillar,
  score,
  showScore = true,
  showTooltip = true,
  size = 'md',
  className
}: EQBadgeProps) {
  const info = EQ_PILLAR_INFO[pillar];

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium border',
        info.bgColor,
        info.color,
        sizeClasses[size],
        className
      )}
    >
      <span className={iconSizes[size]}>{info.icon}</span>
      <span>{info.namePt}</span>
      {showScore && score !== undefined && (
        <span className="opacity-70">({score}%)</span>
      )}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{info.name}</p>
          <p className="text-xs text-muted-foreground max-w-48">
            {info.descriptionPt}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EQLevelBadgeProps {
  level: EQLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EQLevelBadge({
  level,
  score,
  size = 'md',
  className
}: EQLevelBadgeProps) {
  const info = EQ_LEVEL_INFO[level];

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium border',
        info.bgColor,
        info.color,
        sizeClasses[size],
        className
      )}
    >
      <span>{info.namePt}</span>
      {score !== undefined && (
        <span className="opacity-70">({score}%)</span>
      )}
    </Badge>
  );
}

interface EQScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EQScoreIndicator({
  score,
  showLabel = true,
  size = 'md',
  className
}: EQScoreIndicatorProps) {
  const getColor = (s: number) => {
    if (s >= 86) return 'text-purple-600 bg-purple-100';
    if (s >= 66) return 'text-green-600 bg-green-100';
    if (s >= 46) return 'text-yellow-600 bg-yellow-100';
    if (s >= 26) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getLevel = (s: number): EQLevel => {
    if (s >= 86) return 'exceptional';
    if (s >= 66) return 'high';
    if (s >= 46) return 'moderate';
    if (s >= 26) return 'developing';
    return 'low';
  };

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-full px-3 py-1 font-bold',
        getColor(score),
        textSize[size]
      )}>
        {score}%
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {EQ_LEVEL_INFO[getLevel(score)].namePt}
        </span>
      )}
    </div>
  );
}

interface EQPillarSummaryProps {
  scores: Record<EQPillar, number>;
  compact?: boolean;
  className?: string;
}

export function EQPillarSummary({
  scores,
  compact = false,
  className
}: EQPillarSummaryProps) {
  const pillars: EQPillar[] = [
    'self_awareness',
    'self_regulation',
    'motivation',
    'empathy',
    'social_skills'
  ];

  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex gap-1', className)}>
          {pillars.map(pillar => (
            <Tooltip key={pillar}>
              <TooltipTrigger asChild>
                <div className="text-lg cursor-help">
                  {EQ_PILLAR_INFO[pillar].icon}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {EQ_PILLAR_INFO[pillar].namePt}: {scores[pillar]}%
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {pillars.map(pillar => (
        <div key={pillar} className="flex items-center gap-2">
          <span className="text-lg w-6">{EQ_PILLAR_INFO[pillar].icon}</span>
          <span className="text-sm flex-1">{EQ_PILLAR_INFO[pillar].namePt}</span>
          <span className={cn(
            'text-sm font-medium',
            scores[pillar] >= 66 ? 'text-green-600' :
            scores[pillar] >= 46 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {scores[pillar]}%
          </span>
        </div>
      ))}
    </div>
  );
}
