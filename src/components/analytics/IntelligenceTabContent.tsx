import React from 'react';
import { motion } from 'framer-motion';
import { ChurnPredictionPanel } from '@/components/analytics/ChurnPredictionPanel';
import { BestTimeToContactPanel } from '@/components/analytics/BestTimeToContactPanel';
import { DealVelocityPanel } from '@/components/analytics/DealVelocityPanel';
import { ClosingScoreRanking } from '@/components/analytics/ClosingScoreRanking';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';

export const IntelligenceTabContent = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Closing Score Ranking - New */}
      <ClosingScoreRanking showStats maxItems={10} />

      {/* Churn Prediction - By Contact */}
      <ChurnPredictionPanel maxItems={10} />

      {/* Account-Level Churn Prediction - Based on Stakeholder Analysis */}
      <AccountChurnPredictionPanel />

      {/* Best Time + Deal Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BestTimeToContactPanel />
        <DealVelocityPanel />
      </div>
    </motion.div>
  );
};
