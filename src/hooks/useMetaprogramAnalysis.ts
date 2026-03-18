import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import {
  MetaprogramScores,
  MetaprogramProfile,
  MetaprogramAnalysisResult,
  MotivationDirection,
  ReferenceFrame,
  WorkingStyle,
  ChunkSize,
  ActionFilter,
  ComparisonStyle,
  METAPROGRAM_KEYWORDS
} from '@/types/metaprograms';

// Pre-build lowercased keyword maps at module level (computed once)
type MetaprogramCategory = keyof typeof METAPROGRAM_KEYWORDS;
const LOWERED_KEYWORDS: Record<MetaprogramCategory, Array<{ lower: string; original: string }>> = (() => {
  const categories = Object.keys(METAPROGRAM_KEYWORDS) as MetaprogramCategory[];
  const result = {} as Record<MetaprogramCategory, Array<{ lower: string; original: string }>>;
  for (const category of categories) {
    result[category] = METAPROGRAM_KEYWORDS[category].map(kw => ({
      lower: kw.toLowerCase(),
      original: kw,
    }));
  }
  return result;
})();

const ALL_CATEGORIES: MetaprogramCategory[] = Object.keys(METAPROGRAM_KEYWORDS) as MetaprogramCategory[];

// Map category names to score keys for MetaprogramScores
const CATEGORY_TO_SCORE_KEY: Record<MetaprogramCategory, keyof MetaprogramScores> = {
  toward: 'toward',
  awayFrom: 'awayFrom',
  internal: 'internal',
  external: 'external',
  options: 'options',
  procedures: 'procedures',
  general: 'general',
  specific: 'specific',
  proactive: 'proactive',
  reactive: 'reactive',
  sameness: 'sameness',
  difference: 'difference',
};

