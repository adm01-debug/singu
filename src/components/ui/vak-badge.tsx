import { Eye, Ear, Hand, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VAKType, VAK_LABELS } from '@/types/vak';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VAKBadgeProps {
  type: VAKType | null;
  showLabel?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VAK_ICONS: Record<VAKType, typeof Eye> = {
  V: Eye,
  A: Ear,
  K: Hand,
  D: Brain,
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function VAKBadge({ 
  type, 
  showLabel = true, 
  showTooltip = true,
  size = 'md',
  className 
}: VAKBadgeProps) {
  if (!type) return null;

  const label = VAK_LABELS[type];
  const Icon = VAK_ICONS[type];

  const badge = (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1.5 font-medium border',
        label.bgColor,
        label.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{label.name}</span>}
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
          <p className="font-medium">{label.fullName}</p>
          <p className="text-xs text-muted-foreground max-w-48">
            {label.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface VAKIndicatorProps {
  primary: VAKType | null;
  secondary?: VAKType | null;
  confidence?: number;
  compact?: boolean;
  className?: string;
}

export function VAKIndicator({ 
  primary, 
  secondary, 
  confidence,
  compact = false,
  className 
}: VAKIndicatorProps) {
  if (!primary) return null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-lg cursor-help">
              {VAK_LABELS[primary].icon}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Sistema {VAK_LABELS[primary].fullName}</p>
            {secondary && (
              <p className="text-xs text-muted-foreground">
                Secundário: {VAK_LABELS[secondary].name}
              </p>
            )}
            {confidence !== undefined && (
              <p className="text-xs text-muted-foreground">
                {confidence}% confiança
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <VAKBadge type={primary} size="sm" />
      {secondary && (
        <>
          <span className="text-xs text-muted-foreground">+</span>
          <VAKBadge type={secondary} size="sm" showLabel={false} />
        </>
      )}
      {confidence !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">
          ({confidence}%)
        </span>
      )}
    </div>
  );
}

interface VAKSelectorProps {
  value: VAKType | null;
  onChange: (value: VAKType | null) => void;
  className?: string;
}

export function VAKSelector({ value, onChange, className }: VAKSelectorProps) {
  const types: VAKType[] = ['V', 'A', 'K', 'D'];

  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {types.map(type => {
        const label = VAK_LABELS[type];
        const Icon = VAK_ICONS[type];
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(isSelected ? null : type)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
              isSelected
                ? `${label.bgColor} ${label.color} border-current`
                : 'border-muted hover:border-muted-foreground/30 hover:bg-muted/50'
            )}
          >
            <span className="text-xl">{label.icon}</span>
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label.name}</span>
          </button>
        );
      })}
    </div>
  );
}
