import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfidenceLevel } from '@/hooks/useDealForecastConfidence';

interface Props {
  confidence: number;
  level: ConfidenceLevel;
  expectedValue: number;
  className?: string;
}

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-info/15 text-info border-info/30',
  high: 'bg-success/15 text-success border-success/30',
};

const LEVEL_LABEL: Record<ConfidenceLevel, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v);

export function DealConfidenceBadge({
  confidence,
  level,
  expectedValue,
  className,
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            'gap-1 cursor-default border',
            LEVEL_STYLES[level],
            className,
          )}
        >
          <Sparkles className="h-3 w-3" />
          {confidence}%
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <p className="font-medium text-xs">
          Confiança {LEVEL_LABEL[level]} · {confidence}/100
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Valor esperado: {formatCurrency(expectedValue)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
