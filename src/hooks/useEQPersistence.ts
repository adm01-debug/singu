import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EQAnalysisResult, EQPillar } from '@/types/emotional-intelligence';
import { Json } from '@/integrations/supabase/types';

interface EQHistoryRecord {
  id: string;
  contactId: string;
  interactionId?: string;
  overallScore: number;
  overallLevel: string;
  confidence?: number;
  pillarScores: Record<EQPillar, number>;
  strengths: EQPillar[];
  areasForGrowth: EQPillar[];
  profileSummary?: string;
  analyzedAt: string;
  createdAt: string;
}

interface EQEvolutionData {
  history: EQHistoryRecord[];
  trend: 'improving' | 'stable' | 'declining';
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  pillarTrends: Record<EQPillar, 'improving' | 'stable' | 'declining'>;
}

// Helper to safely convert Json to Record type
const convertPillarScores = (json: Json | null): Record<EQPillar, number> => {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return {
      self_awareness: 0,
      self_regulation: 0,
      motivation: 0,
      empathy: 0,
      social_skills: 0
    };
  }
  return json as unknown as Record<EQPillar, number>;
};

export function useEQPersistence(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch EQ history for a contact
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['eq-history', contactId],
    queryFn: async (): Promise<EQHistoryRecord[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('eq_analysis_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('analyzed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        contactId: record.contact_id,
        interactionId: record.interaction_id || undefined,
        overallScore: record.overall_score,
        overallLevel: record.overall_level,
        confidence: record.confidence || undefined,
        pillarScores: convertPillarScores(record.pillar_scores),
        strengths: (record.strengths || []) as EQPillar[],
        areasForGrowth: (record.areas_for_growth || []) as EQPillar[],
        profileSummary: record.profile_summary || undefined,
        analyzedAt: record.analyzed_at,
        createdAt: record.created_at
      }));
    },
    enabled: !!user?.id && !!contactId
  });

  // Save EQ analysis result
  const saveAnalysisMutation = useMutation({
    mutationFn: async (analysis: EQAnalysisResult & { interactionId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const pillarScoresSimple: Record<string, number> = {};
      Object.entries(analysis.pillarScores).forEach(([key, value]) => {
        pillarScoresSimple[key] = value.score;
      });

      const { data, error } = await supabase
        .from('eq_analysis_history')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          interaction_id: analysis.interactionId || null,
          overall_score: Math.round(analysis.overallScore),
          overall_level: analysis.overallLevel,
          confidence: Math.round(analysis.confidence),
          pillar_scores: pillarScoresSimple as unknown as Json,
          indicators: analysis.indicators as unknown as Json,
          strengths: analysis.strengths,
          areas_for_growth: analysis.areasForGrowth,
          sales_implications: analysis.salesImplications as unknown as Json,
          communication_style: analysis.communicationStyle as unknown as Json,
          profile_summary: analysis.profileSummary
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eq-history', contactId] });
    }
  });

  // Calculate evolution data
  const getEvolutionData = (): EQEvolutionData | null => {
    if (!history || history.length === 0) return null;

    const scores = history.map(h => h.overallScore);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate overall trend (comparing last 3 vs previous 3)
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (history.length >= 6) {
      const recentAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const previousAvg = scores.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
      const diff = recentAvg - previousAvg;
      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
    } else if (history.length >= 2) {
      const diff = scores[0] - scores[scores.length - 1];
      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
    }

    // Calculate pillar trends
    const pillars: EQPillar[] = ['self_awareness', 'self_regulation', 'motivation', 'empathy', 'social_skills'];
    const pillarTrends = {} as Record<EQPillar, 'improving' | 'stable' | 'declining'>;

    pillars.forEach(pillar => {
      const pillarScores = history.map(h => h.pillarScores[pillar] || 0);
      if (pillarScores.length >= 2) {
        const diff = pillarScores[0] - pillarScores[pillarScores.length - 1];
        if (diff > 5) pillarTrends[pillar] = 'improving';
        else if (diff < -5) pillarTrends[pillar] = 'declining';
        else pillarTrends[pillar] = 'stable';
      } else {
        pillarTrends[pillar] = 'stable';
      }
    });

    return {
      history,
      trend,
      averageScore,
      highestScore,
      lowestScore,
      pillarTrends
    };
  };

  return {
    history: history || [],
    isLoading,
    error,
    saveAnalysis: saveAnalysisMutation.mutate,
    isSaving: saveAnalysisMutation.isPending,
    evolutionData: getEvolutionData()
  };
}
