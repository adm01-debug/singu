import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurnRisk } from '@/hooks/useChurnRisk';
import { AlertTriangle, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_CONFIG: Record<string, { icon: typeof AlertTriangle; color: string; badgeClass: string }> = {
  critical: { icon: ShieldAlert, color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30' },
  high: { icon: AlertTriangle, color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30' },
  medium: { icon: Info, color: 'text-warning', badgeClass: 'bg-warning/10 text-warning border-warning/30' },
  low: { icon: ShieldCheck, color: 'text-success', badgeClass: 'bg-success/10 text-success border-success/30' },
};

export const ChurnRiskWidget = React.memo(function ChurnRiskWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useChurnRisk(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Risco de Churn</CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-32" /></CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const risk = RISK_CONFIG[data.risk_level?.toLowerCase() || 'low'] || RISK_CONFIG.low;
  const RiskIcon = risk.icon;
  const probability = data.churn_probability != null ? Math.round(data.churn_probability * 100) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RiskIcon className={cn("h-4 w-4", risk.color)} />
            Risco de Churn
          </span>
          <Badge variant="outline" className={cn("text-[10px]", risk.badgeClass)}>
            {data.risk_level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {probability != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Probabilidade</span>
              <span className="font-bold">{probability}%</span>
            </div>
            <Progress value={probability} className="h-2" />
          </div>
        )}

        {data.days_since_contact != null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Dias sem contato</span>
            <span className={cn("font-semibold", data.days_since_contact > 30 ? 'text-destructive' : data.days_since_contact > 14 ? 'text-warning' : 'text-foreground')}>
              {data.days_since_contact}d
            </span>
          </div>
        )}

        {data.risk_factors && data.risk_factors.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Fatores de Risco</p>
            <div className="flex flex-wrap gap-1">
              {data.risk_factors.slice(0, 4).map((factor, i) => (
                <Badge key={i} variant="outline" className="text-[9px]">{factor}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.recommended_actions && data.recommended_actions.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Ações Recomendadas</p>
            <ul className="space-y-0.5">
              {data.recommended_actions.slice(0, 3).map((action, i) => (
                <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-0.5">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default ChurnRiskWidget;
