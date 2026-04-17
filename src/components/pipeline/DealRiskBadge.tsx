import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/hooks/useDealSlipRisk';

interface Props {
  score: number;
  level: RiskLevel;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const config: Record<RiskLevel, { label: string; cls: string; Icon: typeof Activity }> = {
  healthy: {
    label: 'Saudável',
    cls: 'bg-success/15 text-success border-success/30 hover:bg-success/25',
    Icon: ShieldCheck,
  },
  attention: {
    label: 'Atenção',
    cls: 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25',
    Icon: Activity,
  },
  high: {
    label: 'Risco alto',
    cls: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25',
    Icon: AlertTriangle,
  },
};

export function DealRiskBadge({ score, level, onClick, className }: Props) {
  const { label, cls, Icon } = config[level];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(e);
            }}
            className={cn('inline-flex', className)}
            aria-label={`Risco ${label}: ${score}/100`}
          >
            <Badge variant="outline" className={cn('gap-1 text-[10px] px-1.5 py-0 h-5 cursor-pointer', cls)}>
              <Icon className="h-3 w-3" />
              {score}
            </Badge>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs font-medium">Slip Risk: {label}</p>
          <p className="text-[10px] text-muted-foreground">Clique para ver detalhes</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
