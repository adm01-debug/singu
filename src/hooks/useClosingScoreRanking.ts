import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO, subDays } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { getDISCProfile as getContactDISC } from '@/lib/contact-utils';

type Contact = Tables<'contacts'>;

export type ProbabilityFilter = 'all' | 'high' | 'medium' | 'low' | 'very_low';
export type PeriodFilter = '7d' | '30d' | '90d' | 'all';

interface ContactClosingScore {
  contact: Contact;
  score: number;
  probability: 'high' | 'medium' | 'low' | 'very_low';
  trend: 'up' | 'down' | 'stable';
  lastInteractionDays: number | null;
  interactionCount: number;
  topStrength: string;
  mainWeakness: string;
  nextAction: string;
}

interface RankingData {
  rankings: ContactClosingScore[];
  loading: boolean;
  refreshing: boolean;
  stats: {
    totalContacts: number;
    highProbability: number;
    mediumProbability: number;
    lowProbability: number;
    veryLowProbability: number;
    averageScore: number;
  };
  refresh: () => Promise<void>;
}

// Emotional state scoring
const EMOTIONAL_SCORES: Record<string, number> = {
  'entusiasmado': 100,
  'empolgado': 95,
  'interessado': 85,
  'positivo': 80,
  'curioso': 75,
  'neutro': 50,
  'cauteloso': 40,
  'hesitante': 35,
  'preocupado': 30,
  'cético': 25,
  'resistente': 20,
  'negativo': 15,
  'frustrado': 10
};

