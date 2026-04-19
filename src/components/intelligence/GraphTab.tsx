import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { NetworkVisualization } from '@/components/network/NetworkVisualization';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { MetricMono } from '@/components/intel/MetricMono';
import { IntelSkeleton } from '@/components/intel/IntelSkeleton';
import { GraphLegend } from '@/components/intel/GraphLegend';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useInstantKpis } from '@/hooks/useInstantKpis';
import { snapshotGraphCanvas } from '@/lib/graphSnapshot';
import { Camera, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const PERIODS = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
] as const;

const ENTITY_TYPES = [
  { value: 'all', label: 'TODOS' },
  { value: 'contact', label: 'CONTATO' },
  { value: 'company', label: 'EMPRESA' },
  { value: 'deal', label: 'DEAL' },
] as const;

export const GraphTab = () => {
  const { data: kpis, isLoading } = useInstantKpis();
  const [params, setParams] = useSearchParams();
  const period = params.get('period') || '30';
  const entityType = params.get('etype') || 'all';
  const minScore = Number(params.get('minScore') || '0');
  const containerRef = useRef<HTMLDivElement>(null);

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const exportPng = () => {
    const ok = snapshotGraphCanvas(containerRef.current, `graph-snapshot-${Date.now()}`);
    if (ok) toast.success('Snapshot PNG baixado.');
    else toast.error('Não foi possível capturar o grafo.');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado com filtros atuais.');
    } catch {
      toast.error('Falha ao copiar link.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="intel-card px-3 py-2">
          <MetricMono label="NODES_CO" value={isLoading ? '…' : (kpis?.total_companies ?? '—')} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="NODES_CT" value={isLoading ? '…' : (kpis?.total_contacts ?? '—')} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="EDGES_DL" value={isLoading ? '…' : (kpis?.total_deals ?? '—')} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="ACTIVE_24H" value={isLoading ? '…' : (kpis?.interactions_today ?? '—')} />
        </div>
      </div>

      <SectionFrame title="GRAPH_FILTERS" meta="OPERATIONAL">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="intel-eyebrow mb-1.5">PERÍODO</div>
            <div className="flex gap-1">
              {PERIODS.map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={period === p.value ? 'default' : 'outline'}
                  onClick={() => update('period', p.value)}
                  className="intel-mono text-[10px] h-7 px-2"
                  aria-pressed={period === p.value}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="intel-eyebrow mb-1.5">TIPO_ENTIDADE</div>
            <div className="flex flex-wrap gap-1">
              {ENTITY_TYPES.map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={entityType === t.value ? 'default' : 'outline'}
                  onClick={() => update('etype', t.value === 'all' ? '' : t.value)}
                  className="intel-mono text-[10px] h-7 px-2"
                  aria-pressed={entityType === t.value}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="intel-eyebrow mb-1.5 flex items-center justify-between">
              <span>SCORE_MIN</span>
              <span className="intel-mono text-foreground">{minScore}</span>
            </div>
            <Slider
              value={[minScore]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => update('minScore', String(v[0]))}
              aria-label="Score mínimo"
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        title="RELATIONSHIP_GRAPH"
        meta="LIVE"
        cornerFrame
        actions={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={exportPng}
              className="h-7 intel-mono text-[10px] gap-1.5"
              aria-label="Exportar grafo como PNG"
              title="Exportar PNG"
            >
              <Camera className="h-3 w-3" aria-hidden /> PNG
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyShareLink}
              className="h-7 intel-mono text-[10px] gap-1.5"
              aria-label="Copiar link com filtros"
              title="Copiar link com filtros"
            >
              <LinkIcon className="h-3 w-3" aria-hidden /> SHARE
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <IntelSkeleton lines={8} label="RENDERING_GRAPH" />
        ) : (
          <>
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="hidden md:block relative"
            >
              <GraphLegend
                items={[
                  { label: 'Empresa', color: 'hsl(188 95% 55%)', count: kpis?.total_companies },
                  { label: 'Contato', color: 'hsl(280 80% 65%)', count: kpis?.total_contacts },
                  { label: 'Deal', color: 'hsl(45 95% 60%)', count: kpis?.total_deals },
                ]}
              />
              <ErrorBoundary>
                <NetworkVisualization height={560} />
              </ErrorBoundary>
            </motion.div>
            <div className="md:hidden p-6 text-center">
              <span className="intel-mono text-xs text-muted-foreground">
                ── GRAPH_VIEW unavailable on mobile (≥768px) ──
              </span>
            </div>
          </>
        )}
      </SectionFrame>
    </div>
  );
};
