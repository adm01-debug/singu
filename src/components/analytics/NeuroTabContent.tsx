import React from 'react';
import { motion } from 'framer-motion';
import NeuroPortfolioDashboard from '@/components/analytics/NeuroPortfolioDashboard';
import {
  NeuroEnrichedTriggers,
  NeuroRadarChart,
  NeuroTimeline,
  NeuroABTracker,
  NeuroHeatmapCalendar,
  NeuroTrainingMode,
  NeurochemicalInfluenceMap,
} from '@/components/neuromarketing';

export const NeuroTabContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Main Neuro Portfolio Dashboard */}
      <NeuroPortfolioDashboard />

      {/* Neuro Radar + Timeline Row - Portfolio Aggregated View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeuroRadarChart
          discProfile={null}
          interactions={[]}
          title="Balanço Neural Médio do Portfólio"
        />
        <NeuroTimeline
          contactName="Portfólio Geral"
          interactions={[]}
          maxEntries={8}
        />
      </div>

      {/* Neuro Training Mode - Interactive Learning */}
      <NeuroTrainingMode />

      {/* Neuro Heatmap Calendar - Portfolio-Wide Contact Optimization */}
      <NeuroHeatmapCalendar
        contactName="Portfólio Geral"
      />

      {/* Neurochemical Influence Map - Educational Visual */}
      <NeurochemicalInfluenceMap />

      {/* Neuro A/B Tracker - Portfolio Aggregate (no contact filter) */}
      <NeuroABTracker
        contactName="Portfólio Completo"
      />

      {/* Neuro-Enriched Triggers */}
      <NeuroEnrichedTriggers showAll />
    </motion.div>
  );
};
