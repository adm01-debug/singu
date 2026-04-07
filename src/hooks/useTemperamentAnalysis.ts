import { useState, useCallback } from 'react';
import { Contact, Interaction } from '@/types';
import { TemperamentProfile, TemperamentType, TEMPERAMENT_TYPES } from '@/types/temperament';

interface UseTemperamentAnalysisResult {
  profile: TemperamentProfile | null;
  isAnalyzing: boolean;
  analyze: (interactions: Interaction[]) => void;
  clear: () => void;
  setManualType: (primary: TemperamentType, secondary?: TemperamentType) => void;
}

export function useTemperamentAnalysis(contact: Contact): UseTemperamentAnalysisResult {
  const [profile, setProfile] = useState<TemperamentProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = useCallback((texts: string[]): Record<TemperamentType, number> => {
    const allText = texts.join(' ').toLowerCase();
    
    const scores: Record<TemperamentType, number> = {
      sanguine: 0,
      choleric: 0,
      melancholic: 0,
      phlegmatic: 0
    };

    // Count keyword matches for each temperament
    (Object.entries(TEMPERAMENT_TYPES) as [TemperamentType, typeof TEMPERAMENT_TYPES.sanguine][]).forEach(([type, info]) => {
      const matchCount = info.keywords.filter(keyword => allText.includes(keyword)).length;
      scores[type] = matchCount * 15;
    });

    // Normalize scores to percentages
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    (Object.keys(scores) as TemperamentType[]).forEach(type => {
      scores[type] = Math.round((scores[type] / total) * 100);
    });

    // Ensure minimum variation
    if (Object.values(scores).every(s => s === 25)) {
      scores.sanguine = 30;
      scores.choleric = 25;
      scores.melancholic = 25;
      scores.phlegmatic = 20;
    }

    return scores;
  }, []);

  const buildProfile = useCallback((
    primary: TemperamentType,
    secondary: TemperamentType | null,
    scores: Record<TemperamentType, number>,
    confidence: number
  ): TemperamentProfile => {
    const primaryInfo = TEMPERAMENT_TYPES[primary];
    
    return {
      primary,
      secondary,
      scores,
      confidence,
      analyzedAt: new Date().toISOString(),
      description: primaryInfo.description,
      strengths: primaryInfo.strengths,
      weaknesses: primaryInfo.weaknesses,
      communicationStyle: primaryInfo.communicationStyle,
      salesApproach: primaryInfo.salesTips
    };
  }, []);

  const analyze = useCallback((interactions: Interaction[]) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const texts = interactions
        .filter(i => i.content)
        .map(i => i.content || '');

      const scores = analyzeText(texts);
      
      // Find primary and secondary temperaments
      const sorted = (Object.entries(scores) as [TemperamentType, number][])
        .sort(([, a], [, b]) => b - a);
      
      const primary = sorted[0][0];
      const secondary = sorted[1][1] > 20 ? sorted[1][0] : null;
      
      const confidence = Math.min(95, 40 + (texts.length * 5));

      const newProfile = buildProfile(primary, secondary, scores, confidence);
      setProfile(newProfile);
      setIsAnalyzing(false);
    }, 500);
  }, [analyzeText, buildProfile]);

  const setManualType = useCallback((primary: TemperamentType, secondary?: TemperamentType) => {
    const scores: Record<TemperamentType, number> = {
      sanguine: 15,
      choleric: 15,
      melancholic: 15,
      phlegmatic: 15
    };
    scores[primary] = 50;
    if (secondary) scores[secondary] = 35;

    const newProfile = buildProfile(primary, secondary || null, scores, 100);
    setProfile(newProfile);
  }, [buildProfile]);

  const clear = useCallback(() => {
    setProfile(null);
  }, []);

  return { profile, isAnalyzing, analyze, clear, setManualType };
}
