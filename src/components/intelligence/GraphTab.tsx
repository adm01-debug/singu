import { motion } from 'framer-motion';
import { NetworkVisualization } from '@/components/network/NetworkVisualization';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { MetricMono } from '@/components/intel/MetricMono';
import { useInstantKpis } from '@/hooks/useInstantKpis';

export const GraphTab = () => {
  const { data: kpis } = useInstantKpis();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="intel-card px-3 py-2">
          <MetricMono label="NODES_CO" value={kpis?.total_companies ?? '—'} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="NODES_CT" value={kpis?.total_contacts ?? '—'} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="EDGES_DL" value={kpis?.total_deals ?? '—'} />
        </div>
        <div className="intel-card px-3 py-2">
          <MetricMono label="ACTIVE_24H" value={kpis?.interactions_today ?? '—'} />
        </div>
      </div>

      <SectionFrame title="RELATIONSHIP_GRAPH" meta="LIVE" cornerFrame>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="hidden md:block"
        >
          <ErrorBoundary>
            <NetworkVisualization height={560} />
          </ErrorBoundary>
        </motion.div>
        <div className="md:hidden p-6 text-center">
          <span className="intel-mono text-xs text-muted-foreground">
            ── GRAPH_VIEW unavailable on mobile (≥768px) ──
          </span>
        </div>
      </SectionFrame>
    </div>
  );
};
