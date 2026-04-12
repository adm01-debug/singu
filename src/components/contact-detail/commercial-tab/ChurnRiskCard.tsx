import { AlertTriangle, TrendingDown, Shield, Calendar, Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useChurnRisk } from '@/hooks/useChurnRisk';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const RISK_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  high: { label: 'Alto Risco', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  medium: { label: 'Risco Médio', color: 'text-warning', bgColor: 'bg-warning/10' },
  low: { label: 'Risco Baixo', color: 'text-success', bgColor: 'bg-success/10' },
};

export function ChurnRiskCard({ contactId }: Props) {
  const { data, isLoading } = useChurnRisk(contactId);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-4 w-32 bg-muted rounded" /></CardHeader>
        <CardContent><div className="h-28 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Risco de Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Sem dados de previsão de churn</p>
        </CardContent>
      </Card>
    );
  }

  const risk = RISK_CONFIG[data.risk_level || 'low'] || RISK_CONFIG.low;
  const probability = data.churn_probability ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingDown className="h-4 w-4 text-destructive" />
          Risco de Churn
        </CardTitle>
        <CardDescription className="text-xs">Previsão baseada em comportamento e engajamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Risk Level + Probability */}
        <div className={cn('rounded-lg p-3', risk.bgColor)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={cn('h-4 w-4', risk.color)} />
              <span className={cn('text-sm font-semibold', risk.color)}>{risk.label}</span>
            </div>
            <span className={cn('text-lg font-bold', risk.color)}>{probability}%</span>
          </div>
          <Progress
            value={probability}
            className={cn('h-2', probability > 70 ? '[&>div]:bg-destructive' : probability > 40 ? '[&>div]:bg-warning' : '[&>div]:bg-success')}
          />
        </div>

        {/* Alert Message */}
        {data.alert_message && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5">
            <p className="text-xs text-foreground">{data.alert_message}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Score</p>
            <p className="text-sm font-medium">{data.relationship_score ?? '—'}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Interações 30d</p>
            <p className="text-sm font-medium">{data.interactions_30d ?? '—'}</p>
          </div>
          <div className="rounded-lg border p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Dias s/ contato</p>
            <p className="text-sm font-medium">{data.days_since_contact ?? '—'}</p>
          </div>
        </div>

        {/* Risk Factors */}
        {data.risk_factors && data.risk_factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Fatores de Risco
            </p>
            <ul className="space-y-0.5">
              {data.risk_factors.slice(0, 5).map((f, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ChevronRight className="h-2.5 w-2.5 text-destructive/50" /> {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-primary flex items-center gap-1">
              <Activity className="h-3 w-3" /> Ações Recomendadas
            </p>
            <ul className="space-y-0.5">
              {data.recommended_actions.slice(0, 4).map((a, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ChevronRight className="h-2.5 w-2.5 text-primary/50" /> {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence */}
        {data.confidence_level && (
          <div className="flex items-center justify-between text-[10px] pt-1 border-t">
            <span className="text-muted-foreground">Confiança da previsão</span>
            <Badge variant="outline" className="text-[10px] capitalize">{data.confidence_level}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
