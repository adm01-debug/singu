import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { NLPBriefing } from '@/hooks/usePreContactBriefing';
import { cn } from '@/lib/utils';

interface BriefingObjectionsProps {
  objections: string[];
}

export function BriefingObjections({ objections }: BriefingObjectionsProps) {
  if (objections.length === 0) return null;

  return (
    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <span className="text-sm font-medium text-warning">Atencao: Objecoes Detectadas</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {objections.map((objection, idx) => (
          <Badge key={idx} variant="outline" className="border-warning/30 text-warning">
            {objection}
          </Badge>
        ))}
      </div>
    </div>
  );
}

interface BriefingClosingReadinessProps {
  closingMoment: string;
}

export function BriefingClosingReadiness({ closingMoment }: BriefingClosingReadinessProps) {
  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Potencial de Fechamento</span>
        <Badge className={cn(
          closingMoment === 'Alto potencial' ? 'bg-success text-success-foreground' :
          closingMoment === 'Moderado' ? 'bg-warning text-warning-foreground' :
          'bg-muted text-muted-foreground'
        )}>
          {closingMoment}
        </Badge>
      </div>
      <Progress
        value={closingMoment === 'Alto potencial' ? 85 :
               closingMoment === 'Moderado' ? 50 : 25}
        className="h-2"
      />
    </div>
  );
}

interface BriefingFooterBarProps {
  onDismiss: () => void;
}

export function BriefingFooterBar({ onDismiss }: BriefingFooterBarProps) {
  return (
    <div className="px-4 py-3 bg-muted/30 rounded-b-lg flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        <Zap className="w-3 h-3 inline mr-1" />
        Briefing de 30 segundos &bull; Atualizado agora
      </p>
      <Button size="sm" onClick={onDismiss}>
        <CheckCircle className="w-4 h-4 mr-1" />
        Pronto para ligar
      </Button>
    </div>
  );
}
