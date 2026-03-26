import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { differenceInDays } from 'date-fns';
import type { TablesInsert } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import {
  RFMAnalysis,
  RFMHistory,
  RFMSegment,
  RFMScore,
  RFMDashboardStats,
  RFMContactSummary,
  RFMAction,
  RFMOffer,
  RFMTrend,
  CommunicationPriority,
  RFM_SEGMENTS,
  determineRFMSegment,
  calculateRFMScore
} from '@/types/rfm';

interface PurchaseData {
  contactId: string;
  totalPurchases: number;
  totalValue: number;
  lastPurchaseDate: Date | null;
  averageOrderValue: number;
}

export function useRFMAnalysis(contactId?: string) {
  const { user } = useAuth();
  const { contacts } = useContacts();
  const { interactions } = useInteractions();
  
  const [rfmData, setRfmData] = useState<RFMAnalysis[]>([]);
  const [history, setHistory] = useState<RFMHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch existing RFM data
  const fetchRFMData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('rfm_analysis')
        .select('id, user_id, contact_id, recency_score, frequency_score, monetary_score, rfm_score, total_score, days_since_last_purchase, days_since_last_interaction, total_purchases, total_interactions, total_monetary_value, average_order_value, segment, segment_description, segment_color, recency_trend, frequency_trend, monetary_trend, overall_trend, predicted_next_purchase_date, predicted_lifetime_value, churn_probability, recommended_actions, recommended_offers, communication_priority, analyzed_at, created_at, updated_at')
        .eq('user_id', user.id);
      
      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const mapped: RFMAnalysis[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        contactId: item.contact_id,
        recencyScore: item.recency_score as RFMScore,
        frequencyScore: item.frequency_score as RFMScore,
        monetaryScore: item.monetary_score as RFMScore,
        rfmScore: item.rfm_score,
        totalScore: item.total_score,
        daysSinceLastPurchase: item.days_since_last_purchase,
        daysSinceLastInteraction: item.days_since_last_interaction,
        totalPurchases: item.total_purchases || 0,
        totalInteractions: item.total_interactions || 0,
        totalMonetaryValue: Number(item.total_monetary_value) || 0,
        averageOrderValue: Number(item.average_order_value) || 0,
        segment: item.segment as RFMSegment,
        segmentDescription: item.segment_description || '',
        segmentColor: item.segment_color || '',
        recencyTrend: item.recency_trend as RFMTrend | null,
        frequencyTrend: item.frequency_trend as RFMTrend | null,
        monetaryTrend: item.monetary_trend as RFMTrend | null,
        overallTrend: item.overall_trend as RFMTrend | null,
        predictedNextPurchaseDate: item.predicted_next_purchase_date ? new Date(item.predicted_next_purchase_date) : null,
        predictedLifetimeValue: item.predicted_lifetime_value ? Number(item.predicted_lifetime_value) : null,
        churnProbability: item.churn_probability ? Number(item.churn_probability) : null,
        recommendedActions: (item.recommended_actions as unknown as RFMAction[]) || [],
        recommendedOffers: (item.recommended_offers as unknown as RFMOffer[]) || [],
        communicationPriority: item.communication_priority as CommunicationPriority || 'medium',
        analyzedAt: new Date(item.analyzed_at),
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
      
      setRfmData(mapped);
    } catch (error) {
      logger.error('Error fetching RFM data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, contactId]);

  // Fetch RFM history
  const fetchHistory = useCallback(async () => {
    if (!user?.id || !contactId) return;
    
    try {
      const { data, error } = await supabase
        .from('rfm_history')
        .select('id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value, recorded_at')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .order('recorded_at', { ascending: false })
        .limit(12);
      
      if (error) throw error;
      
      const mapped: RFMHistory[] = (data || []).map(item => ({
        id: item.id,
        contactId: item.contact_id,
        recencyScore: item.recency_score as RFMScore,
        frequencyScore: item.frequency_score as RFMScore,
        monetaryScore: item.monetary_score as RFMScore,
        segment: item.segment as RFMSegment,
        totalMonetaryValue: item.total_monetary_value ? Number(item.total_monetary_value) : null,
        recordedAt: new Date(item.recorded_at)
      }));
      
      setHistory(mapped);
    } catch (error) {
      logger.error('Error fetching RFM history:', error);
    }
  }, [user?.id, contactId]);

  // Analyze all contacts and calculate RFM scores
  const runAnalysis = useCallback(async () => {
    if (!user?.id || contacts.length === 0) return;
    
    setAnalyzing(true);
    try {
      // Get purchase history for all contacts (with field projection)
      const { data: purchaseData } = await supabase
        .from('purchase_history')
        .select('id, contact_id, amount, purchase_date')
        .eq('user_id', user.id);

      // Pre-index interactions by contact_id using Map for O(1) lookup
      const interactionsByContact = new Map<string, typeof interactions>();
      interactions.forEach(i => {
        const list = interactionsByContact.get(i.contact_id ?? '') || [];
        list.push(i);
        interactionsByContact.set(i.contact_id ?? '', list);
      });

      // Calculate metrics per contact
      const contactMetrics: Map<string, PurchaseData> = new Map();

      // Initialize with interaction data (O(1) lookup per contact)
      contacts.forEach(contact => {
        const contactInteractions = interactionsByContact.get(contact.id) || [];
        const lastInteraction = contactInteractions.length > 0
          ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime())))
          : null;

        contactMetrics.set(contact.id, {
          contactId: contact.id,
          totalPurchases: 0,
          totalValue: 0,
          lastPurchaseDate: lastInteraction,
          averageOrderValue: 0
        });
      });
      
      // Add purchase data
      (purchaseData || []).forEach(purchase => {
        const existing = contactMetrics.get(purchase.contact_id);
        if (existing) {
          existing.totalPurchases++;
          existing.totalValue += Number(purchase.amount) || 0;
          const purchaseDate = new Date(purchase.purchase_date);
          if (!existing.lastPurchaseDate || purchaseDate > existing.lastPurchaseDate) {
            existing.lastPurchaseDate = purchaseDate;
          }
          existing.averageOrderValue = existing.totalValue / existing.totalPurchases;
        }
      });
      
      // Calculate percentiles for scoring
      const allMetrics = Array.from(contactMetrics.values());
      const recencyValues = allMetrics
        .map(m => m.lastPurchaseDate ? differenceInDays(new Date(), m.lastPurchaseDate) : 999)
        .sort((a, b) => a - b);
      const frequencyValues = allMetrics.map(m => m.totalPurchases).sort((a, b) => a - b);
      const monetaryValues = allMetrics.map(m => m.totalValue).sort((a, b) => a - b);
      
      const getPercentiles = (arr: number[]) => {
        const len = arr.length;
        return [
          arr[Math.floor(len * 0.2)] || 0,
          arr[Math.floor(len * 0.4)] || 0,
          arr[Math.floor(len * 0.6)] || 0,
          arr[Math.floor(len * 0.8)] || 0
        ];
      };
      
      const recencyPercentiles = getPercentiles(recencyValues);
      const frequencyPercentiles = getPercentiles(frequencyValues);
      const monetaryPercentiles = getPercentiles(monetaryValues);
      
      // Calculate RFM for each contact
      const rfmResults: TablesInsert<'rfm_analysis'>[] = [];
      
      for (const [contactId, metrics] of contactMetrics) {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) continue;
        
        const daysSinceLastPurchase = metrics.lastPurchaseDate
          ? differenceInDays(new Date(), metrics.lastPurchaseDate)
          : 999;
        
        const contactInteractions = interactionsByContact.get(contactId) || [];
        const lastInteraction = contactInteractions.length > 0
          ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime())))
          : null;
        const daysSinceLastInteraction = lastInteraction
          ? differenceInDays(new Date(), lastInteraction)
          : 999;
        
        const recencyScore = calculateRFMScore(daysSinceLastPurchase, recencyPercentiles, true);
        const frequencyScore = calculateRFMScore(metrics.totalPurchases, frequencyPercentiles);
        const monetaryScore = calculateRFMScore(metrics.totalValue, monetaryPercentiles);
        
        const segment = determineRFMSegment(recencyScore, frequencyScore, monetaryScore);
        const segmentInfo = RFM_SEGMENTS[segment];
        
        // Generate recommended actions based on segment
        const recommendedActions = generateRecommendedActions(segment, contact);
        const recommendedOffers = generateRecommendedOffers(segment, metrics);
        
        // Calculate predictions
        const avgPurchaseCycle = metrics.totalPurchases > 1
          ? daysSinceLastPurchase / metrics.totalPurchases
          : 30;
        const predictedNextPurchaseDate = metrics.lastPurchaseDate
          ? new Date(metrics.lastPurchaseDate.getTime() + avgPurchaseCycle * 24 * 60 * 60 * 1000)
          : null;
        
        const predictedLifetimeValue = metrics.averageOrderValue * 12 * (recencyScore + frequencyScore) / 2;
        const churnProbability = calculateChurnProbability(recencyScore, frequencyScore, daysSinceLastPurchase);
        
        // Determine communication priority
        const communicationPriority = determineCommunicationPriority(segment, churnProbability, metrics.totalValue);
        
        rfmResults.push({
          user_id: user.id,
          contact_id: contactId,
          recency_score: recencyScore,
          frequency_score: frequencyScore,
          monetary_score: monetaryScore,
          days_since_last_purchase: daysSinceLastPurchase < 999 ? daysSinceLastPurchase : null,
          days_since_last_interaction: daysSinceLastInteraction < 999 ? daysSinceLastInteraction : null,
          total_purchases: metrics.totalPurchases,
          total_interactions: contactInteractions.length,
          total_monetary_value: metrics.totalValue,
          average_order_value: metrics.averageOrderValue,
          segment,
          segment_description: segmentInfo.description,
          segment_color: segmentInfo.color,
          predicted_next_purchase_date: predictedNextPurchaseDate?.toISOString().split('T')[0],
          predicted_lifetime_value: predictedLifetimeValue,
          churn_probability: churnProbability,
          recommended_actions: JSON.parse(JSON.stringify(recommendedActions)),
          recommended_offers: JSON.parse(JSON.stringify(recommendedOffers)),
          communication_priority: communicationPriority,
          analyzed_at: new Date().toISOString()
        });
      }
      
      // Batch upsert RFM analysis (single query instead of N sequential queries)
      if (rfmResults.length > 0) {
        const { error: upsertError } = await supabase
          .from('rfm_analysis')
          .upsert(rfmResults, { onConflict: 'user_id,contact_id' });

        if (upsertError) {
          logger.error('Error batch upserting RFM:', upsertError);
        }

        // Batch insert history records
        const historyRecords = rfmResults.map(result => ({
          user_id: user.id,
          contact_id: result.contact_id,
          recency_score: result.recency_score,
          frequency_score: result.frequency_score,
          monetary_score: result.monetary_score,
          segment: result.segment,
          total_monetary_value: result.total_monetary_value
        }));

        const { error: historyError } = await supabase
          .from('rfm_history')
          .insert(historyRecords);

        if (historyError) {
          logger.error('Error batch inserting RFM history:', historyError);
        }
      }
      
      // Refresh data
      await fetchRFMData();
      
    } catch (error) {
      logger.error('Error running RFM analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, contacts, interactions, fetchRFMData]);

  // Calculate dashboard stats
  const dashboardStats = useMemo((): RFMDashboardStats => {
    if (rfmData.length === 0) {
      return {
        totalAnalyzed: 0,
        averageRfmScore: 0,
        averageMonetaryValue: 0,
        totalRevenue: 0,
        segmentDistribution: {} as Record<RFMSegment, number>,
        scoreDistribution: {
          recency: {},
          frequency: {},
          monetary: {}
        },
        trends: { improving: 0, stable: 0, declining: 0 },
        priorityDistribution: {} as Record<CommunicationPriority, number>,
        atRiskRevenue: 0,
        championsRevenue: 0
      };
    }
    
    const segmentDistribution: Record<RFMSegment, number> = {
      champions: 0,
      loyal_customers: 0,
      potential_loyalists: 0,
      recent_customers: 0,
      promising: 0,
      needing_attention: 0,
      about_to_sleep: 0,
      at_risk: 0,
      cant_lose: 0,
      hibernating: 0,
      lost: 0
    };
    
    const scoreDistribution = {
      recency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      frequency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      monetary: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
    
    const trends = { improving: 0, stable: 0, declining: 0 };
    const priorityDistribution: Record<CommunicationPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    let totalScore = 0;
    let totalMonetary = 0;
    let atRiskRevenue = 0;
    let championsRevenue = 0;
    
    rfmData.forEach(item => {
      segmentDistribution[item.segment]++;
      scoreDistribution.recency[item.recencyScore]++;
      scoreDistribution.frequency[item.frequencyScore]++;
      scoreDistribution.monetary[item.monetaryScore]++;
      
      if (item.overallTrend) {
        trends[item.overallTrend]++;
      }
      
      priorityDistribution[item.communicationPriority]++;
      
      totalScore += item.totalScore;
      totalMonetary += item.totalMonetaryValue;
      
      if (['at_risk', 'cant_lose', 'about_to_sleep'].includes(item.segment)) {
        atRiskRevenue += item.totalMonetaryValue;
      }
      
      if (item.segment === 'champions') {
        championsRevenue += item.totalMonetaryValue;
      }
    });
    
    return {
      totalAnalyzed: rfmData.length,
      averageRfmScore: Math.round(totalScore / rfmData.length * 10) / 10,
      averageMonetaryValue: Math.round(totalMonetary / rfmData.length),
      totalRevenue: totalMonetary,
      segmentDistribution,
      scoreDistribution,
      trends,
      priorityDistribution,
      atRiskRevenue,
      championsRevenue
    };
  }, [rfmData]);

  // Get contacts with their RFM data
  const contactSummaries = useMemo((): RFMContactSummary[] => {
    return contacts.map(contact => {
      const rfm = rfmData.find(r => r.contactId === contact.id);
      const contactHistory = history.filter(h => h.contactId === contact.id);
      
      return {
        contactId: contact.id,
        contactName: `${contact.first_name} ${contact.last_name}`,
        companyName: null, // Would need to join with companies
        avatarUrl: contact.avatar_url,
        rfmAnalysis: rfm || null,
        history: contactHistory
      };
    });
  }, [contacts, rfmData, history]);

  // Get single contact RFM
  const contactRFM = useMemo(() => {
    if (!contactId) return null;
    return rfmData.find(r => r.contactId === contactId) || null;
  }, [rfmData, contactId]);

  useEffect(() => {
    fetchRFMData();
    if (contactId) {
      fetchHistory();
    }
  }, [fetchRFMData, fetchHistory, contactId]);

  return {
    rfmData,
    contactRFM,
    history,
    dashboardStats,
    contactSummaries,
    loading,
    analyzing,
    runAnalysis,
    refresh: fetchRFMData
  };
}

// Helper functions
function generateRecommendedActions(segment: RFMSegment, _contact: { id: string }): RFMAction[] {
  const actions: RFMAction[] = [];
  
  const segmentActions: Record<RFMSegment, RFMAction[]> = {
    champions: [
      { id: '1', action: 'Oferecer programa VIP', description: 'Convidar para programa de fidelidade exclusivo', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar retenção em 20%' },
      { id: '2', action: 'Pedir indicações', description: 'Solicitar recomendações para novos clientes', priority: 2, channel: 'whatsapp', timing: 'Após próxima compra', expectedImpact: '2-3 novos leads' },
      { id: '3', action: 'Feedback exclusivo', description: 'Pedir opinião sobre novos produtos', priority: 3, channel: 'meeting', timing: 'Próximo mês', expectedImpact: 'Insights valiosos' }
    ],
    loyal_customers: [
      { id: '1', action: 'Upsell premium', description: 'Apresentar produtos de maior valor', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar ticket médio 15%' },
      { id: '2', action: 'Cross-sell', description: 'Sugerir produtos complementares', priority: 2, channel: 'whatsapp', timing: 'Próxima interação', expectedImpact: 'Nova categoria de compra' }
    ],
    potential_loyalists: [
      { id: '1', action: 'Nurturing personalizado', description: 'Sequência de emails educativos', priority: 1, channel: 'email', timing: 'Iniciar hoje', expectedImpact: 'Converter para fiel' },
      { id: '2', action: 'Oferta de boas-vindas', description: 'Desconto especial segunda compra', priority: 2, channel: 'any', timing: '7 dias', expectedImpact: 'Acelerar recompra' }
    ],
    recent_customers: [
      { id: '1', action: 'Onboarding completo', description: 'Guia de uso e dicas', priority: 1, channel: 'email', timing: 'Imediato', expectedImpact: 'Satisfação inicial' },
      { id: '2', action: 'Check-in pós-compra', description: 'Verificar satisfação', priority: 2, channel: 'whatsapp', timing: '7 dias', expectedImpact: 'Identificar problemas' }
    ],
    promising: [
      { id: '1', action: 'Educar sobre valor', description: 'Mostrar benefícios dos produtos', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar percepção de valor' },
      { id: '2', action: 'Oferta trial', description: 'Período de teste de produtos premium', priority: 2, channel: 'any', timing: '14 dias', expectedImpact: 'Upgrade de compra' }
    ],
    needing_attention: [
      { id: '1', action: 'Reengajar com conteúdo', description: 'Enviar conteúdo relevante', priority: 1, channel: 'email', timing: 'Hoje', expectedImpact: 'Reativar interesse' },
      { id: '2', action: 'Oferta limitada', description: 'Desconto com prazo', priority: 2, channel: 'whatsapp', timing: 'Esta semana', expectedImpact: 'Compra imediata' }
    ],
    about_to_sleep: [
      { id: '1', action: 'Ligação de check-in', description: 'Entender motivo do afastamento', priority: 1, channel: 'phone', timing: 'Hoje', expectedImpact: 'Descobrir problemas' },
      { id: '2', action: 'Oferta reativação', description: 'Desconto agressivo', priority: 2, channel: 'email', timing: 'Imediato', expectedImpact: 'Reativar 30%' }
    ],
    at_risk: [
      { id: '1', action: 'Contato urgente', description: 'Ligar para entender situação', priority: 1, channel: 'phone', timing: 'Hoje', expectedImpact: 'Prevenir churn' },
      { id: '2', action: 'Oferta win-back', description: 'Desconto especial + brinde', priority: 2, channel: 'email', timing: 'Imediato', expectedImpact: 'Recuperar 25%' }
    ],
    cant_lose: [
      { id: '1', action: 'Reunião presencial', description: 'Visita pessoal ou vídeo chamada', priority: 1, channel: 'meeting', timing: 'Esta semana', expectedImpact: 'Salvar relacionamento' },
      { id: '2', action: 'Resolver problemas', description: 'Identificar e corrigir issues', priority: 2, channel: 'phone', timing: 'Hoje', expectedImpact: 'Satisfação imediata' }
    ],
    hibernating: [
      { id: '1', action: 'Campanha reativação', description: 'Email automatizado com oferta', priority: 1, channel: 'email', timing: 'Próxima campanha', expectedImpact: 'Reativar 10%' }
    ],
    lost: [
      { id: '1', action: 'Última tentativa', description: 'Email final de reconquista', priority: 1, channel: 'email', timing: 'Próxima campanha', expectedImpact: 'Reativar 5%' }
    ]
  };
  
  return segmentActions[segment] || [];
}

function generateRecommendedOffers(segment: RFMSegment, metrics: PurchaseData): RFMOffer[] {
  const offers: RFMOffer[] = [];
  
  const segmentOffers: Record<RFMSegment, RFMOffer[]> = {
    champions: [
      { id: '1', offerType: 'Acesso VIP', description: 'Acesso antecipado a novos produtos', validDays: 30, reason: 'Recompensar lealdade' },
      { id: '2', offerType: 'Frete Grátis', description: 'Frete grátis vitalício', validDays: 365, reason: 'Manter engajamento' }
    ],
    loyal_customers: [
      { id: '1', offerType: 'Desconto Fidelidade', description: 'Desconto progressivo por tempo de cliente', discountPercent: 15, validDays: 30, reason: 'Aumentar valor' }
    ],
    potential_loyalists: [
      { id: '1', offerType: 'Bônus Segunda Compra', description: 'Crédito extra na próxima compra', discountPercent: 10, validDays: 14, reason: 'Acelerar conversão' }
    ],
    recent_customers: [
      { id: '1', offerType: 'Kit Boas-Vindas', description: 'Brinde especial para novos clientes', validDays: 7, reason: 'Encantar' }
    ],
    promising: [
      { id: '1', offerType: 'Trial Premium', description: 'Teste gratuito de produtos premium', validDays: 14, reason: 'Aumentar ticket' }
    ],
    needing_attention: [
      { id: '1', offerType: 'Volte Agora', description: 'Desconto especial por tempo limitado', discountPercent: 20, validDays: 7, reason: 'Urgência' }
    ],
    about_to_sleep: [
      { id: '1', offerType: 'Reativação', description: 'Oferta exclusiva para retorno', discountPercent: 25, validDays: 5, reason: 'Prevenir perda' }
    ],
    at_risk: [
      { id: '1', offerType: 'Win-Back', description: 'Desconto agressivo + brinde', discountPercent: 30, validDays: 3, reason: 'Recuperar cliente' }
    ],
    cant_lose: [
      { id: '1', offerType: 'VIP Especial', description: 'Condições exclusivas personalizadas', discountPercent: 35, validDays: 7, reason: 'Salvar relacionamento' }
    ],
    hibernating: [
      { id: '1', offerType: 'Sentimos Sua Falta', description: 'Desconto para retorno', discountPercent: 20, validDays: 14, reason: 'Reativação' }
    ],
    lost: [
      { id: '1', offerType: 'Última Chance', description: 'Oferta final de reconquista', discountPercent: 40, validDays: 7, reason: 'Tentativa final' }
    ]
  };
  
  return segmentOffers[segment] || [];
}

function calculateChurnProbability(recency: number, frequency: number, daysSinceLastPurchase: number): number {
  let probability = 0;
  
  // Base on recency score (inverted - lower score = higher churn)
  probability += (6 - recency) * 15;
  
  // Adjust for frequency
  probability -= (frequency - 1) * 5;
  
  // Adjust for actual days
  if (daysSinceLastPurchase > 90) probability += 20;
  else if (daysSinceLastPurchase > 60) probability += 10;
  else if (daysSinceLastPurchase > 30) probability += 5;
  
  return Math.max(0, Math.min(100, probability));
}

function determineCommunicationPriority(segment: RFMSegment, churnProbability: number, totalValue: number): CommunicationPriority {
  if (['cant_lose', 'at_risk'].includes(segment) || churnProbability > 70) {
    return 'urgent';
  }
  
  if (['about_to_sleep', 'needing_attention'].includes(segment) || churnProbability > 50) {
    return 'high';
  }
  
  if (['champions', 'loyal_customers', 'potential_loyalists'].includes(segment)) {
    return 'medium';
  }
  
  return 'low';
}
