import { useState, useCallback } from 'react';
import { Contact, Interaction } from '@/types';
import { MBTIProfile, MBTIType, MBTIPreferences, MBTI_TYPES, MBTI_DICHOTOMIES, getMBTITypeFromPreferences } from '@/types/mbti';

interface UseMBTIAnalysisResult {
  profile: MBTIProfile | null;
  isAnalyzing: boolean;
  analyze: (interactions: Interaction[]) => void;
  clear: () => void;
  setManualType: (type: MBTIType) => void;
}

export function useMBTIAnalysis(contact: Contact): UseMBTIAnalysisResult {
  const [profile, setProfile] = useState<MBTIProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeText = useCallback((texts: string[]): MBTIPreferences => {
    const allText = texts.join(' ').toLowerCase();
    
    const prefs: MBTIPreferences = {
      EI: 0, // -100 I, +100 E
      SN: 0, // -100 S, +100 N
      TF: 0, // -100 T, +100 F
      JP: 0  // -100 J, +100 P
    };

    // E vs I
    const eCount = MBTI_DICHOTOMIES.EI.E.keywords.filter(k => allText.includes(k)).length;
    const iCount = MBTI_DICHOTOMIES.EI.I.keywords.filter(k => allText.includes(k)).length;
    prefs.EI = Math.min(100, Math.max(-100, (eCount - iCount) * 25));

    // S vs N
    const sCount = MBTI_DICHOTOMIES.SN.S.keywords.filter(k => allText.includes(k)).length;
    const nCount = MBTI_DICHOTOMIES.SN.N.keywords.filter(k => allText.includes(k)).length;
    prefs.SN = Math.min(100, Math.max(-100, (nCount - sCount) * 25));

    // T vs F
    const tCount = MBTI_DICHOTOMIES.TF.T.keywords.filter(k => allText.includes(k)).length;
    const fCount = MBTI_DICHOTOMIES.TF.F.keywords.filter(k => allText.includes(k)).length;
    prefs.TF = Math.min(100, Math.max(-100, (fCount - tCount) * 25));

    // J vs P
    const jCount = MBTI_DICHOTOMIES.JP.J.keywords.filter(k => allText.includes(k)).length;
    const pCount = MBTI_DICHOTOMIES.JP.P.keywords.filter(k => allText.includes(k)).length;
    prefs.JP = Math.min(100, Math.max(-100, (pCount - jCount) * 25));

    return prefs;
  }, []);

  const buildProfile = useCallback((type: MBTIType, preferences: MBTIPreferences, confidence: number): MBTIProfile => {
    const typeInfo = MBTI_TYPES[type];
    
    return {
      type,
      preferences,
      confidence,
      analyzedAt: new Date().toISOString(),
      cognitiveFunctions: typeInfo.cognitiveFunctions,
      description: typeInfo.description,
      strengths: typeInfo.strengths,
      weaknesses: typeInfo.weaknesses,
      communicationStyle: typeInfo.communicationStyle,
      salesApproach: typeInfo.salesTips
    };
  }, []);

  const analyze = useCallback((interactions: Interaction[]) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const texts = interactions
        .filter(i => i.content)
        .map(i => i.content || '');

      const preferences = analyzeText(texts);
      const type = getMBTITypeFromPreferences(preferences);
      const confidence = Math.min(95, 40 + (texts.length * 5));

      const newProfile = buildProfile(type, preferences, confidence);
      setProfile(newProfile);
      setIsAnalyzing(false);
    }, 500);
  }, [analyzeText, buildProfile]);

  const setManualType = useCallback((type: MBTIType) => {
    const preferences: MBTIPreferences = {
      EI: type[0] === 'E' ? 50 : -50,
      SN: type[1] === 'N' ? 50 : -50,
      TF: type[2] === 'F' ? 50 : -50,
      JP: type[3] === 'P' ? 50 : -50
    };

    const newProfile = buildProfile(type, preferences, 100);
    setProfile(newProfile);
  }, [buildProfile]);

  const clear = useCallback(() => {
    setProfile(null);
  }, []);

  return { profile, isAnalyzing, analyze, clear, setManualType };
}
