import { useMemo } from 'react';
import { Contact, Interaction, DecisionCriteria } from '@/types';

export interface PersonalizedOffer {
  id: string;
  title: string;
  description: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  category: 'product' | 'service' | 'upgrade' | 'addon' | 'renewal' | 'cross_sell';
  priority: 'high' | 'medium' | 'low';
  bestApproach: string;
  suggestedPitch: string;
  timing: string;
  objectionRisks: string[];
  valueProposition: string;
}

export interface OfferRecommendation {
  topOffers: PersonalizedOffer[];
  avoidOffers: { title: string; reason: string }[];
  optimalTiming: string;
  communicationChannel: string;
  priceStrategy: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  buyingSignals: string[];
  readinessScore: number; // 0-100
}

// Mock offer catalog - em produção viria do banco de dados
const OFFER_CATALOG = [
  { id: '1', title: 'Plano Premium', category: 'upgrade', baseValue: 'status', profile: 'D', criteria: ['quality', 'innovation'] },
  { id: '2', title: 'Consultoria Estratégica', category: 'service', baseValue: 'expertise', profile: 'C', criteria: ['quality', 'support'] },
  { id: '3', title: 'Pacote de Suporte 24/7', category: 'addon', baseValue: 'segurança', profile: 'S', criteria: ['support', 'relationship'] },
  { id: '4', title: 'Treinamento Avançado', category: 'service', baseValue: 'conhecimento', profile: 'C', criteria: ['innovation', 'quality'] },
  { id: '5', title: 'Programa de Fidelidade', category: 'addon', baseValue: 'economia', profile: 'S', criteria: ['price', 'relationship'] },
  { id: '6', title: 'Solução Personalizada', category: 'product', baseValue: 'exclusividade', profile: 'D', criteria: ['innovation', 'quality'] },
  { id: '7', title: 'Renovação Antecipada', category: 'renewal', baseValue: 'garantia', profile: 'S', criteria: ['relationship', 'price'] },
  { id: '8', title: 'Expansão de Licenças', category: 'cross_sell', baseValue: 'crescimento', profile: 'I', criteria: ['speed', 'support'] },
  { id: '9', title: 'Módulo de Relatórios', category: 'addon', baseValue: 'controle', profile: 'C', criteria: ['quality', 'innovation'] },
  { id: '10', title: 'Integração com Parceiros', category: 'service', baseValue: 'eficiência', profile: 'D', criteria: ['speed', 'innovation'] },
];

