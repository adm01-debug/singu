import React, { useMemo, useCallback, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, Target, ArrowRight, Loader2, AlertTriangle, Gauge } from 'lucide-react';
import { useDealsPipeline, usePipelineSummary, useWeightedForecast, useMoveDeal, useStageVelocity, useStalledDeals, useVelocityMetrics, type PipelineDeal, type WeightedForecast } from '@/hooks/usePipeline';
import { useDealSlipRisk } from '@/hooks/useDealSlipRisk';
import { DealRiskBadge } from '@/components/pipeline/DealRiskBadge';
import { DealRiskDrawer } from '@/components/pipeline/DealRiskDrawer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'lead', name: 'Novo Lead', probability: 10, color: 'bg-muted' },
  { id: 'primeiro_contato', name: '1º Contato', probability: 20, color: 'bg-info/20' },
  { id: 'qualificacao', name: 'Qualificação', probability: 30, color: 'bg-info/40' },
  { id: 'proposta', name: 'Proposta', probability: 50, color: 'bg-warning/30' },
  { id: 'negociacao', name: 'Negociação', probability: 70, color: 'bg-warning/50' },
  { id: 'fechamento', name: 'Fechamento', probability: 90, color: 'bg-success/30' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

// ── Deal Card ──────────────────────────────────────

const DealCard = React.memo(function DealCard({ deal }: { deal: PipelineDeal }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('dealId', deal.id)}
      className="p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm truncate">{deal.titulo}</p>
      {deal.company_name && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">{deal.company_name}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-primary">{formatCurrency(deal.valor)}</span>
        {(deal.dias_no_estagio_atual ?? 0) > 7 && (
          <Badge variant="outline" className="text-xs text-warning">
            <Clock className="h-3 w-3 mr-1" />
            {deal.dias_no_estagio_atual}d
          </Badge>
        )}
      </div>
    </div>
  );
});

// ── Pipeline Column ────────────────────────────────

