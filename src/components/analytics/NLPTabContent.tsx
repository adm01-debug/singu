import React from 'react';
import { motion } from 'framer-motion';
import { NLPAnalyticsPanel } from '@/components/analytics/NLPAnalyticsPanel';
import {
  NLPTrainingMode,
  NLPConversionMetrics,
  // Advanced NLP Components
  RapportRealtimeCoach,
  IncongruenceDetector,
  MiltonianCalibration,
  PerceptualPositions,
  TOTEModelMapper,
  HierarchyOfCriteria,
  WellFormedOutcomeBuilder,
  ChunkingNavigator,
  AnchorTrackingSystem,
  StateElicitationToolkit,
  SubmodalityModifier,
  SwishPatternGenerator,
} from '@/components/nlp';

export const NLPTabContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Existing NLP Analytics */}
      <NLPAnalyticsPanel />

      {/* NLP Training Mode - Gamified Learning */}
      <NLPTrainingMode />

      {/* NLP Conversion Metrics - Performance Dashboard */}
      <NLPConversionMetrics />

      {/* ===================== ADVANCED NLP PORTFOLIO SUITE ===================== */}

      {/* RAPPORT TECHNIQUES - Portfolio Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RapportRealtimeCoach />
        <MiltonianCalibration />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncongruenceDetector />
        <PerceptualPositions />
      </div>

      {/* DECISION STRATEGIES - Portfolio Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TOTEModelMapper />
        <HierarchyOfCriteria />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WellFormedOutcomeBuilder />
        <ChunkingNavigator />
      </div>

      {/* ANCHORS & STATES - Portfolio Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnchorTrackingSystem />
        <StateElicitationToolkit />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubmodalityModifier />
        <SwishPatternGenerator />
      </div>

      {/* ===================== END ADVANCED NLP PORTFOLIO SUITE ===================== */}
    </motion.div>
  );
};
