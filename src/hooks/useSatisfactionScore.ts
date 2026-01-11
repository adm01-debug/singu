import { useMemo } from 'react';
import { Contact, Interaction } from '@/types';
import { differenceInDays, subDays } from 'date-fns';

export interface SatisfactionFactor {
  name: string;
  score: number; // 0-100
  weight: number; // 0-1
  trend: 'up' | 'down' | 'stable';
  details: string;
}

export interface SatisfactionHistory {
  date: Date;
  score: number;
  factors: string[];
}

export interface ContactSatisfaction {
  contactId: string;
  contactName: string;
  overallScore: number; // 0-100
  level: 'very_satisfied' | 'satisfied' | 'neutral' | 'unsatisfied' | 'very_unsatisfied';
  factors: SatisfactionFactor[];
  trend: 'improving' | 'stable' | 'declining';
  riskIndicators: string[];
  opportunities: string[];
  recommendations: string[];
  history: SatisfactionHistory[];
  npsLikelihood: number; // 0-10 (Net Promoter Score proxy)
  retentionProbability: number; // 0-100
}

export interface GlobalSatisfaction {
  averageScore: number;
  distribution: { level: string; count: number; percentage: number }[];
  topPerformers: ContactSatisfaction[];
  atRisk: ContactSatisfaction[];
  trending: { improving: number; stable: number; declining: number };
}

