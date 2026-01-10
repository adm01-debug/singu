import { useMemo } from 'react';
import { Contact, DISCProfile, RelationshipStage } from '@/types';
import { 
  TriggerSuggestion, 
  TriggerType, 
  MENTAL_TRIGGERS, 
  ClientTriggerAnalysis,
  PersuasionTemplate 
} from '@/types/triggers';

// Mapeamento de gatilhos por perfil DISC
const DISC_TRIGGER_PRIORITY: Record<string, TriggerType[]> = {
  D: ['specificity', 'authority', 'scarcity', 'urgency', 'comparison', 'fomo'],
  I: ['social_proof', 'testimonial', 'exclusivity', 'storytelling', 'belonging', 'anticipation'],
  S: ['guarantee', 'empathy', 'gift', 'commitment', 'consensus', 'small_yes'],
  C: ['specificity', 'authority', 'comparison', 'reason_why', 'guarantee', 'commitment'],
};

// Mapeamento de gatilhos por estágio de relacionamento
const STAGE_TRIGGER_PRIORITY: Record<RelationshipStage, TriggerType[]> = {
  unknown: ['empathy', 'gift', 'storytelling'],
  prospect: ['authority', 'social_proof', 'gift', 'empathy'],
  qualified_lead: ['specificity', 'testimonial', 'personalization', 'small_yes'],
  opportunity: ['comparison', 'exclusivity', 'reason_why', 'anticipation'],
  negotiation: ['scarcity', 'urgency', 'concession', 'guarantee', 'commitment'],
  customer: ['personalization', 'belonging', 'gift', 'consistency'],
  loyal_customer: ['exclusivity', 'public_commitment', 'anticipation'],
  advocate: ['belonging', 'public_commitment', 'gift'],
  at_risk: ['empathy', 'gift', 'guarantee', 'concession'],
  lost: ['empathy', 'gift', 'storytelling', 'social_proof'],
};

