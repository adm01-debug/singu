import { lazy } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Target, Clock } from 'lucide-react';
import { Typography } from '@/components/ui/typography';
import { LazySection } from '@/components/dashboard/LazySection';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { BestTimeHeatmapCard } from '@/components/dashboard/BestTimeHeatmapCard';

const ChurnPredictionPanel = lazy(() => import('@/components/analytics/ChurnPredictionPanel').then(m => ({ default: m.ChurnPredictionPanel })));
const BestTimeToContactPanel = lazy(() => import('@/components/analytics/BestTimeToContactPanel').then(m => ({ default: m.BestTimeToContactPanel })));
const DealVelocityPanel = lazy(() => import('@/components/analytics/DealVelocityPanel').then(m => ({ default: m.DealVelocityPanel })));
const PurchasePatternsPanel = lazy(() => import('@/components/analytics/PurchasePatternsPanel').then(m => ({ default: m.PurchasePatternsPanel })));
const BehaviorAlertsPanel = lazy(() => import('@/components/analytics/BehaviorAlertsPanel').then(m => ({ default: m.BehaviorAlertsPanel })));
const RFMAnalysisPanel = lazy(() => import('@/components/analytics/RFMAnalysisPanel').then(m => ({ default: m.RFMAnalysisPanel })));

interface IntelligenceTabProps {
  prefersReducedMotion: boolean;
  tabDirection: number;
}

export function IntelligenceTab({ prefersReducedMotion, tabDirection }: IntelligenceTabProps) {
  const animVariants = {
    initial: { opacity: 0, x: prefersReducedMotion ? 0 : tabDirection * 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: prefersReducedMotion ? 0.01 : 0.2, ease: 'easeOut' as const },
  };

  return (
    <motion.div key={`intelligence-${tabDirection}`} initial={animVariants.initial} animate={animVariants.animate} transition={animVariants.transition} className="space-y-5">
      <DashboardErrorBoundary sectionName="Padrões de Compra">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4" gradient>Padrões de Compra e Comportamento</Typography>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LazySection fallbackVariant="chart">
            <PurchasePatternsPanel compact />
          </LazySection>
          <LazySection fallbackVariant="card">
            <BehaviorAlertsPanel compact />
          </LazySection>
        </div>
      </DashboardErrorBoundary>

      <DashboardErrorBoundary sectionName="Inteligência de Negócios">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" aria-hidden="true" />
          <Typography variant="h4" gradient>Inteligência de Negócios</Typography>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <LazySection fallbackVariant="chart">
            <ChurnPredictionPanel compact />
          </LazySection>
          <LazySection fallbackVariant="chart">
            <BestTimeToContactPanel compact />
          </LazySection>
          <LazySection fallbackVariant="chart">
            <DealVelocityPanel compact />
          </LazySection>
        </div>

        <div className="mt-5">
          <LazySection fallbackVariant="chart" fallbackHeight="h-64">
            <RFMAnalysisPanel compact />
          </LazySection>
        </div>
      </DashboardErrorBoundary>
    </motion.div>
  );
}
