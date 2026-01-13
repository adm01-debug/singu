import { useState, useCallback } from 'react';
import { Contact, Interaction } from '@/types';
import { 
  EnneagramProfile, 
  EnneagramType, 
  EnneagramHealthLevel,
  ENNEAGRAM_TYPES, 
  getEnneagramTriad 
} from '@/types/enneagram';

interface UseEnneagramAnalysisResult {
  profile: EnneagramProfile | null;
  isAnalyzing: boolean;
  analyze: (interactions: Interaction[]) => void;
  clear: () => void;
  setManualType: (type: EnneagramType, wing?: EnneagramType) => void;
}

export function useEnneagramAnalysis(contact: Contact): UseEnneagramAnalysisResult {
  const [profile, setProfile] = useState<EnneagramProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = useCallback((texts: string[]): { type: EnneagramType; scores: Record<EnneagramType, number> } => {
    const allText = texts.join(' ').toLowerCase();
    
    const scores: Record<EnneagramType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    };

    // Count keyword matches for each type
    (Object.entries(ENNEAGRAM_TYPES) as [string, typeof ENNEAGRAM_TYPES[1]][]).forEach(([typeStr, info]) => {
      const type = parseInt(typeStr) as EnneagramType;
      const matchCount = info.keywords.filter(keyword => allText.includes(keyword)).length;
      scores[type] = matchCount * 15;
    });

    // Find dominant type
    let maxScore = 0;
    let dominantType: EnneagramType = 9;
    (Object.entries(scores) as [string, number][]).forEach(([typeStr, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantType = parseInt(typeStr) as EnneagramType;
      }
    });

    return { type: dominantType, scores };
  }, []);

  const determineHealthLevel = useCallback((texts: string[]): EnneagramHealthLevel => {
    const allText = texts.join(' ').toLowerCase();
    
    const positiveWords = ['obrigado', 'ótimo', 'excelente', 'maravilhoso', 'feliz', 'animado', 'entusiasmado'];
    const negativeWords = ['frustrado', 'irritado', 'ansioso', 'preocupado', 'estressado', 'difícil', 'problema'];
    
    const positiveCount = positiveWords.filter(w => allText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => allText.includes(w)).length;
    
    if (positiveCount > negativeCount + 2) return 'healthy';
    if (negativeCount > positiveCount + 2) return 'unhealthy';
    return 'average';
  }, []);

  const buildProfile = useCallback((
    type: EnneagramType, 
    wing: EnneagramType | null, 
    healthLevel: EnneagramHealthLevel,
    confidence: number
  ): EnneagramProfile => {
    const typeInfo = ENNEAGRAM_TYPES[type];
    
    return {
      type,
      wing,
      healthLevel,
      confidence,
      analyzedAt: new Date().toISOString(),
      description: typeInfo.description,
      coreMotivation: typeInfo.coreMotivation,
      coreFear: typeInfo.coreFear,
      growthPath: `Quando saudável, move-se em direção ao Tipo ${typeInfo.growthDirection}: ${ENNEAGRAM_TYPES[typeInfo.growthDirection].nickname}`,
      stressPath: `Sob estresse, move-se em direção ao Tipo ${typeInfo.stressDirection}: ${ENNEAGRAM_TYPES[typeInfo.stressDirection].nickname}`,
      salesApproach: typeInfo.salesTips
    };
  }, []);

  const analyze = useCallback((interactions: Interaction[]) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const texts = interactions
        .filter(i => i.content)
        .map(i => i.content || '');

      const { type, scores } = analyzeText(texts);
      const healthLevel = determineHealthLevel(texts);
      
      // Determine wing based on adjacent type scores
      const wings = ENNEAGRAM_TYPES[type].wings;
      const wing = scores[wings[0]] >= scores[wings[1]] ? wings[0] : wings[1];
      
      const confidence = Math.min(95, 40 + (texts.length * 5));

      const newProfile = buildProfile(type, wing, healthLevel, confidence);
      setProfile(newProfile);
      setIsAnalyzing(false);
    }, 500);
  }, [analyzeText, determineHealthLevel, buildProfile]);

  const setManualType = useCallback((type: EnneagramType, wing?: EnneagramType) => {
    const validWing = wing && ENNEAGRAM_TYPES[type].wings.includes(wing) ? wing : null;
    const newProfile = buildProfile(type, validWing, 'average', 100);
    setProfile(newProfile);
  }, [buildProfile]);

  const clear = useCallback(() => {
    setProfile(null);
  }, []);

  return { profile, isAnalyzing, analyze, clear, setManualType };
}