// Templates de persuasão por perfil e gatilho
const PERSUASION_TEMPLATES: PersuasionTemplate[] = [
  // PERFIL D - Dominante
  {
    id: 'd-authority-1',
    trigger: 'authority',
    discProfile: 'D',
    relationshipStage: null,
    channel: 'any',
    title: 'Autoridade com Resultados',
    template: '{nome}, empresas como {empresa_referencia} aumentaram {metrica}% usando nossa solução. Posso mostrar como replicar isso em {empresa_cliente}?',
    variables: ['nome', 'empresa_referencia', 'metrica', 'empresa_cliente'],
    tips: ['Seja direto e objetivo', 'Foque em resultados mensuráveis', 'Não enrole - vá ao ponto'],
  },
  {
    id: 'd-scarcity-1',
    trigger: 'scarcity',
    discProfile: 'D',
    relationshipStage: 'negotiation',
    channel: 'any',
    title: 'Escassez Direta',
    template: '{nome}, tenho apenas {quantidade} vagas disponíveis para implementação este mês. Consigo reservar uma para {empresa_cliente} se confirmarmos até {data}.',
    variables: ['nome', 'quantidade', 'empresa_cliente', 'data'],
    tips: ['Dominantes respondem bem a decisões rápidas', 'Seja genuíno na escassez'],
  },
  {
    id: 'd-specificity-1',
    trigger: 'specificity',
    discProfile: 'D',
    relationshipStage: null,
    channel: 'any',
    title: 'Dados Específicos',
    template: '{nome}, nosso sistema reduz {problema} em {percentual}%, economizando em média R$ {valor}/mês. Para {empresa_cliente}, estimamos economia de R$ {valor_estimado}.',
    variables: ['nome', 'problema', 'percentual', 'valor', 'empresa_cliente', 'valor_estimado'],
    tips: ['Use números precisos, não arredondados', 'Mostre cálculos específicos'],
  },

  // PERFIL I - Influente
  {
    id: 'i-social-proof-1',
    trigger: 'social_proof',
    discProfile: 'I',
    relationshipStage: null,
    channel: 'any',
    title: 'Prova Social Entusiasmante',
    template: '{nome}! Você precisa ver isso - {empresa_referencia} e {empresa_referencia2} já estão usando e os resultados são incríveis! Imagina você contando isso no próximo {evento}?',
    variables: ['nome', 'empresa_referencia', 'empresa_referencia2', 'evento'],
    tips: ['Use entusiasmo genuíno', 'Mencione pessoas conhecidas', 'Conecte com status social'],
  },
  {
    id: 'i-exclusivity-1',
    trigger: 'exclusivity',
    discProfile: 'I',
    relationshipStage: null,
    channel: 'any',
    title: 'Exclusividade VIP',
    template: '{nome}, estou selecionando alguns parceiros especiais para ter acesso antecipado. Pensei em você porque {razao_especial}. Quer fazer parte?',
    variables: ['nome', 'razao_especial'],
    tips: ['Faça a pessoa se sentir especial', 'Mencione seleção exclusiva'],
  },
  {
    id: 'i-storytelling-1',
    trigger: 'storytelling',
    discProfile: 'I',
    relationshipStage: 'early',
    channel: 'any',
    title: 'História Envolvente',
    template: '{nome}, deixa eu te contar uma história rápida. {cliente_historia} estava exatamente na mesma situação que você. Depois de {tempo}, {resultado_historia}. Incrível, né?',
    variables: ['nome', 'cliente_historia', 'tempo', 'resultado_historia'],
    tips: ['Conte histórias reais', 'Use emoção e entusiasmo', 'Faça paralelos com a situação do cliente'],
  },

  // PERFIL S - Estável
  {
    id: 's-guarantee-1',
    trigger: 'guarantee',
    discProfile: 'S',
    relationshipStage: null,
    channel: 'any',
    title: 'Garantia de Segurança',
    template: '{nome}, entendo sua preocupação com mudanças. Por isso oferecemos {tipo_garantia}. Você pode testar por {periodo} e, se não funcionar, {reversao}. Sem nenhum risco para você.',
    variables: ['nome', 'tipo_garantia', 'periodo', 'reversao'],
    tips: ['Enfatize segurança e estabilidade', 'Reduza percepção de risco', 'Seja paciente e tranquilo'],
  },
  {
    id: 's-empathy-1',
    trigger: 'empathy',
    discProfile: 'S',
    relationshipStage: null,
    channel: 'any',
    title: 'Empatia Genuína',
    template: '{nome}, eu realmente entendo. {problema_cliente} é algo que afeta muita gente. Já vi empresas passando por isso e sei como é difícil. Me conta mais sobre como isso está afetando vocês?',
    variables: ['nome', 'problema_cliente'],
    tips: ['Ouça mais do que fale', 'Demonstre compreensão real', 'Não pressione por decisões rápidas'],
  },
  {
    id: 's-gift-1',
    trigger: 'gift',
    discProfile: 'S',
    relationshipStage: null,
    channel: 'any',
    title: 'Presente de Valor',
    template: '{nome}, preparei {recurso_gratuito} pensando especificamente em {empresa_cliente}. É de graça, sem compromisso. Espero que ajude vocês com {problema}!',
    variables: ['nome', 'recurso_gratuito', 'empresa_cliente', 'problema'],
    tips: ['Dê valor genuíno sem pedir nada', 'Crie relacionamento antes de vender'],
  },

  // PERFIL C - Conforme
  {
    id: 'c-specificity-1',
    trigger: 'specificity',
    discProfile: 'C',
    relationshipStage: null,
    channel: 'email',
    title: 'Análise Detalhada',
    template: '{nome}, preparei uma análise técnica completa para {empresa_cliente}:\n\n• ROI estimado: {roi}%\n• Payback: {payback} meses\n• Economia anual: R$ {economia}\n• Tempo de implementação: {implementacao} dias\n\nPosso enviar o relatório completo com a metodologia de cálculo?',
    variables: ['nome', 'empresa_cliente', 'roi', 'payback', 'economia', 'implementacao'],
    tips: ['Forneça dados detalhados', 'Cite fontes e metodologias', 'Seja preciso nos números'],
  },
  {
    id: 'c-comparison-1',
    trigger: 'comparison',
    discProfile: 'C',
    relationshipStage: null,
    channel: 'any',
    title: 'Comparativo Técnico',
    template: '{nome}, fiz um comparativo técnico entre {opcoes}. Considerando os critérios que você mencionou ({criterios}), nossa solução se destaca em {diferenciais}. Posso detalhar cada ponto?',
    variables: ['nome', 'opcoes', 'criterios', 'diferenciais'],
    tips: ['Use tabelas comparativas', 'Seja objetivo e imparcial', 'Apresente prós e contras'],
  },
  {
    id: 'c-reason-why-1',
    trigger: 'reason_why',
    discProfile: 'C',
    relationshipStage: null,
    channel: 'any',
    title: 'Justificativa Técnica',
    template: '{nome}, a razão pela qual {afirmacao} é {explicacao_tecnica}. Isso foi comprovado por {fonte} em estudo com {amostra} empresas.',
    variables: ['nome', 'afirmacao', 'explicacao_tecnica', 'fonte', 'amostra'],
    tips: ['Sempre justifique suas afirmações', 'Cite estudos e pesquisas', 'Use lógica e razão'],
  },

  // TEMPLATES UNIVERSAIS
  {
    id: 'universal-reciprocity-1',
    trigger: 'gift',
    discProfile: null,
    relationshipStage: 'prospect',
    channel: 'any',
    title: 'Reciprocidade Inicial',
    template: '{nome}, antes de qualquer coisa, quero te entregar {recurso}. É um material que ajudou muitos clientes com {problema}. Fica com ele, sem compromisso!',
    variables: ['nome', 'recurso', 'problema'],
    tips: ['Sempre comece dando valor', 'Seja genuíno na ajuda'],
  },
  {
    id: 'universal-commitment-1',
    trigger: 'commitment',
    discProfile: null,
    relationshipStage: 'negotiation',
    channel: 'any',
    title: 'Compromisso Anterior',
    template: '{nome}, na nossa última conversa você mencionou que {objetivo_cliente} era prioridade. O que mudou de lá pra cá? Como posso te ajudar a chegar lá?',
    variables: ['nome', 'objetivo_cliente'],
    tips: ['Relembre compromissos anteriores', 'Seja sutil, não acusatório'],
  },
];