export function useSatisfactionScore(contact: Contact | null, interactions: Interaction[]) {
  const satisfaction = useMemo<ContactSatisfaction | null>(() => {
    if (!contact) return null;

    const now = new Date();
    const contactInteractions = interactions.filter(i => i.contactId === contact.id);
    const contactName = `${contact.firstName} ${contact.lastName}`;

    // Calculate individual factors
    const factors: SatisfactionFactor[] = [];

    // 1. Sentiment Score (40% weight)
    const recentInteractions = contactInteractions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    const sentimentScores = { positive: 100, neutral: 50, negative: 0 };
    const avgSentiment = recentInteractions.length > 0
      ? recentInteractions.reduce((acc, i) => acc + sentimentScores[i.sentiment], 0) / recentInteractions.length
      : 50;
    
    // Check sentiment trend
    let sentimentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (recentInteractions.length >= 4) {
      const recent = recentInteractions.slice(0, 2);
      const older = recentInteractions.slice(2, 4);
      const recentAvg = recent.reduce((acc, i) => acc + sentimentScores[i.sentiment], 0) / recent.length;
      const olderAvg = older.reduce((acc, i) => acc + sentimentScores[i.sentiment], 0) / older.length;
      if (recentAvg > olderAvg + 10) sentimentTrend = 'up';
      else if (recentAvg < olderAvg - 10) sentimentTrend = 'down';
    }

    factors.push({
      name: 'Sentimento das Interações',
      score: avgSentiment,
      weight: 0.40,
      trend: sentimentTrend,
      details: `Baseado nas últimas ${recentInteractions.length} interações`
    });

    // 2. Engagement Score (25% weight)
    const threeMonthsAgo = subDays(now, 90);
    const recentCount = contactInteractions.filter(i => new Date(i.createdAt) >= threeMonthsAgo).length;
    const initiatedByClient = contactInteractions.filter(i => i.initiatedBy === 'them').length;
    const responseRate = contactInteractions.length > 0 ? (initiatedByClient / contactInteractions.length) * 100 : 50;
    
    const engagementScore = Math.min(100, (recentCount * 10) + (responseRate * 0.5));
    
    factors.push({
      name: 'Engajamento do Cliente',
      score: engagementScore,
      weight: 0.25,
      trend: recentCount >= 4 ? 'up' : recentCount < 2 ? 'down' : 'stable',
      details: `${recentCount} interações nos últimos 3 meses, ${Math.round(responseRate)}% iniciadas pelo cliente`
    });

    // 3. Relationship Quality (20% weight)
    const relationshipScore = contact.relationshipScore || 50;
    const stageScores: Record<string, number> = {
      advocate: 100, loyal_customer: 90, customer: 70, negotiation: 60,
      opportunity: 50, qualified_lead: 40, prospect: 30, unknown: 20, at_risk: 15, lost: 5
    };
    const stageScore = stageScores[contact.relationshipStage] || 50;
    const qualityScore = (relationshipScore + stageScore) / 2;

    factors.push({
      name: 'Qualidade do Relacionamento',
      score: qualityScore,
      weight: 0.20,
      trend: contact.relationshipStage === 'at_risk' ? 'down' : 'stable',
      details: `Score ${relationshipScore}%, Estágio: ${contact.relationshipStage}`
    });

    // 4. Recency Score (15% weight)
    const daysSinceContact = contact.lastInteraction 
      ? differenceInDays(now, new Date(contact.lastInteraction))
      : 999;
    
    let recencyScore = 100;
    if (daysSinceContact > 60) recencyScore = 20;
    else if (daysSinceContact > 30) recencyScore = 50;
    else if (daysSinceContact > 14) recencyScore = 75;

    factors.push({
      name: 'Recência de Contato',
      score: recencyScore,
      weight: 0.15,
      trend: daysSinceContact < 7 ? 'up' : daysSinceContact > 21 ? 'down' : 'stable',
      details: daysSinceContact < 999 ? `Último contato há ${daysSinceContact} dias` : 'Sem contato registrado'
    });

    // Calculate weighted overall score
    const overallScore = Math.round(
      factors.reduce((acc, f) => acc + (f.score * f.weight), 0)
    );

    // Determine satisfaction level
    let level: ContactSatisfaction['level'] = 'neutral';
    if (overallScore >= 80) level = 'very_satisfied';
    else if (overallScore >= 60) level = 'satisfied';
    else if (overallScore >= 40) level = 'neutral';
    else if (overallScore >= 20) level = 'unsatisfied';
    else level = 'very_unsatisfied';

    // Determine overall trend
    const upCount = factors.filter(f => f.trend === 'up').length;
    const downCount = factors.filter(f => f.trend === 'down').length;
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (upCount > downCount + 1) trend = 'improving';
    else if (downCount > upCount + 1) trend = 'declining';

    // Risk indicators
    const riskIndicators: string[] = [];
    if (contact.sentiment === 'negative') riskIndicators.push('Sentimento negativo atual');
    if (daysSinceContact > 30) riskIndicators.push('Muito tempo sem contato');
    if (sentimentTrend === 'down') riskIndicators.push('Tendência de sentimento em queda');
    if (contact.relationshipStage === 'at_risk') riskIndicators.push('Marcado como em risco');
    if (engagementScore < 30) riskIndicators.push('Baixo engajamento');

    // Opportunities
    const opportunities: string[] = [];
    if (contact.sentiment === 'positive') opportunities.push('Momento positivo - bom para upsell');
    if (contact.relationshipStage === 'loyal_customer') opportunities.push('Cliente fiel - potencial advogado da marca');
    if (recentCount >= 5) opportunities.push('Alto engajamento recente');
    if (contact.behavior?.supportLevel && contact.behavior.supportLevel >= 8) opportunities.push('Alto nível de suporte - pedir referências');

    // Recommendations
    const recommendations: string[] = [];
    if (overallScore < 40) recommendations.push('Agende uma ligação urgente para entender problemas');
    if (daysSinceContact > 14) recommendations.push('Retome contato o mais rápido possível');
    if (sentimentTrend === 'down') recommendations.push('Investigue causa da queda no sentimento');
    if (engagementScore < 40) recommendations.push('Tente diferentes abordagens para aumentar engajamento');
    if (overallScore >= 70 && opportunities.length > 0) recommendations.push('Explore oportunidades de expansão');
    if (recommendations.length === 0) recommendations.push('Continue mantendo o relacionamento saudável');

    // Build history (simulated - in production would come from stored snapshots)
    const history: SatisfactionHistory[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthAgo = subDays(now, i * 30);
      // Simulate score variation
      const variation = (Math.random() - 0.5) * 20;
      const historicScore = Math.max(0, Math.min(100, overallScore + variation + (i * (trend === 'declining' ? 3 : trend === 'improving' ? -3 : 0))));
      history.push({
        date: monthAgo,
        score: Math.round(historicScore),
        factors: factors.filter(f => f.score > 50).map(f => f.name).slice(0, 2)
      });
    }

    // NPS likelihood (0-10)
    let npsLikelihood = Math.round(overallScore / 10);
    if (contact.relationshipStage === 'advocate') npsLikelihood = Math.min(10, npsLikelihood + 1);
    if (contact.sentiment === 'negative') npsLikelihood = Math.max(0, npsLikelihood - 2);

    // Retention probability
    let retentionProbability = overallScore;
    if (riskIndicators.length >= 2) retentionProbability -= 20;
    if (contact.relationshipStage === 'loyal_customer' || contact.relationshipStage === 'advocate') retentionProbability += 10;
    retentionProbability = Math.max(5, Math.min(95, retentionProbability));

    return {
      contactId: contact.id,
      contactName,
      overallScore,
      level,
      factors,
      trend,
      riskIndicators,
      opportunities,
      recommendations,
      history,
      npsLikelihood,
      retentionProbability
    };
  }, [contact, interactions]);

  return satisfaction;
}

