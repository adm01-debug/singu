import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoutingMetrics } from '@/hooks/useRoutingMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Clock, AlertTriangle, Users, CheckCircle2, BarChart3, ArrowRightLeft, RefreshCw } from 'lucide-react';

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RoutingMetricsTab() {
  const { data: metrics, isLoading } = useRoutingMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Distribuições"
          value={metrics.totalAssignments}
          icon={BarChart3}
          color="bg-primary/10 text-primary"
        />
        <MetricCard
          title="Leads Ativos"
          value={metrics.activeAssignments}
          subtitle="Em carteira agora"
          icon={Users}
          color="bg-info/10 text-info"
        />
        <MetricCard
          title="SLA Compliance"
          value={`${metrics.slaCompliance}%`}
          subtitle="Dentro do prazo"
          icon={CheckCircle2}
          color={metrics.slaCompliance >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
        />
        <MetricCard
          title="Tempo Médio 1º Contato"
          value={`${metrics.avgFirstContactHours}h`}
          icon={Clock}
          color="bg-accent/10 text-accent-foreground"
        />
        <MetricCard
          title="SDRs Ativos"
          value={metrics.byRole.sdr}
          icon={TrendingUp}
          color="bg-info/10 text-info"
        />
        <MetricCard
          title="Closers Ativos"
          value={metrics.byRole.closer}
          icon={TrendingUp}
          color="bg-success/10 text-success"
        />
        <MetricCard
          title="Handoffs Pendentes"
          value={metrics.pendingHandoffs}
          icon={ArrowRightLeft}
          color={metrics.pendingHandoffs > 0 ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}
        />
        <MetricCard
          title="Redistribuições"
          value={metrics.redistributions}
          subtitle="Total histórico"
          icon={RefreshCw}
          color="bg-muted text-muted-foreground"
        />
      </div>

      {Object.keys(metrics.byType).length > 0 && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Distribuições por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(metrics.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 rounded bg-muted/50">
                  <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