export function useClosingScoreRanking(
  probabilityFilter: ProbabilityFilter = 'all',
  periodFilter: PeriodFilter = 'all'
): RankingData {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<ContactClosingScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const calculateScoreForContact = async (
    contact: Contact,
    periodDays: number | null
  ): Promise<ContactClosingScore | null> => {
    try {
      // Build date filter
      const dateFilter = periodDays 
        ? subDays(new Date(), periodDays).toISOString()
        : null;

      // Fetch data for this contact
      const [
        interactionsResult,
        valuesResult,
        objectionsResult,
        emotionalResult
      ] = await Promise.all([
        supabase
          .from('interactions')
          .select('*')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('client_values')
          .select('*')
          .eq('contact_id', contact.id),
        supabase
          .from('hidden_objections')
          .select('*')
          .eq('contact_id', contact.id),
        supabase
          .from('emotional_states_history')
          .select('*')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const allInteractions = interactionsResult.data || [];
      const values = valuesResult.data || [];
      const objections = objectionsResult.data || [];
      const emotionalHistory = emotionalResult.data || [];

      // Filter interactions by period
      const interactions = dateFilter
        ? allInteractions.filter(i => i.created_at >= dateFilter)
        : allInteractions;

      // Calculate factors
      let totalScore = 0;
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // 1. Relationship Score (20%)
      const relationshipScore = contact.relationship_score || 50;
      totalScore += relationshipScore * 0.20;
      if (relationshipScore >= 70) strengths.push('Relacionamento forte');
      else if (relationshipScore < 40) weaknesses.push('Relacionamento fraco');

      // 2. Engagement (15%)
      const recentInteractions = allInteractions.filter(i => {
        const daysSince = differenceInDays(new Date(), parseISO(i.created_at));
        return daysSince <= 30;
      });
      const daysSinceLastContact = allInteractions.length > 0 
        ? differenceInDays(new Date(), parseISO(allInteractions[0].created_at))
        : null;

      let engagementScore = 0;
      if (recentInteractions.length >= 5 && (daysSinceLastContact || 999) <= 7) {
        engagementScore = 90;
        strengths.push('Alto engajamento');
      } else if (recentInteractions.length >= 3 && (daysSinceLastContact || 999) <= 14) {
        engagementScore = 70;
      } else if (recentInteractions.length >= 1 && (daysSinceLastContact || 999) <= 30) {
        engagementScore = 50;
      } else {
        engagementScore = 20;
        weaknesses.push('Engajamento baixo');
      }
      totalScore += engagementScore * 0.15;

      // 3. Sentiment (15%)
      const sentimentMap: Record<string, number> = {
        'positive': 85,
        'neutral': 50,
        'negative': 20
      };
      const sentimentScore = sentimentMap[contact.sentiment || 'neutral'] || 50;
      totalScore += sentimentScore * 0.15;
      if (sentimentScore >= 70) strengths.push('Sentimento positivo');
      else if (sentimentScore < 40) weaknesses.push('Sentimento negativo');

      // 4. Emotional State (15%)
      let emotionalScore = 50;
      if (emotionalHistory.length > 0) {
        const latestState = emotionalHistory[0].emotional_state?.toLowerCase() || '';
        emotionalScore = EMOTIONAL_SCORES[latestState] || 50;
      }
      totalScore += emotionalScore * 0.15;
      if (emotionalScore >= 70) strengths.push('Estado emocional favorável');

      // 5. Objections (15%)
      const unresolvedObjections = objections.filter(o => !o.resolved);
      let objectionScore = 80;
      if (unresolvedObjections.length > 0) {
        objectionScore = Math.max(20, 80 - (unresolvedObjections.length * 15));
        weaknesses.push(`${unresolvedObjections.length} objeção(ões) pendente(s)`);
      } else if (objections.length > 0) {
        strengths.push('Objeções resolvidas');
      }
      totalScore += objectionScore * 0.15;

      // 6. Values (10%)
      const importantValues = values.filter(v => (v.importance || 0) >= 7);
      const valuesScore = Math.min(100, 40 + (importantValues.length * 15));
      totalScore += valuesScore * 0.10;
      if (importantValues.length >= 3) strengths.push('Valores bem mapeados');

      // 7. DISC Profile (5%) - using type-safe utility
      const discProfile = getContactDISC(contact);
      const discScore = discProfile ? 70 : 50;
      totalScore += discScore * 0.05;

      // 8. VAK Profile (5%)
      const vakScore = 50; // Simplified for ranking
      totalScore += vakScore * 0.05;

      const overallScore = Math.round(totalScore);

      // Determine probability
      let probability: 'high' | 'medium' | 'low' | 'very_low';
      if (overallScore >= 75) probability = 'high';
      else if (overallScore >= 55) probability = 'medium';
      else if (overallScore >= 35) probability = 'low';
      else probability = 'very_low';

      // Determine trend (simplified)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (daysSinceLastContact !== null && daysSinceLastContact <= 7 && relationshipScore > 50) {
        trend = 'up';
      } else if (daysSinceLastContact !== null && daysSinceLastContact > 30) {
        trend = 'down';
      }

      // Determine next action
      let nextAction = 'Continuar nurturing';
      if (probability === 'high') {
        nextAction = 'Propor fechamento';
      } else if (unresolvedObjections.length > 0) {
        nextAction = 'Resolver objeções';
      } else if ((daysSinceLastContact || 999) > 14) {
        nextAction = 'Retomar contato';
      } else if (relationshipScore < 50) {
        nextAction = 'Fortalecer relacionamento';
      }

      return {
        contact,
        score: overallScore,
        probability,
        trend,
        lastInteractionDays: daysSinceLastContact,
        interactionCount: interactions.length,
        topStrength: strengths[0] || 'N/A',
        mainWeakness: weaknesses[0] || 'Nenhuma',
        nextAction
      };
    } catch (error) {
      console.error('Error calculating score for contact:', contact.id, error);
      return null;
    }
  };

  const loadRankings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all contacts
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('first_name');

      if (error) throw error;

      if (!contacts || contacts.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      // Calculate period days
      const periodDays = periodFilter === '7d' ? 7 
        : periodFilter === '30d' ? 30 
        : periodFilter === '90d' ? 90 
        : null;

      // Calculate scores for all contacts
      const scorePromises = contacts.map(contact => 
        calculateScoreForContact(contact, periodDays)
      );
      
      const scores = await Promise.all(scorePromises);
      
      // Filter out nulls and apply probability filter
      let filteredScores = scores.filter((s): s is ContactClosingScore => s !== null);
      
      if (probabilityFilter !== 'all') {
        filteredScores = filteredScores.filter(s => s.probability === probabilityFilter);
      }

      // Sort by score descending
      filteredScores.sort((a, b) => b.score - a.score);

      setRankings(filteredScores);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, probabilityFilter, periodFilter]);

  useEffect(() => {
    setLoading(true);
    loadRankings();
  }, [loadRankings]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadRankings();
  }, [loadRankings]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalContacts = rankings.length;
    const highProbability = rankings.filter(r => r.probability === 'high').length;
    const mediumProbability = rankings.filter(r => r.probability === 'medium').length;
    const lowProbability = rankings.filter(r => r.probability === 'low').length;
    const veryLowProbability = rankings.filter(r => r.probability === 'very_low').length;
    const averageScore = totalContacts > 0 
      ? Math.round(rankings.reduce((sum, r) => sum + r.score, 0) / totalContacts)
      : 0;

    return {
      totalContacts,
      highProbability,
      mediumProbability,
      lowProbability,
      veryLowProbability,
      averageScore
    };
  }, [rankings]);

  return {
    rankings,
    loading,
    refreshing,
    stats,
    refresh
  };
}
