import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CognitiveBiasType, BiasCategory } from '@/types/cognitive-biases';
import { COGNITIVE_BIAS_INFO, BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';

interface BiasBadgeProps {
  type: CognitiveBiasType;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function BiasBadge({
  type,
  showTooltip = true,
  size = 'md',
  className
}: BiasBadgeProps) {
  const info = COGNITIVE_BIAS_INFO[type];

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
      <span>{info.icon}</span>
      <span>{info.namePt}</span>
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">{info.name}</p>
          <p className="text-xs text-muted-foreground">
            {info.descriptionPt}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BiasCategoryBadgeProps {
  category: BiasCategory;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BiasCategoryBadge({
  category,
  count,
  size = 'md',
  className
}: BiasCategoryBadgeProps) {
  const info = BIAS_CATEGORY_INFO[category];

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-medium',
        info.color,
        sizeClasses[size],
        className
      )}
    >
      <span>{info.icon}</span>
      <span>{info.namePt}</span>
      {count !== undefined && (
        <span className="opacity-70">({count})</span>
      )}
    </Badge>
  );
}

interface BiasIndicatorProps {
  dominantBiases: CognitiveBiasType[];
  compact?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function BiasIndicator({
  dominantBiases,
  compact = false,
  maxDisplay = 3,
  className
}: BiasIndicatorProps) {
  if (dominantBiases.length === 0) return null;

  const displayBiases = dominantBiases.slice(0, maxDisplay);
  const remainingCount = dominantBiases.length - maxDisplay;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1 cursor-help', className)}>
              {displayBiases.map(bias => (
                <span key={bias} className="text-lg">
                  {COGNITIVE_BIAS_INFO[bias].icon}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="text-xs text-muted-foreground">+{remainingCount}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium mb-1">Vieses Detectados</p>
            <ul className="text-xs space-y-1">
              {dominantBiases.map(bias => (
                <li key={bias}>
                  {COGNITIVE_BIAS_INFO[bias].icon} {COGNITIVE_BIAS_INFO[bias].namePt}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayBiases.map(bias => (
        <BiasBadge key={bias} type={bias} size="sm" />
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          +{remainingCount} mais
        </Badge>
      )}
    </div>
  );
}
