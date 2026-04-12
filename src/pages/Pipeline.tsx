import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, DollarSign, Clock, Target, ArrowRight } from 'lucide-react';
import { useDealsPipeline, usePipelineSummary, useWeightedForecast, useMoveDeal } from '@/hooks/usePipeline';
import { ExternalDataCard } from '@/components/shared/ExternalDataCard';
import { toast } from 'sonner';

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

const DealCard = React.memo(function DealCard({ deal }: { deal: Record<string, unknown> }) {
  const valor = Number(deal.valor || 0);
  const titulo = String(deal.titulo || 'Sem título');
  const companyName = String(deal.company_name || deal.company_nome || '');
  const diasEstágio = Number(deal.dias_no_estagio_atual || 0);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('dealId', String(deal.id))}
      className="p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm truncate">{titulo}</p>
      {companyName && (
        <p className="text-xs text-muted-foreground truncate mt-0.5">{companyName}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-primary">{formatCurrency(valor)}</span>
        {diasEstágio > 7 && (
          <Badge variant="outline" className="text-xs text-warning">
            <Clock className="h-3 w-3 mr-1" />
            {diasEstágio}d
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
  deals: Record<string, unknown>[];
  onDrop: (dealId: string, stageId: string) => void;
}) {
  const totalValue = deals.reduce((sum, d) => sum + Number(d.valor || 0), 0);

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
          <DealCard key={String(deal.id)} deal={deal} />
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

function SummaryCards({ forecast }: { forecast: Array<Record<string, unknown>> | undefined }) {
  const totals = useMemo(() => {
    if (!forecast) return { total: 0, weighted: 0, count: 0 };
    return forecast.reduce(
      (acc, f) => ({
        total: acc.total + Number(f.total_value || 0),
        weighted: acc.weighted + Number(f.weighted_value || 0),
        count: acc.count + Number(f.count || 0),
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

// ── Main Page ──────────────────────────────────────

export default function Pipeline() {
  const { data: deals, isLoading: dealsLoading, error: dealsError } = useDealsPipeline();
  const { data: forecast } = useWeightedForecast();
  const moveDeal = useMoveDeal();

  const dealsByStage = useMemo(() => {
    const map: Record<string, Record<string, unknown>[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    (deals || []).forEach((deal) => {
      const stage = String((deal as Record<string, unknown>).pipeline_stage || 'lead');
      if (!map[stage]) map[stage] = [];
      map[stage].push(deal as Record<string, unknown>);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Vendas</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus deals com drag & drop</p>
        </div>
      </div>

      <SummaryCards forecast={forecast as Array<Record<string, unknown>> | undefined} />

      <ExternalDataCard
        isLoading={dealsLoading}
        error={dealsError as Error | null}
        emptyMessage="Nenhum deal encontrado no pipeline"
        isEmpty={!deals || (deals as unknown[]).length === 0}
      >
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
      </ExternalDataCard>
    </div>
  );
}
