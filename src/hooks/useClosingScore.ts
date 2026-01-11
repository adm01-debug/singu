import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, parseISO } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

interface ScoreFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
}

export interface ClosingScoreResult {
  overallScore: number;
  probability: 'high' | 'medium' | 'low' | 'very_low';
  factors: ScoreFactor[];
  strengths: string[];
  weaknesses: string[];
  nextBestAction: string;
  optimalClosingWindow: string;
  riskFactors: string[];
  confidenceLevel: number;
}

interface ClosingScoreData {
  score: ClosingScoreResult | null;
  loading: boolean;
  analyzing: boolean;
  recalculate: () => Promise<void>;
}

// Hook to track score changes across contacts
interface ScoreTracker {
  contactId: string;
  lastProbability: 'high' | 'medium' | 'low' | 'very_low' | null;
  lastScore: number | null;
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

// VAK communication alignment scoring
const VAK_ALIGNMENT_BONUS = 15;

// DISC profile conversion factors
const DISC_CLOSING_FACTORS: Record<string, { speed: number; style: string }> = {
  'D': { speed: 0.9, style: 'Direto e rápido - pode fechar em menos interações' },
  'I': { speed: 0.7, style: 'Entusiasmado - valoriza relacionamento, pode decidir por impulso' },
  'S': { speed: 0.5, style: 'Cauteloso - precisa de mais tempo e segurança' },
  'C': { speed: 0.4, style: 'Analítico - requer dados e garantias detalhadas' }
};

export function useClosingScore(contactId: string, contactName?: string): ClosingScoreData {
  const { user } = useAuth();
  const [score, setScore] = useState<ClosingScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const hasCheckedAlert = useRef(false);
  const calculateScore = useCallback(async () => {
    if (!user || !contactId) {
      setLoading(false);
      return;
    }

    setAnalyzing(true);

    try {
      // Fetch all required data in parallel
      const [
        contactResult,
        interactionsResult,
        valuesResult,
        objectionsResult,
        emotionalResult,
        vakResult
      ] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', contactId).single(),
        supabase.from('interactions').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('client_values').select('*').eq('contact_id', contactId),
        supabase.from('hidden_objections').select('*').eq('contact_id', contactId),
        supabase.from('emotional_states_history').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }),
        supabase.from('vak_analysis_history').select('*').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(1)
      ]);

      const contact = contactResult.data;
      const interactions = interactionsResult.data || [];
      const values = valuesResult.data || [];
      const objections = objectionsResult.data || [];
      const emotionalHistory = emotionalResult.data || [];
      const vakAnalysis = vakResult.data?.[0];

      if (!contact) {
        setLoading(false);
        setAnalyzing(false);
        return;
      }

      const factors: ScoreFactor[] = [];
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const riskFactors: string[] = [];

      // 1. RELATIONSHIP SCORE (Weight: 20%)
      const relationshipScore = contact.relationship_score || 50;
      const relationshipFactor: ScoreFactor = {
        name: 'Score de Relacionamento',
        score: relationshipScore,
        weight: 0.20,
        description: `Nível atual de relacionamento: ${relationshipScore}%`,
        trend: relationshipScore >= 70 ? 'up' : relationshipScore >= 40 ? 'stable' : 'down',
        recommendation: relationshipScore < 50 ? 'Investir mais em rapport antes de tentar fechar' : undefined
      };
      factors.push(relationshipFactor);
      
      if (relationshipScore >= 70) {
        strengths.push('Relacionamento forte estabelecido');
      } else if (relationshipScore < 40) {
        weaknesses.push('Relacionamento precisa ser fortalecido');
        riskFactors.push('Baixo score de relacionamento');
      }

      // 2. INTERACTION FREQUENCY & RECENCY (Weight: 15%)
      const recentInteractions = interactions.filter(i => {
        const daysSince = differenceInDays(new Date(), parseISO(i.created_at));
        return daysSince <= 30;
      });
      
      const daysSinceLastContact = interactions.length > 0 
        ? differenceInDays(new Date(), parseISO(interactions[0].created_at))
        : 999;