export function usePersonalizedOffers(contact: Contact | null, interactions: Interaction[]) {
  const recommendation = useMemo<OfferRecommendation | null>(() => {
    if (!contact) return null;

    const behavior = contact.behavior;
    const discProfile = behavior?.discProfile || 'S';
    const decisionCriteria = behavior?.decisionCriteria || [];
    const relationshipStage = contact.relationshipStage;

    // Calculate buying signals
    const buyingSignals: string[] = [];
    const contactInteractions = interactions.filter(i => i.contactId === contact.id);
    
    const recentInteractions = contactInteractions.slice(0, 10);
    const positiveCount = recentInteractions.filter(i => i.sentiment === 'positive').length;
    if (positiveCount >= 5) buyingSignals.push('Alto índice de interações positivas');
    
    if (behavior?.decisionRole === 'final_decision') buyingSignals.push('É o decisor final');
    if (behavior?.budgetAuthority) buyingSignals.push('Possui autoridade sobre orçamento');
    if (behavior?.supportLevel && behavior.supportLevel >= 7) buyingSignals.push('Alto nível de suporte ao relacionamento');
    if (relationshipStage === 'loyal_customer' || relationshipStage === 'advocate') buyingSignals.push('Cliente fiel com histórico positivo');
    if (contact.interactionCount > 10) buyingSignals.push('Engajamento frequente com a empresa');

    // Calculate readiness score
    let readinessScore = 30; // Base
    if (buyingSignals.length >= 3) readinessScore += 25;
    else if (buyingSignals.length >= 1) readinessScore += 10;
    if (contact.sentiment === 'positive') readinessScore += 20;
    if (relationshipStage === 'customer' || relationshipStage === 'loyal_customer') readinessScore += 15;
    if (behavior?.decisionSpeed === 'fast' || behavior?.decisionSpeed === 'impulsive') readinessScore += 10;
    readinessScore = Math.min(95, readinessScore);

    // Score and rank offers
    const scoredOffers = OFFER_CATALOG.map(offer => {
      let matchScore = 40; // Base score
      const matchReasons: string[] = [];

      // DISC profile match
      if (offer.profile === discProfile) {
        matchScore += 25;
        matchReasons.push(`Alinhado com perfil ${discProfile} do cliente`);
      }

      // Decision criteria match
      const criteriaMatches = offer.criteria.filter(c => decisionCriteria.includes(c as DecisionCriteria));
      if (criteriaMatches.length > 0) {
        matchScore += criteriaMatches.length * 15;
        matchReasons.push(`Atende critérios: ${criteriaMatches.join(', ')}`);
      }

      // Relationship stage consideration
      if (offer.category === 'renewal' && (relationshipStage === 'customer' || relationshipStage === 'loyal_customer')) {
        matchScore += 20;
        matchReasons.push('Cliente elegível para renovação');
      }
      if (offer.category === 'upgrade' && relationshipStage === 'loyal_customer') {
        matchScore += 15;
        matchReasons.push('Cliente fiel pronto para upgrade');
      }
      if (offer.category === 'cross_sell' && contact.interactionCount > 5) {
        matchScore += 10;
        matchReasons.push('Relacionamento maduro para cross-sell');
      }

      // Sentiment boost
      if (contact.sentiment === 'positive') {
        matchScore += 10;
        matchReasons.push('Momento positivo do cliente');
      }

      matchScore = Math.min(95, matchScore);

      // Generate approach and pitch based on DISC
      let bestApproach = '';
      let suggestedPitch = '';
      
      switch (discProfile) {
        case 'D':
          bestApproach = 'Direto, focado em resultados e ROI';
          suggestedPitch = `"${offer.title}" vai te dar resultados mais rápidos e controle total sobre ${offer.baseValue}.`;
          break;
        case 'I':
          bestApproach = 'Entusiasta, mostrando benefícios para a equipe';
          suggestedPitch = `Imagina como "${offer.title}" vai impressionar sua equipe! ${offer.baseValue} é o que todo mundo quer.`;
          break;
        case 'S':
          bestApproach = 'Calmo, enfatizando estabilidade e suporte';
          suggestedPitch = `"${offer.title}" vai trazer mais ${offer.baseValue} para você e sua equipe, com todo nosso suporte.`;
          break;
        case 'C':
          bestApproach = 'Detalhado, com dados e especificações';
          suggestedPitch = `Os dados mostram que "${offer.title}" aumenta ${offer.baseValue} em média 40%. Posso te mostrar o estudo?`;
          break;
        default:
          bestApproach = 'Consultivo, entendendo necessidades';
          suggestedPitch = `"${offer.title}" pode ser exatamente o que você precisa para melhorar ${offer.baseValue}.`;
      }

      // Determine timing
      let timing = 'Momento adequado';
      if (contact.sentiment === 'negative') timing = 'Aguarde melhoria no relacionamento';
      else if (readinessScore >= 70) timing = 'Excelente momento - aja agora!';
      else if (behavior?.bestTimeToApproach) timing = `Melhor horário: ${behavior.bestTimeToApproach}`;

      // Objection risks
      const objectionRisks: string[] = [];
      if (decisionCriteria.includes('price')) objectionRisks.push('Sensível a preço - prepare justificativa de valor');
      if (behavior?.needsApproval) objectionRisks.push('Precisa de aprovação superior');
      if (behavior?.decisionSpeed === 'slow') objectionRisks.push('Decisão lenta - não pressione');

      // Value proposition
      let valueProposition = `${offer.title} entrega ${offer.baseValue}`;
      if (criteriaMatches.length > 0) {
        valueProposition += `, atendendo sua necessidade de ${criteriaMatches[0]}`;
      }

      // Priority
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (matchScore >= 75 && readinessScore >= 60) priority = 'high';
      else if (matchScore < 50) priority = 'low';

      return {
        id: offer.id,
        title: offer.title,
        description: `Oferta de ${offer.category} focada em ${offer.baseValue}`,
        matchScore,
        matchReasons,
        category: offer.category as PersonalizedOffer['category'],
        priority,
        bestApproach,
        suggestedPitch,
        timing,
        objectionRisks,
        valueProposition
      };
    });

    // Sort by match score
    scoredOffers.sort((a, b) => b.matchScore - a.matchScore);

    // Top offers (max 5)
    const topOffers = scoredOffers.slice(0, 5);

    // Offers to avoid
    const avoidOffers: { title: string; reason: string }[] = [];
    if (contact.sentiment === 'negative') {
      avoidOffers.push({ title: 'Qualquer oferta agressiva', reason: 'Cliente com sentimento negativo' });
    }
    if (behavior?.decisionSpeed === 'slow' && readinessScore < 50) {
      avoidOffers.push({ title: 'Ofertas com prazo curto', reason: 'Cliente decide lentamente' });
    }
    if (!behavior?.budgetAuthority) {
      avoidOffers.push({ title: 'Ofertas de alto valor', reason: 'Não tem autoridade sobre orçamento' });
    }

    // Optimal timing
    let optimalTiming = 'Durante horário comercial';
    if (behavior?.bestContactWindow) optimalTiming = behavior.bestContactWindow;
    if (behavior?.bestTimeToApproach) optimalTiming = behavior.bestTimeToApproach;

    // Communication channel
    let communicationChannel = 'Email seguido de ligação';
    if (behavior?.preferredChannel) {
      const channelMap: Record<string, string> = {
        whatsapp: 'WhatsApp - resposta rápida',
        call: 'Ligação telefônica',
        email: 'E-mail formal',
        meeting: 'Reunião presencial',
        video: 'Videoconferência'
      };
      communicationChannel = channelMap[behavior.preferredChannel] || communicationChannel;
    }

    // Price strategy
    let priceStrategy = 'Valor padrão com foco em benefícios';
    if (decisionCriteria.includes('price')) priceStrategy = 'Destaque economia e ROI';
    else if (decisionCriteria.includes('quality')) priceStrategy = 'Enfatize qualidade premium';
    else if (decisionCriteria.includes('relationship')) priceStrategy = 'Ofereça condições especiais por fidelidade';

    // Urgency level
    let urgencyLevel: 'high' | 'medium' | 'low' = 'medium';
    if (readinessScore >= 70 && contact.sentiment === 'positive') urgencyLevel = 'high';
    else if (readinessScore < 40 || contact.sentiment === 'negative') urgencyLevel = 'low';

    return {
      topOffers,
      avoidOffers,
      optimalTiming,
      communicationChannel,
      priceStrategy,
      urgencyLevel,
      buyingSignals,
      readinessScore
    };
  }, [contact, interactions]);

  return recommendation;
}