export function useMetaprogramAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Analyze text for metaprogram patterns
  const analyzeText = useCallback((text: string): MetaprogramAnalysisResult => {
    const lowerText = text.toLowerCase();

    const scores: MetaprogramScores = {
      toward: 0, awayFrom: 0, internal: 0, external: 0,
      options: 0, procedures: 0, general: 0, specific: 0,
      proactive: 0, reactive: 0, sameness: 0, difference: 0,
    };

    const detectedWords: MetaprogramAnalysisResult['detectedWords'] = {
      toward: [], awayFrom: [], internal: [], external: [],
      options: [], procedures: [], general: [], specific: [],
      proactive: [], reactive: [], sameness: [], difference: [],
    };

    // Use pre-lowered keywords for all categories
    for (const category of ALL_CATEGORIES) {
      const scoreKey = CATEGORY_TO_SCORE_KEY[category];
      const detectedSet = new Set<string>();

      for (const { lower, original } of LOWERED_KEYWORDS[category]) {
        if (lowerText.includes(lower)) {
          scores[scoreKey]++;
          detectedSet.add(original);
        }
      }

      detectedWords[category] = Array.from(detectedSet);
    }

    return { scores, detectedWords };
  }, []);

  // Save analysis to database
  const saveAnalysis = useCallback(async (
    contactId: string,
    interactionId: string | null,
    analysisResult: MetaprogramAnalysisResult,
    analyzedText: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('metaprogram_analysis')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: interactionId,
          toward_score: analysisResult.scores.toward,
          away_from_score: analysisResult.scores.awayFrom,
          toward_words: analysisResult.detectedWords.toward,
          away_from_words: analysisResult.detectedWords.awayFrom,
          internal_score: analysisResult.scores.internal,
          external_score: analysisResult.scores.external,
          internal_words: analysisResult.detectedWords.internal,
          external_words: analysisResult.detectedWords.external,
          options_score: analysisResult.scores.options,
          procedures_score: analysisResult.scores.procedures,
          options_words: analysisResult.detectedWords.options,
          procedures_words: analysisResult.detectedWords.procedures,
          analyzed_text: analyzedText.substring(0, 1000)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error saving metaprogram analysis:', error);
      return null;
    }
  }, [user]);

  // Get aggregated profile for a contact
  const getContactMetaprogramProfile = useCallback(async (
    contactId: string
  ): Promise<MetaprogramProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('metaprogram_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        return null;
      }

      // Aggregate scores (note: new metaprograms not in DB yet, use 0)
      interface MetaprogramRecord {
        toward_score?: number;
        away_from_score?: number;
        internal_score?: number;
        external_score?: number;
        options_score?: number;
        procedures_score?: number;
        general_score?: number;
        specific_score?: number;
        proactive_score?: number;
        reactive_score?: number;
        sameness_score?: number;
        difference_score?: number;
      }
      const totals = data.reduce((acc, record: MetaprogramRecord) => ({
        toward: acc.toward + (record.toward_score || 0),
        awayFrom: acc.awayFrom + (record.away_from_score || 0),
        internal: acc.internal + (record.internal_score || 0),
        external: acc.external + (record.external_score || 0),
        options: acc.options + (record.options_score || 0),
        procedures: acc.procedures + (record.procedures_score || 0),
        general: acc.general + (record.general_score || 0),
        specific: acc.specific + (record.specific_score || 0),
        proactive: acc.proactive + (record.proactive_score || 0),
        reactive: acc.reactive + (record.reactive_score || 0),
        sameness: acc.sameness + (record.sameness_score || 0),
        difference: acc.difference + (record.difference_score || 0)
      }), { 
        toward: 0, awayFrom: 0, internal: 0, external: 0, 
        options: 0, procedures: 0, general: 0, specific: 0,
        proactive: 0, reactive: 0, sameness: 0, difference: 0 
      });

      // Determine direction and confidence for each metaprogram
      const getDirectionAndConfidence = (score1: number, score2: number): { direction: 'first' | 'second' | 'balanced', confidence: number } => {
        const total = score1 + score2;
        if (total === 0) return { direction: 'balanced', confidence: 0 };
        
        const ratio = Math.abs(score1 - score2) / total;
        const confidence = Math.round(ratio * 100);
        
        if (ratio < 0.2) {
          return { direction: 'balanced', confidence: 50 };
        }
        
        return {
          direction: score1 > score2 ? 'first' : 'second',
          confidence: Math.min(95, 50 + confidence)
        };
      };

      const motivation = getDirectionAndConfidence(totals.toward, totals.awayFrom);
      const reference = getDirectionAndConfidence(totals.internal, totals.external);
      const working = getDirectionAndConfidence(totals.options, totals.procedures);
      const chunk = getDirectionAndConfidence(totals.general, totals.specific);
      const action = getDirectionAndConfidence(totals.proactive, totals.reactive);
      const comparison = getDirectionAndConfidence(totals.sameness, totals.difference);

      const motivationDirection: MotivationDirection = 
        motivation.direction === 'first' ? 'toward' :
        motivation.direction === 'second' ? 'away_from' : 'balanced';

      const referenceFrame: ReferenceFrame =
        reference.direction === 'first' ? 'internal' :
        reference.direction === 'second' ? 'external' : 'balanced';

      const workingStyle: WorkingStyle =
        working.direction === 'first' ? 'options' :
        working.direction === 'second' ? 'procedures' : 'balanced';

      const chunkSize: ChunkSize =
        chunk.direction === 'first' ? 'general' :
        chunk.direction === 'second' ? 'specific' : 'balanced';

      const actionFilter: ActionFilter =
        action.direction === 'first' ? 'proactive' :
        action.direction === 'second' ? 'reactive' : 'balanced';

      const comparisonStyle: ComparisonStyle =
        comparison.direction === 'first' ? 'sameness' :
        comparison.direction === 'second' ? 'difference' : 'balanced';

      const overallConfidence = Math.round(
        (motivation.confidence + reference.confidence + working.confidence + 
         chunk.confidence + action.confidence + comparison.confidence) / 6
      );

      return {
        motivationDirection,
        motivationConfidence: motivation.confidence,
        referenceFrame,
        referenceConfidence: reference.confidence,
        workingStyle,
        workingConfidence: working.confidence,
        chunkSize,
        chunkConfidence: chunk.confidence,
        actionFilter,
        actionConfidence: action.confidence,
        comparisonStyle,
        comparisonConfidence: comparison.confidence,
        overallConfidence,
        analyzedInteractions: data.length
      };
    } catch (error) {
      logger.error('Error getting metaprogram profile:', error);
      return null;
    }
  }, [user]);

  // Analyze all interactions for a contact
  const analyzeContactInteractions = useCallback(async (
    contactId: string,
    interactions: Array<{ id: string; content: string; transcription?: string }>
  ) => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      let analyzedCount = 0;
      
      for (const interaction of interactions) {
        const textToAnalyze = interaction.transcription || interaction.content;
        if (!textToAnalyze || textToAnalyze.length < 20) continue;
        
        const result = analyzeText(textToAnalyze);
        
        // Only save if we found some patterns
        const totalScore = Object.values(result.scores).reduce((a, b) => a + b, 0);
        if (totalScore > 0) {
          await saveAnalysis(contactId, interaction.id, result, textToAnalyze);
          analyzedCount++;
        }
      }

      toast({
        title: "Análise concluída",
        description: `${analyzedCount} interações analisadas para metaprogramas`
      });
    } catch (error) {
      logger.error('Error analyzing interactions:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar as interações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, analyzeText, saveAnalysis]);

  // Clear analysis for a contact
  const clearContactAnalysis = useCallback(async (contactId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('metaprogram_analysis')
        .delete()
        .eq('contact_id', contactId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Análise limpa",
        description: "Histórico de metaprogramas removido"
      });
    } catch (error) {
      logger.error('Error clearing analysis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar a análise",
        variant: "destructive"
      });
    }
  }, [user]);

  return {
    loading,
    analyzeText,
    saveAnalysis,
    getContactMetaprogramProfile,
    analyzeContactInteractions,
    clearContactAnalysis
  };
}