      let engagementScore = 0;
      if (recentInteractions.length >= 5 && daysSinceLastContact <= 7) {
        engagementScore = 90;
      } else if (recentInteractions.length >= 3 && daysSinceLastContact <= 14) {
        engagementScore = 70;
      } else if (recentInteractions.length >= 1 && daysSinceLastContact <= 30) {
        engagementScore = 50;
      } else {
        engagementScore = 20;
      }

      const engagementFactor: ScoreFactor = {
        name: 'Engajamento',
        score: engagementScore,
        weight: 0.15,
        description: `${recentInteractions.length} interações nos últimos 30 dias`,
        trend: daysSinceLastContact <= 7 ? 'up' : daysSinceLastContact <= 14 ? 'stable' : 'down',
        recommendation: daysSinceLastContact > 14 ? 'Retomar contato antes de tentar fechar' : undefined
      };
      factors.push(engagementFactor);

      if (engagementScore >= 70) {
        strengths.push('Alto engajamento recente');
      } else if (engagementScore < 40) {
        weaknesses.push('Engajamento baixo - cliente esfriando');
        riskFactors.push('Muito tempo sem contato');
      }

      // 3. SENTIMENT ANALYSIS (Weight: 15%)
      const sentimentMap: Record<string, number> = {
        'positive': 85,
        'neutral': 50,
        'negative': 20
      };
      const sentimentScore = sentimentMap[contact.sentiment || 'neutral'] || 50;

      const sentimentFactor: ScoreFactor = {
        name: 'Sentimento',
        score: sentimentScore,
        weight: 0.15,
        description: `Sentimento atual: ${contact.sentiment || 'neutro'}`,
        trend: contact.sentiment === 'positive' ? 'up' : contact.sentiment === 'negative' ? 'down' : 'stable'
      };
      factors.push(sentimentFactor);

      if (sentimentScore >= 70) {
        strengths.push('Sentimento positivo do cliente');
      } else if (sentimentScore < 40) {
        weaknesses.push('Sentimento negativo precisa ser revertido');
        riskFactors.push('Cliente com percepção negativa');
      }

      // 4. EMOTIONAL STATE TREND (Weight: 15%)
      let emotionalScore = 50;
      let emotionalTrend: 'up' | 'down' | 'stable' = 'stable';
      
      if (emotionalHistory.length > 0) {
        const recentStates = emotionalHistory.slice(0, 5);
        const avgConfidence = recentStates.reduce((sum, s) => sum + (s.confidence || 50), 0) / recentStates.length;
        
        // Check if improving
        if (emotionalHistory.length >= 2) {
          const recent = emotionalHistory[0].confidence || 50;
          const older = emotionalHistory[Math.min(4, emotionalHistory.length - 1)].confidence || 50;
          emotionalTrend = recent > older ? 'up' : recent < older ? 'down' : 'stable';
        }

        const latestState = emotionalHistory[0].emotional_state?.toLowerCase() || '';
        emotionalScore = EMOTIONAL_SCORES[latestState] || avgConfidence;
      }

      const emotionalFactor: ScoreFactor = {
        name: 'Estado Emocional',
        score: emotionalScore,
        weight: 0.15,
        description: emotionalHistory.length > 0 
          ? `Estado: ${emotionalHistory[0].emotional_state}` 
          : 'Sem dados emocionais',
        trend: emotionalTrend,
        recommendation: emotionalScore < 50 ? 'Trabalhar âncoras emocionais positivas' : undefined
      };
      factors.push(emotionalFactor);

      if (emotionalScore >= 70) {
        strengths.push('Cliente em estado emocional favorável');
      } else if (emotionalScore < 40) {
        riskFactors.push('Estado emocional desfavorável');
      }

      // 5. OBJECTIONS ANALYSIS (Weight: 15%)
      const unresolvedObjections = objections.filter(o => !o.resolved);
      const totalObjections = objections.length;
      const resolvedObjections = totalObjections - unresolvedObjections.length;
      
      let objectionScore = 80;
      if (unresolvedObjections.length > 0) {
        objectionScore = Math.max(20, 80 - (unresolvedObjections.length * 15));
      }