export function useClientTriggers(contact: Contact | null | undefined) {
  const analysis = useMemo<ClientTriggerAnalysis | null>(() => {
    if (!contact) return null;

    const discProfile = contact.behavior?.discProfile || null;
    const stage = contact.relationshipStage || 'unknown';
    
    // Calcula gatilhos primários baseado no DISC
    const discTriggers = discProfile ? DISC_TRIGGER_PRIORITY[discProfile] || [] : [];
    const stageTriggers = STAGE_TRIGGER_PRIORITY[stage] || [];
    
    // Combina e prioriza gatilhos
    const scoredTriggers = Object.values(MENTAL_TRIGGERS).map(trigger => {
      let score = 0;
      const reasons: string[] = [];
      
      // Pontuação por DISC (até 40 pontos)
      const discIndex = discTriggers.indexOf(trigger.id);
      if (discIndex !== -1) {
        score += 40 - (discIndex * 5);
        reasons.push(`Efetivo para perfil ${discProfile}`);
      }
      
      // Pontuação por estágio (até 30 pontos)
      const stageIndex = stageTriggers.indexOf(trigger.id);
      if (stageIndex !== -1) {
        score += 30 - (stageIndex * 4);
        reasons.push(`Ideal para estágio "${stage}"`);
      }
      
      // Penalidade se for para evitar
      if (discProfile && trigger.avoidFor.includes(discProfile)) {
        score -= 50;
        reasons.push(`Evitar para perfil ${discProfile}`);
      }
      
      // Bonus por efetividade geral
      score += trigger.effectiveness;
      
      // Encontra template correspondente
      const template = PERSUASION_TEMPLATES.find(t => 
        t.trigger === trigger.id && 
        (t.discProfile === null || t.discProfile === discProfile)
      );
      
      return {
        trigger,
        matchScore: Math.max(0, Math.min(100, score)),
        reason: reasons.join('. ') || 'Gatilho universal',
        template: template?.template || trigger.examples[0],
        timing: trigger.timing === 'early' ? 'Início da conversa' :
                trigger.timing === 'middle' ? 'Durante negociação' :
                trigger.timing === 'closing' ? 'Fechamento' : 'Qualquer momento',
      } as TriggerSuggestion;
    });
    
    // Ordena por score
    scoredTriggers.sort((a, b) => b.matchScore - a.matchScore);
    
    // Separa em primários e secundários
    const primaryTriggers = scoredTriggers.filter(t => t.matchScore >= 50).slice(0, 5);
    const secondaryTriggers = scoredTriggers.filter(t => t.matchScore >= 30 && t.matchScore < 50).slice(0, 5);
    
    // Identifica gatilhos a evitar
    const avoidTriggers = scoredTriggers
      .filter(t => t.matchScore < 0)
      .map(t => t.trigger.id);
    
    // Identifica oportunidade atual
    let currentOpportunity = null;
    
    // Lógica para identificar oportunidade baseada no contexto
    if (stage === 'negotiation') {
      const closingTrigger = primaryTriggers.find(t => t.trigger.timing === 'closing');
      if (closingTrigger) {
        currentOpportunity = {
          trigger: closingTrigger.trigger.id,
          reason: 'Cliente em fase de negociação - momento ideal para fechamento',
          urgency: 'high' as const,
        };
      }
    } else if (stage === 'at_risk') {
      currentOpportunity = {
        trigger: 'empathy' as TriggerType,
        reason: 'Relacionamento em risco - priorize reconexão emocional',
        urgency: 'high' as const,
      };
    } else if (contact.daysSinceContact && contact.daysSinceContact > 30) {
      currentOpportunity = {
        trigger: 'gift' as TriggerType,
        reason: 'Sem contato há mais de 30 dias - reative com valor',
        urgency: 'medium' as const,
      };
    }
    
    // Dicas de negociação baseadas no perfil
    const negotiationTips = generateNegotiationTips(discProfile, stage, contact);
    
    return {
      contactId: contact.id,
      primaryTriggers,
      secondaryTriggers,
      avoidTriggers,
      currentOpportunity,
      negotiationTips,
    };
  }, [contact]);
  
  // Função para obter templates
  const getTemplates = (triggerId: TriggerType): PersuasionTemplate[] => {
    if (!contact) return [];
    return PERSUASION_TEMPLATES.filter(t => 
      t.trigger === triggerId && 
      (t.discProfile === null || t.discProfile === contact.behavior?.discProfile)
    );
  };
  
  // Função para preencher template
  const fillTemplate = (template: string, variables: Record<string, string>): string => {
    let filled = template;
    Object.entries(variables).forEach(([key, value]) => {
      filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });
    return filled;
  };
  
  return {
    analysis,
    getTemplates,
    fillTemplate,
    allTriggers: MENTAL_TRIGGERS,
    allTemplates: PERSUASION_TEMPLATES,
  };
}