function PipelineColumn({
  stage,
  deals,
  onDrop,
}: {
  stage: typeof STAGES[number];
  deals: PipelineDeal[];
  onDrop: (dealId: string, stageId: string) => void;
}) {
  const totalValue = deals.reduce((sum, d) => sum + (d.valor || 0), 0);

  return (
    <div
      className="flex-1 min-w-[220px] max-w-[280px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('dealId');
        if (dealId) onDrop(dealId, stage.id);
      }}
    >
      <div className={`rounded-t-lg px-3 py-2 ${stage.color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">{stage.probability}%</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {deals.length} deals · {formatCurrency(totalValue)}
        </p>
      </div>
      <div className="space-y-2 p-2 bg-muted/30 rounded-b-lg min-h-[200px] border border-t-0">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Arraste deals para cá
          </p>
        )}
      </div>
    </div>
  );
}

// ── Summary Cards ──────────────────────────────────

function SummaryCards({ forecast }: { forecast: WeightedForecast[] | null | undefined }) {
  const totals = useMemo(() => {
    if (!forecast) return { total: 0, weighted: 0, count: 0 };
    return forecast.reduce(
      (acc, f) => ({
        total: acc.total + (f.total_value || 0),
        weighted: acc.weighted + (f.weighted_value || 0),
        count: acc.count + (f.count || 0),
      }),
      { total: 0, weighted: 0, count: 0 }
    );
  }, [forecast]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Target className="h-4 w-4" />
            Deals Abertos
          </div>
          <p className="text-2xl font-bold mt-1">{totals.count}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <DollarSign className="h-4 w-4" />
            Valor Total
          </div>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totals.total)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="h-4 w-4" />
            Forecast Ponderado
          </div>
          <p className="text-2xl font-bold mt-1 text-success">{formatCurrency(totals.weighted)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <ArrowRight className="h-4 w-4" />
            Taxa Conversão
          </div>
          <p className="text-2xl font-bold mt-1">
            {totals.total > 0 ? ((totals.weighted / totals.total) * 100).toFixed(0) : 0}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Velocity Metrics Panel ─────────────────────────

function VelocityPanel() {
  const { data: velocity } = useVelocityMetrics();
  const { data: stageVel } = useStageVelocity();

  if (!velocity) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-info" /> Velocidade do Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Ciclo Médio</p>
            <p className="text-lg font-bold">{velocity.avg_cycle_days?.toFixed(0) ?? '—'}d</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Win Rate</p>
            <p className="text-lg font-bold text-success">{velocity.win_rate?.toFixed(0) ?? '—'}%</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold">{formatCurrency(velocity.avg_deal_size ?? 0)}</p>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">Velocity Score</p>
            <p className="text-lg font-bold text-primary">{velocity.velocity_score?.toFixed(1) ?? '—'}</p>
          </div>
        </div>
        {stageVel && stageVel.length > 0 && (
          <div className="space-y-1.5 mt-2">
            <p className="text-xs text-muted-foreground font-medium">Tempo por Estágio</p>
            {stageVel.map(sv => (
              <div key={sv.stage} className="flex items-center justify-between text-xs">
                <span>{sv.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sv.avg_days?.toFixed(1)}d avg</span>
                  <span className="text-muted-foreground">({sv.deal_count} deals)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Stalled Deals Panel ───────────────────────────

function StalledDealsPanel() {
  const { data: stalled } = useStalledDeals(14);

  if (!stalled || stalled.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" /> Deals Parados
          <Badge variant="destructive" className="text-[10px] ml-auto">{stalled.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {stalled.map(deal => (
            <div key={deal.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{deal.titulo}</p>
                <p className="text-xs text-muted-foreground">{deal.company_name} · {deal.stage}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold">{formatCurrency(deal.valor)}</span>
                <Badge variant="outline" className={cn('text-[10px]', deal.days_stalled > 30 ? 'text-destructive' : 'text-warning')}>
                  {deal.days_stalled}d parado
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────

export default function Pipeline() {
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useDealsPipeline();
  const { data: forecast } = useWeightedForecast();
  const moveDeal = useMoveDeal();

  const dealsByStage = useMemo(() => {
    const map: Record<string, PipelineDeal[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    (deals || []).forEach((deal) => {
      const stage = deal.pipeline_stage || 'lead';
      if (!map[stage]) map[stage] = [];
      map[stage].push(deal);
    });
    return map;
  }, [deals]);

  const handleDrop = useCallback(
    (dealId: string, stageId: string) => {
      const stage = STAGES.find((s) => s.id === stageId);
      if (!stage) return;
      moveDeal.mutate(
        { dealId, newStage: stageId, probability: stage.probability },
        {
          onSuccess: () => toast.success(`Deal movido para ${stage.name}`),
          onError: () => toast.error('Erro ao mover deal'),
        }
      );
    },
    [moveDeal]
  );

  if (dealsLoading) {
    return (
      <AppLayout title="Pipeline">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (dealsError) {
    return (
      <AppLayout title="Pipeline">
        <div className="text-center py-20 text-destructive">
          <p>Erro ao carregar pipeline</p>
          <p className="text-sm text-muted-foreground mt-1">{(dealsError as Error).message}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pipeline">
      <SEOHead title="Pipeline de Vendas" description="Gerencie seus deals com drag & drop" />
      <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
        <p className="text-muted-foreground text-sm">Gerencie seus deals com drag & drop</p>
      </div>

      <SummaryCards forecast={forecast} />

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={dealsByStage[stage.id] || []}
            onDrop={handleDrop}
          />
        ))}
      </div>

        {/* Velocity & Stalled Deals */}
        <div className="grid gap-4 md:grid-cols-2">
          <VelocityPanel />
          <StalledDealsPanel />
        </div>
      </div>
    </AppLayout>
  );
}
