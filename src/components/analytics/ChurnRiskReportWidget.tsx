import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useChurnRiskReport } from '@/hooks/useReportsAnalytics';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const riskColor = (level: string) => {
  if (level === 'crítico' || level === 'alto') return 'text-destructive';
  if (level === 'médio') return 'text-warning';
  return 'text-success';
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export const ChurnRiskReportWidget = React.memo(function ChurnRiskReportWidget() {
  const { data: report, isLoading } = useChurnRiskReport();

  if (isLoading) return <Skeleton className="h-64 rounded-lg" />;
  if (!report || !Array.isArray(report) || report.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Relatório de Risco de Churn
          <Badge variant="destructive" className="text-[10px] ml-auto">{report.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {report.map((item: Record<string, unknown>, i: number) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{String(item.company_name || item.contact_name || 'N/A')}</p>
                <p className="text-xs text-muted-foreground">
                  {item.days_inactive != null && `${item.days_inactive}d inativo`}
                  {item.last_interaction && ` · Último: ${new Date(String(item.last_interaction)).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {item.revenue_at_risk != null && (
                  <span className="text-xs font-semibold">{formatCurrency(Number(item.revenue_at_risk))}</span>
                )}
                <Badge variant="outline" className={cn('text-[10px]', riskColor(String(item.risk_level || '')))}>
                  {String(item.risk_level || 'N/A')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

export default ChurnRiskReportWidget;