function generateNegotiationTips(
  discProfile: DISCProfile, 
  stage: RelationshipStage,
  contact: Contact
): string[] {
  const tips: string[] = [];
  
  // Dicas por perfil DISC
  switch (discProfile) {
    case 'D':
      tips.push('🎯 Seja direto e objetivo - Dominantes não gostam de enrolação');
      tips.push('📊 Foque em resultados e números concretos');
      tips.push('⚡ Ofereça opções e deixe ele escolher - gostam de controle');
      tips.push('❌ Evite detalhes excessivos ou histórias longas');
      break;
    case 'I':
      tips.push('😊 Comece com conversa leve e conexão pessoal');
      tips.push('🌟 Use entusiasmo e energia na comunicação');
      tips.push('👥 Mencione pessoas conhecidas e casos de sucesso');
      tips.push('❌ Evite ser muito formal ou técnico');
      break;
    case 'S':
      tips.push('🤝 Construa confiança antes de vender');
      tips.push('🛡️ Enfatize segurança, garantias e suporte');
      tips.push('⏰ Dê tempo para pensar - não pressione');
      tips.push('❌ Evite mudanças bruscas ou urgência artificial');
      break;
    case 'C':
      tips.push('📋 Prepare dados detalhados e documentação');
      tips.push('🔬 Use lógica e justificativas técnicas');
      tips.push('📧 Prefira comunicação escrita para referência');
      tips.push('❌ Evite generalizações ou promessas vagas');
      break;
  }
  
  // Dicas por estágio
  switch (stage) {
    case 'negotiation':
      tips.push('💰 Momento de apresentar condições especiais');
      tips.push('⏳ Use escassez e urgência com moderação');
      break;
    case 'at_risk':
      tips.push('❤️ Priorize reconexão emocional antes de vender');
      tips.push('🎁 Ofereça algo de valor sem pedir nada em troca');
      break;
    case 'prospect':
      tips.push('👂 Foque em entender as dores antes de apresentar soluções');
      tips.push('🎓 Posicione-se como autoridade e referência');
      break;
  }
  
  // Dicas baseadas em comportamento específico
  if (contact.behavior?.decisionSpeed === 'slow') {
    tips.push('⏰ Cliente decide devagar - não apresse o processo');
  }
  if (contact.behavior?.needsApproval) {
    tips.push('👥 Precisa de aprovação - identifique os outros decisores');
  }
  if (contact.behavior?.decisionCriteria?.includes('price')) {
    tips.push('💵 Preço é critério importante - prepare argumentos de valor/ROI');
  }
  
  return tips.slice(0, 6); // Máximo 6 dicas
}