      const objectionFactor: ScoreFactor = {
        name: 'Objeções',
        score: objectionScore,
        weight: 0.15,
        description: unresolvedObjections.length === 0 
          ? 'Nenhuma objeção pendente' 
          : `${unresolvedObjections.length} objeção(ões) não resolvida(s)`,
        trend: unresolvedObjections.length === 0 ? 'up' : 'down',
        recommendation: unresolvedObjections.length > 0 
          ? `Resolver: ${unresolvedObjections.map(o => o.objection_type).join(', ')}` 
          : undefined
      };
      factors.push(objectionFactor);

      if (unresolvedObjections.length === 0 && resolvedObjections > 0) {
        strengths.push('Todas as objeções foram resolvidas');
      } else if (unresolvedObjections.length > 2) {
        weaknesses.push('Múltiplas objeções não resolvidas');
        riskFactors.push('Objeções bloqueando o fechamento');
      }

      // 6. VALUES ALIGNMENT (Weight: 10%)
      const importantValues = values.filter(v => (v.importance || 0) >= 7);
      const valuesScore = Math.min(100, 40 + (importantValues.length * 15));

      const valuesFactor: ScoreFactor = {
        name: 'Valores Identificados',
        score: valuesScore,
        weight: 0.10,
        description: `${importantValues.length} valores importantes mapeados`,
        trend: importantValues.length >= 3 ? 'up' : 'stable'
      };
      factors.push(valuesFactor);

      if (importantValues.length >= 3) {
        strengths.push('Valores do cliente bem mapeados');
      } else if (importantValues.length === 0) {
        weaknesses.push('Valores do cliente não identificados');
      }

      // 7. COMMUNICATION ALIGNMENT (VAK) (Weight: 5%)
      let communicationScore = 50;
      if (vakAnalysis) {
        const scores = {
          visual: vakAnalysis.visual_score || 0,
          auditory: vakAnalysis.auditory_score || 0,
          kinesthetic: vakAnalysis.kinesthetic_score || 0,
          digital: vakAnalysis.digital_score || 0
        };
        const maxScore = Math.max(...Object.values(scores));
        communicationScore = maxScore > 0 ? 70 + (maxScore > 50 ? VAK_ALIGNMENT_BONUS : 0) : 50;
      }

      const communicationFactor: ScoreFactor = {
        name: 'Perfil de Comunicação',
        score: communicationScore,
        weight: 0.05,
        description: vakAnalysis ? 'Perfil VAK identificado' : 'Perfil VAK não mapeado',
        trend: vakAnalysis ? 'up' : 'stable'
      };
      factors.push(communicationFactor);

      // 8. DISC PROFILE (Weight: 5%)
      const behavior = contact.behavior as any;
      const discProfile = behavior?.disc || null;
      const discFactor = DISC_CLOSING_FACTORS[discProfile] || { speed: 0.5, style: 'Perfil não identificado' };
      const discScore = discProfile ? 60 + (discFactor.speed * 40) : 50;

      const discScoreFactor: ScoreFactor = {
        name: 'Perfil Comportamental',
        score: discScore,
        weight: 0.05,
        description: discProfile ? `DISC: ${discProfile} - ${discFactor.style}` : 'DISC não identificado',
        trend: discProfile ? 'stable' : 'down'
      };
      factors.push(discScoreFactor);

      // Calculate overall weighted score
      const overallScore = Math.round(
        factors.reduce((sum, f) => sum + (f.score * f.weight), 0)
      );

      // Determine probability tier
      let probability: 'high' | 'medium' | 'low' | 'very_low';
      if (overallScore >= 75) {
        probability = 'high';
      } else if (overallScore >= 55) {
        probability = 'medium';
      } else if (overallScore >= 35) {
        probability = 'low';
      } else {
        probability = 'very_low';
      }

      // Determine next best action
      let nextBestAction = '';
      const lowestFactor = factors.reduce((min, f) => f.score < min.score ? f : min, factors[0]);
      
