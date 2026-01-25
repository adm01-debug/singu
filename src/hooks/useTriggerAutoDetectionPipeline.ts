// ==============================================
// TRIGGER AUTO DETECTION PIPELINE
// Integrates trigger detection into interaction flow
// ==============================================

import { useCallback } from 'react';
import { useTriggerAutoDetection } from './useTriggerAutoDetection';

interface TriggerDetectionInput {
  contactId: string;
  interactionId: string;
  text: string;
}

export function useTriggerAutoDetectionPipeline() {
  const { detectTriggers, getEffectivenessScore, getRecommendations } = useTriggerAutoDetection();

  // Analyze triggers in text (no persistence for now)
  const analyzeText = useCallback(({
    text
  }: Pick<TriggerDetectionInput, 'text'>) => {
    if (!text || text.length < 50) return null;

    const analysis = detectTriggers(text);
    const score = getEffectivenessScore(analysis);
    const recommendations = getRecommendations(analysis);

    console.log('✅ Trigger detection complete:', {
      triggers: analysis.detectedTriggers.length,
      score,
      effectiveness: analysis.effectiveness
    });

    return {
      ...analysis,
      score,
      recommendations
    };
  }, [detectTriggers, getEffectivenessScore, getRecommendations]);

  return {
    analyzeText,
    detectTriggers,
    getEffectivenessScore,
    getRecommendations
  };
}