export function useGlobalSatisfaction(contacts: Contact[], interactions: Interaction[]) {
  const global = useMemo<GlobalSatisfaction>(() => {
    const allSatisfactions: ContactSatisfaction[] = [];

    contacts.forEach(contact => {
      const contactInteractions = interactions.filter(i => i.contactId === contact.id);
      
      // Simplified calculation for each contact
      const recentInteractions = contactInteractions.slice(0, 5);
      const sentimentScores = { positive: 100, neutral: 50, negative: 0 };
      const avgSentiment = recentInteractions.length > 0
        ? recentInteractions.reduce((acc, i) => acc + sentimentScores[i.sentiment], 0) / recentInteractions.length
        : 50;
      
      const relationshipScore = contact.relationshipScore || 50;
      const overallScore = Math.round((avgSentiment * 0.6) + (relationshipScore * 0.4));

      let level: ContactSatisfaction['level'] = 'neutral';
      if (overallScore >= 80) level = 'very_satisfied';
      else if (overallScore >= 60) level = 'satisfied';
      else if (overallScore >= 40) level = 'neutral';
      else if (overallScore >= 20) level = 'unsatisfied';
      else level = 'very_unsatisfied';

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (contact.relationshipStage === 'at_risk' || contact.sentiment === 'negative') trend = 'declining';
      else if (contact.sentiment === 'positive' && contact.relationshipScore > 70) trend = 'improving';

      allSatisfactions.push({
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName}`,
        overallScore,
        level,
        factors: [],
        trend,
        riskIndicators: [],
        opportunities: [],
        recommendations: [],
        history: [],
        npsLikelihood: Math.round(overallScore / 10),
        retentionProbability: overallScore
      });
    });

    // Calculate average
    const averageScore = allSatisfactions.length > 0
      ? Math.round(allSatisfactions.reduce((acc, s) => acc + s.overallScore, 0) / allSatisfactions.length)
      : 0;

    // Distribution
    const levels = ['very_satisfied', 'satisfied', 'neutral', 'unsatisfied', 'very_unsatisfied'];
    const distribution = levels.map(level => {
      const count = allSatisfactions.filter(s => s.level === level).length;
      return {
        level,
        count,
        percentage: allSatisfactions.length > 0 ? Math.round((count / allSatisfactions.length) * 100) : 0
      };
    });

    // Top performers
    const topPerformers = [...allSatisfactions]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);

    // At risk
    const atRisk = allSatisfactions
      .filter(s => s.level === 'unsatisfied' || s.level === 'very_unsatisfied' || s.trend === 'declining')
      .slice(0, 5);

    // Trending
    const trending = {
      improving: allSatisfactions.filter(s => s.trend === 'improving').length,
      stable: allSatisfactions.filter(s => s.trend === 'stable').length,
      declining: allSatisfactions.filter(s => s.trend === 'declining').length
    };

    return {
      averageScore,
      distribution,
      topPerformers,
      atRisk,
      trending
    };
  }, [contacts, interactions]);

  return global;
}