      if (probability === 'high') {
        nextBestAction = 'Momento ideal para apresentar proposta de fechamento';
      } else if (lowestFactor.name === 'Objeções' && unresolvedObjections.length > 0) {
        nextBestAction = `Resolver objeção: ${unresolvedObjections[0].objection_type}`;
      } else if (lowestFactor.name === 'Engajamento') {
        nextBestAction = 'Agendar reunião ou ligação para reaquecer o relacionamento';
      } else if (lowestFactor.name === 'Estado Emocional') {
        nextBestAction = 'Usar técnicas de rapport para melhorar o estado emocional';
      } else if (lowestFactor.name === 'Valores Identificados') {
        nextBestAction = 'Fazer mais perguntas para identificar valores do cliente';
      } else {
        nextBestAction = lowestFactor.recommendation || 'Continuar nurturing do relacionamento';
      }

      // Determine optimal closing window
      let optimalClosingWindow = '';
      if (probability === 'high') {
        optimalClosingWindow = 'Agora - próximas 48 horas';
      } else if (probability === 'medium') {
        optimalClosingWindow = '1-2 semanas após resolver pontos fracos';
      } else if (probability === 'low') {
        optimalClosingWindow = '3-4 semanas de nurturing recomendado';
      } else {
        optimalClosingWindow = 'Prematuro - focar em construir relacionamento';
      }

      // Calculate confidence level based on data quality
      const dataPoints = [
        interactions.length > 0,
        emotionalHistory.length > 0,
        values.length > 0,
        vakAnalysis !== null,
        discProfile !== null
      ].filter(Boolean).length;
      const confidenceLevel = Math.round((dataPoints / 5) * 100);

      const result: ClosingScoreResult = {
        overallScore,
        probability,
        factors,
        strengths,
        weaknesses,
        nextBestAction,
        optimalClosingWindow,
        riskFactors,
        confidenceLevel
      };

      setScore(result);

      // Check for significant score changes and create alerts
      if (!hasCheckedAlert.current && contactName) {
        hasCheckedAlert.current = true;
        checkAndCreateAlert(
          contactId, 
          contactName || `${contact.first_name} ${contact.last_name}`,
          overallScore,
          probability
        );
      }
    } catch (error) {
      console.error('Error calculating closing score:', error);
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  }, [user, contactId, contactName]);

  // Function to check and create alerts for score changes
  const checkAndCreateAlert = async (
    cId: string, 
    cName: string, 
    currentScore: number, 
    currentProbability: 'high' | 'medium' | 'low' | 'very_low'
  ) => {
    if (!user) return;

    try {
      // Get the last stored score from alerts
      const { data: lastAlerts } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', cId)
        .eq('type', 'closing_score_change')
        .order('created_at', { ascending: false })
        .limit(1);

      let previousProbability: string | null = null;
      let previousScore: number | null = null;

      if (lastAlerts && lastAlerts.length > 0) {
        const parts = (lastAlerts[0].description || '').split('|');
        previousProbability = parts[2] || null;
        previousScore = parts[4] ? parseInt(parts[4]) : null;
      }

      // Check for significant changes
      let changeType: 'improved_to_high' | 'dropped_to_very_low' | null = null;

      // Improved to high (from any other state)
      if (currentProbability === 'high' && previousProbability !== 'high') {
        changeType = 'improved_to_high';
      }
      // Dropped to very low (from any other state)
      else if (currentProbability === 'very_low' && previousProbability !== 'very_low' && previousProbability !== null) {
        changeType = 'dropped_to_very_low';
      }

      if (changeType) {
        const title = changeType === 'improved_to_high'
          ? `🎯 ${cName}: Score de Fechamento em ALTA!`
          : `⚠️ ${cName}: Score de Fechamento caiu para MUITO BAIXA`;

        const priority = changeType === 'improved_to_high' ? 'high' : 'critical';
        const description = `${cName}|${previousProbability || ''}|${currentProbability}|${previousScore || ''}|${currentScore}|${changeType}`;

        await supabase
          .from('alerts')
          .insert({
            user_id: user.id,
            contact_id: cId,
            type: 'closing_score_change',
            title,
            description,
            priority,
            action_url: `/contatos/${cId}`,
            dismissed: false
          });
      }
    } catch (error) {
      console.error('Error checking score alert:', error);
    }
  };
  useEffect(() => {
    calculateScore();
  }, [calculateScore]);

  return {
    score,
    loading,
    analyzing,
    recalculate: calculateScore
  };
}
