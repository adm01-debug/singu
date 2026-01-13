import { useState, useMemo, useCallback } from 'react';
import { Contact, Interaction } from '@/types';
import { BigFiveProfile, BigFiveScore, BigFiveTrait, BIG_FIVE_TRAITS, getBigFiveDescription } from '@/types/big-five';

interface UseBigFiveAnalysisResult {
  profile: BigFiveProfile | null;
  isAnalyzing: boolean;
  analyze: (interactions: Interaction[]) => void;
  clear: () => void;
}

export function useBigFiveAnalysis(contact: Contact): UseBigFiveAnalysisResult {
  const [profile, setProfile] = useState<BigFiveProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = useCallback((texts: string[]): BigFiveScore => {
    const allText = texts.join(' ').toLowerCase();
    
    const scores: BigFiveScore = {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50
    };

    // Analyze Openness
    const oHighCount = BIG_FIVE_TRAITS.O.highKeywords.filter(k => allText.includes(k)).length;
    const oLowCount = BIG_FIVE_TRAITS.O.lowKeywords.filter(k => allText.includes(k)).length;
    scores.openness = Math.min(100, Math.max(0, 50 + (oHighCount * 10) - (oLowCount * 10)));

    // Analyze Conscientiousness
    const cHighCount = BIG_FIVE_TRAITS.C.highKeywords.filter(k => allText.includes(k)).length;
    const cLowCount = BIG_FIVE_TRAITS.C.lowKeywords.filter(k => allText.includes(k)).length;
    scores.conscientiousness = Math.min(100, Math.max(0, 50 + (cHighCount * 10) - (cLowCount * 10)));

    // Analyze Extraversion
    const eHighCount = BIG_FIVE_TRAITS.E.highKeywords.filter(k => allText.includes(k)).length;
    const eLowCount = BIG_FIVE_TRAITS.E.lowKeywords.filter(k => allText.includes(k)).length;
    scores.extraversion = Math.min(100, Math.max(0, 50 + (eHighCount * 10) - (eLowCount * 10)));

    // Analyze Agreeableness
    const aHighCount = BIG_FIVE_TRAITS.A.highKeywords.filter(k => allText.includes(k)).length;
    const aLowCount = BIG_FIVE_TRAITS.A.lowKeywords.filter(k => allText.includes(k)).length;
    scores.agreeableness = Math.min(100, Math.max(0, 50 + (aHighCount * 10) - (aLowCount * 10)));

    // Analyze Neuroticism
    const nHighCount = BIG_FIVE_TRAITS.N.highKeywords.filter(k => allText.includes(k)).length;
    const nLowCount = BIG_FIVE_TRAITS.N.lowKeywords.filter(k => allText.includes(k)).length;
    scores.neuroticism = Math.min(100, Math.max(0, 50 + (nHighCount * 10) - (nLowCount * 10)));

    return scores;
  }, []);

  const analyze = useCallback((interactions: Interaction[]) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const texts = interactions
        .filter(i => i.content)
        .map(i => i.content || '');

      const scores = analyzeText(texts);

      const dominantTraits: BigFiveTrait[] = [];
      const lowTraits: BigFiveTrait[] = [];

      if (scores.openness >= 60) dominantTraits.push('O');
      else if (scores.openness <= 40) lowTraits.push('O');

      if (scores.conscientiousness >= 60) dominantTraits.push('C');
      else if (scores.conscientiousness <= 40) lowTraits.push('C');

      if (scores.extraversion >= 60) dominantTraits.push('E');
      else if (scores.extraversion <= 40) lowTraits.push('E');

      if (scores.agreeableness >= 60) dominantTraits.push('A');
      else if (scores.agreeableness <= 40) lowTraits.push('A');

      if (scores.neuroticism >= 60) dominantTraits.push('N');
      else if (scores.neuroticism <= 40) lowTraits.push('N');

      const workStyles: string[] = [];
      if (scores.conscientiousness >= 60) workStyles.push('organizado e metódico');
      if (scores.openness >= 60) workStyles.push('criativo e inovador');
      if (scores.extraversion >= 60) workStyles.push('colaborativo e comunicativo');
      if (scores.agreeableness >= 60) workStyles.push('cooperativo e harmonioso');

      const communicationTips: string[] = [];
      dominantTraits.forEach(trait => {
        communicationTips.push(...BIG_FIVE_TRAITS[trait].salesTipsHigh.slice(0, 2));
      });
      lowTraits.forEach(trait => {
        communicationTips.push(...BIG_FIVE_TRAITS[trait].salesTipsLow.slice(0, 2));
      });

      const potentialChallenges: string[] = [];
      if (scores.neuroticism >= 70) potentialChallenges.push('Pode precisar de mais garantias e suporte');
      if (scores.conscientiousness <= 30) potentialChallenges.push('Pode ter dificuldade com prazos rígidos');
      if (scores.agreeableness <= 30) potentialChallenges.push('Pode ser mais desafiador em negociações');
      if (scores.openness <= 30) potentialChallenges.push('Pode resistir a mudanças ou inovações');

      const newProfile: BigFiveProfile = {
        scores,
        dominantTraits,
        lowTraits,
        confidence: Math.min(95, 50 + (texts.length * 5)),
        analyzedAt: new Date().toISOString(),
        description: getBigFiveDescription(scores),
        workStyle: workStyles.join(', ') || 'equilibrado',
        communicationTips: [...new Set(communicationTips)],
        salesApproach: communicationTips.slice(0, 4),
        potentialChallenges
      };

      setProfile(newProfile);
      setIsAnalyzing(false);
    }, 500);
  }, [analyzeText]);

  const clear = useCallback(() => {
    setProfile(null);
  }, []);

  return { profile, isAnalyzing, analyze, clear };
}
