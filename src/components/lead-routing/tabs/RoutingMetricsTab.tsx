import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRoutingMetrics } from '@/hooks/useRoutingMetrics';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Clock, Users, CheckCircle2,
  BarChart3, ArrowRightLeft, RefreshCw, Activity,
} from 'lucide-react';
import { RULE_TYPE_LABELS } from '@/types/leadRouting';
import type { AssignmentType } from '@/types/leadRouting';

const TYPE_LABELS: Record<string, string> = {
  auto_round_robin: 'Round-Robin',
  auto_weighted: 'Ponderado',
  auto_territory: 'Território',
  manual: 'Manual',
  handoff: 'Handoff',
  redistribution: 'Redistribuição',
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  progress,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  progress?: number;
}) {
  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {progress !== undefined && (
              <Progress value={progress} className="h-1.5 mt-2" />
            )}
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

  const totalByType = Object.values(metrics.byType).reduce((s, v) => s + (v as number), 0);

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
          subtitle={metrics.slaCompliance >= 80 ? 'Saudável' : 'Atenção necessária'}
          icon={CheckCircle2}
          color={metrics.slaCompliance >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}
          progress={metrics.slaCompliance}
        />
        <MetricCard
          title="Tempo Médio 1º Contato"
          value={`${metrics.avgFirstContactHours}h`}
          subtitle={metrics.avgFirstContactHours <= 2 ? 'Excelente' : metrics.avgFirstContactHours <= 4 ? 'Bom' : 'Lento'}
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
          subtitle={metrics.pendingHandoffs > 0 ? 'Requer ação' : 'Tudo em dia'}
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
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Distribuições por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(metrics.byType)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([type, count]) => {
                const pct = totalByType > 0 ? Math.round(((count as number) / totalByType) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span>{TYPE_LABELS[type] ?? type.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{count as number} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
