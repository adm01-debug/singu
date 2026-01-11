import { useMemo } from 'react';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKProfile, VAK_LABELS } from '@/types/vak';
import { MetaprogramProfile, METAPROGRAM_LABELS } from '@/types/metaprograms';
import { EQAnalysisResult } from '@/types/emotional-intelligence';
import { BiasAnalysisResult } from '@/types/cognitive-biases';

export interface ApproachPhase {
  id: string;
  name: string;
  priority: number;
  actions: string[];
  techniques: string[];
  scripts: string[];
  warnings: string[];
  timing: string;
  duration: string;
  successIndicators: string[];
}

export interface CommunicationChannel {
  channel: string;
  effectiveness: number;
  reason: string;
  bestTimeSlot: string;
  tips: string[];
}

export interface PersonalizedMessage {
  context: string;
  message: string;
  tone: string;
  keyPhrases: string[];
}

export interface ApproachRecommendation {
  overallStrategy: {
    name: string;
    description: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedSuccessRate: number;
  };
  phases: ApproachPhase[];
  channels: CommunicationChannel[];
  personalizedMessages: PersonalizedMessage[];
  doAndDont: {
    do: string[];
    dont: string[];
  };
  objectionHandling: {
    objection: string;
    response: string;
    technique: string;
  }[];
  closingTechniques: {
    technique: string;
    script: string;
    effectiveness: number;
    bestFor: string;
  }[];
  urgencyTriggers: string[];
  trustBuilders: string[];
  decisionAccelerators: string[];
  keyMetrics: {
    name: string;
    value: string;
    impact: string;
  }[];
}

interface UseApproachRecommendationProps {
  contact: Contact;
  vakProfile?: VAKProfile | null;
  metaprogramProfile?: MetaprogramProfile | null;
  eqResult?: EQAnalysisResult;
  biasResult?: BiasAnalysisResult;
  emotionalState?: string | null;
  topValues?: { name: string; importance?: number }[];
  activeTriggers?: { trigger: { id: string; name: string } }[];
  hiddenObjections?: { objection_type: string; indicator: string; suggested_probe?: string }[];
  rapportScore?: number;
}

export function useApproachRecommendation({
  contact,
  vakProfile,
  metaprogramProfile,
  eqResult,
  biasResult,
  emotionalState,
  topValues = [],
  activeTriggers = [],
  hiddenObjections = [],
  rapportScore = 0,
}: UseApproachRecommendationProps): ApproachRecommendation {
  return useMemo(() => {
    const discProfile = contact.behavior?.discProfile as DISCProfile | undefined;
    const discConfidence = contact.behavior?.discConfidence || 50;
    const vakType = vakProfile?.primary;
    const vakConfidence = vakProfile?.confidence || 50;
    const metaConfidence = metaprogramProfile?.overallConfidence || 50;

    // Calculate overall confidence
    const confidenceFactors = [
      discConfidence,
      vakConfidence,
      metaConfidence,
      eqResult?.confidence || 0,
      biasResult?.confidence || 0,
    ].filter(c => c > 0);
    
    const overallConfidence = confidenceFactors.length > 0
      ? Math.round(confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length)
      : 30;

    // Determine primary strategy based on DISC + Metaprograms
    const getStrategyName = (): string => {
      if (!discProfile) return 'Abordagem Adaptativa';
      
      if (discProfile === 'D') {
        return metaprogramProfile?.motivationDirection === 'toward' 
          ? 'Conquista Direta' 
          : 'Proteção de Resultados';
      }
      if (discProfile === 'I') {
        return metaprogramProfile?.referenceFrame === 'external'
          ? 'Conexão Social'
          : 'Visão Inspiradora';
      }
      if (discProfile === 'S') {
        return metaprogramProfile?.motivationDirection === 'away_from'
          ? 'Segurança Garantida'
          : 'Parceria Estável';
      }
      if (discProfile === 'C') {
        return metaprogramProfile?.decisionStyle === 'procedures'
          ? 'Processo Estruturado'
          : 'Análise Profunda';
      }
      
      return 'Abordagem Equilibrada';
    };

    const getStrategyDescription = (): string => {
      const base = DISC_LABELS[discProfile || 'D']?.description || '';
      const vak = vakType ? VAK_LABELS[vakType]?.description : '';
      const meta = metaprogramProfile?.motivationDirection === 'toward'
        ? 'Foque nos benefícios e ganhos.'
        : 'Destaque os riscos que serão evitados.';
      
      return `${base} ${vak} ${meta}`.trim();
    };

    // Calculate risk and success rate
    const calculateRiskLevel = (): 'low' | 'medium' | 'high' => {
      let riskScore = 0;
      
      if (hiddenObjections.length > 2) riskScore += 30;
      else if (hiddenObjections.length > 0) riskScore += 15;
      
      if (biasResult && biasResult.biasProfile.resistances.length > 2) riskScore += 25;
      
      if (contact.sentiment === 'negative') riskScore += 25;
      else if (contact.sentiment === 'neutral') riskScore += 10;
      
      if (rapportScore < 30) riskScore += 20;
      else if (rapportScore < 50) riskScore += 10;
      
      if (overallConfidence < 40) riskScore += 15;
      
      if (riskScore >= 50) return 'high';
      if (riskScore >= 25) return 'medium';
      return 'low';
    };

    const calculateSuccessRate = (): number => {
      let rate = 50;
      
      // Positive factors
      if (overallConfidence > 70) rate += 15;
      else if (overallConfidence > 50) rate += 8;
      
      if (rapportScore > 70) rate += 12;
      else if (rapportScore > 50) rate += 6;
      
      if (contact.sentiment === 'positive') rate += 10;
      if (contact.relationshipScore && contact.relationshipScore > 70) rate += 8;
      
      if (activeTriggers.length > 2) rate += 8;
      if (topValues.length > 2) rate += 5;
      
      // Negative factors
      if (hiddenObjections.length > 2) rate -= 15;
      else if (hiddenObjections.length > 0) rate -= 8;
      
      if (contact.sentiment === 'negative') rate -= 15;
      if (biasResult && biasResult.biasProfile.resistances.length > 2) rate -= 10;
      
      return Math.max(15, Math.min(95, rate));
    };

    // Generate phases
    const generatePhases = (): ApproachPhase[] => {
      const phases: ApproachPhase[] = [];
      
      // Phase 1: Rapport Building
      const rapportActions: string[] = [];
      const rapportTechniques: string[] = [];
      const rapportScripts: string[] = [];
      
      if (vakType === 'V') {
        rapportActions.push('Compartilhe conteúdo visual relevante');
        rapportTechniques.push('Espelhamento visual');
        rapportScripts.push('Quero mostrar algo que vai te interessar...');
      } else if (vakType === 'A') {
        rapportActions.push('Agende uma ligação de alinhamento');
        rapportTechniques.push('Tom de voz harmonioso');
        rapportScripts.push('Gostaria de ouvir sua opinião sobre...');
      } else if (vakType === 'K') {
        rapportActions.push('Demonstre empatia genuína');
        rapportTechniques.push('Conexão emocional');
        rapportScripts.push('Entendo como você se sente em relação a...');
      } else {
        rapportActions.push('Apresente dados e análises');
        rapportTechniques.push('Credibilidade lógica');
        rapportScripts.push('Analisando os dados, percebi que...');
      }
      
      if (topValues.length > 0) {
        rapportActions.push(`Mencione ${topValues[0]?.name || 'valores identificados'}`);
      }
      
      phases.push({
        id: 'rapport',
        name: 'Construção de Rapport',
        priority: 1,
        actions: rapportActions,
        techniques: rapportTechniques,
        scripts: rapportScripts,
        warnings: rapportScore < 40 ? ['Relacionamento ainda em desenvolvimento'] : [],
        timing: 'Início da conversa',
        duration: '3-5 minutos',
        successIndicators: ['Resposta positiva', 'Engajamento verbal', 'Perguntas do cliente'],
      });

      // Phase 2: Discovery
      const discoveryActions: string[] = [];
      const discoveryScripts: string[] = [];
      
      if (metaprogramProfile?.motivationDirection === 'toward') {
        discoveryActions.push('Explore metas e objetivos');
        discoveryScripts.push('O que você espera alcançar com isso?');
      } else {
        discoveryActions.push('Identifique dores e problemas');
        discoveryScripts.push('O que mais te preocupa nessa situação?');
      }
      
      if (metaprogramProfile?.referenceFrame === 'internal') {
        discoveryActions.push('Pergunte sobre sua experiência pessoal');
        discoveryScripts.push('Como você avalia isso baseado na sua experiência?');
      } else {
        discoveryActions.push('Mencione referências e cases');
        discoveryScripts.push('Empresas similares têm obtido resultados como...');
      }
      
      phases.push({
        id: 'discovery',
        name: 'Descoberta de Necessidades',
        priority: 2,
        actions: discoveryActions,
        techniques: ['Perguntas abertas', 'Escuta ativa', 'Parafrasear'],
        scripts: discoveryScripts,
        warnings: hiddenObjections.length > 0 ? ['Existem objeções ocultas - sonde delicadamente'] : [],
        timing: 'Após rapport estabelecido',
        duration: '5-10 minutos',
        successIndicators: ['Cliente compartilha desafios', 'Revela prioridades', 'Demonstra vulnerabilidade'],
      });

      // Phase 3: Value Presentation
      const presentationActions: string[] = [];
      const presentationScripts: string[] = [];
      
      if (discProfile === 'D') {
        presentationActions.push('Vá direto ao resultado');
        presentationScripts.push('O resultado que você terá é...');
      } else if (discProfile === 'I') {
        presentationActions.push('Conte histórias de sucesso');
        presentationScripts.push('Imagina o impacto quando você...');
      } else if (discProfile === 'S') {
        presentationActions.push('Mostre o passo a passo');
        presentationScripts.push('Vamos construir isso juntos, começando por...');
      } else if (discProfile === 'C') {
        presentationActions.push('Detalhe especificações técnicas');
        presentationScripts.push('Os dados mostram que...');
      }
      
      if (activeTriggers.length > 0) {
        presentationActions.push(`Use gatilho: ${activeTriggers[0]?.trigger.name}`);
      }
      
      phases.push({
        id: 'presentation',
        name: 'Apresentação de Valor',
        priority: 3,
        actions: presentationActions,
        techniques: ['Storytelling', 'Demonstração', 'Proof of concept'],
        scripts: presentationScripts,
        warnings: biasResult?.biasProfile.resistances.map(r => `Atenção ao viés: ${r}`) || [],
        timing: 'Após descoberta completa',
        duration: '10-15 minutos',
        successIndicators: ['Interesse visível', 'Perguntas específicas', 'Concordância com benefícios'],
      });

      // Phase 4: Objection Handling
      const objectionActions: string[] = [];
      
      hiddenObjections.forEach(obj => {
        objectionActions.push(`Sondar: ${obj.indicator}`);
        if (obj.suggested_probe) {
          objectionActions.push(obj.suggested_probe);
        }
      });
      
      if (objectionActions.length === 0) {
        objectionActions.push('Antecipe objeções comuns');
        objectionActions.push('Valide preocupações');
      }
      
      phases.push({
        id: 'objections',
        name: 'Tratamento de Objeções',
        priority: 4,
        actions: objectionActions,
        techniques: ['Sleight of Mouth', 'Reenquadramento', 'Prova social'],
        scripts: ['Entendo sua preocupação, e é exatamente por isso que...', 'Muitos clientes tinham a mesma dúvida antes de...'],
        warnings: hiddenObjections.length > 2 ? ['Múltiplas objeções ocultas detectadas'] : [],
        timing: 'Durante apresentação',
        duration: '5-10 minutos',
        successIndicators: ['Objeções verbalizadas', 'Cliente considera alternativas', 'Resistência diminui'],
      });

      // Phase 5: Closing
      const closingActions: string[] = [];
      const closingScripts: string[] = [];
      
      if (discProfile === 'D') {
        closingActions.push('Feche com decisão rápida');
        closingScripts.push('Podemos começar agora?');
      } else if (discProfile === 'I') {
        closingActions.push('Feche com entusiasmo compartilhado');
        closingScripts.push('Vai ser incrível! Quando começamos?');
      } else if (discProfile === 'S') {
        closingActions.push('Feche com garantias');
        closingScripts.push('Estou aqui para te apoiar em cada etapa.');
      } else if (discProfile === 'C') {
        closingActions.push('Feche com resumo lógico');
        closingScripts.push('Analisando tudo, faz sentido prosseguirmos.');
      }
      
      phases.push({
        id: 'closing',
        name: 'Fechamento',
        priority: 5,
        actions: closingActions,
        techniques: ['Fechamento alternativo', 'Fechamento assumido', 'Urgência legítima'],
        scripts: closingScripts,
        warnings: calculateRiskLevel() === 'high' ? ['Alto risco - considere múltiplos fechamentos'] : [],
        timing: 'Final da conversa',
        duration: '3-5 minutos',
        successIndicators: ['Acordo verbal', 'Próximos passos definidos', 'Compromisso assumido'],
      });
      
      return phases;
    };

    // Generate channel recommendations
    const generateChannels = (): CommunicationChannel[] => {
      const channels: CommunicationChannel[] = [];
      const bestWindow = contact.behavior?.bestContactWindow || 'Manhã';
      
      if (vakType === 'A' || discProfile === 'I') {
        channels.push({
          channel: 'Ligação telefônica',
          effectiveness: 90,
          reason: 'Perfil auditivo/influente valoriza comunicação verbal',
          bestTimeSlot: bestWindow,
          tips: ['Varie o tom de voz', 'Use pausas estratégicas', 'Demonstre entusiasmo'],
        });
      }
      
      if (vakType === 'V' || discProfile === 'C') {
        channels.push({
          channel: 'E-mail detalhado',
          effectiveness: 85,
          reason: 'Perfil visual/analítico prefere conteúdo estruturado',
          bestTimeSlot: 'Início da manhã',
          tips: ['Use bullet points', 'Inclua gráficos', 'Forneça anexos detalhados'],
        });
      }
      
      if (discProfile === 'D') {
        channels.push({
          channel: 'Mensagem direta (WhatsApp)',
          effectiveness: 88,
          reason: 'Perfil dominante prefere comunicação rápida e direta',
          bestTimeSlot: bestWindow,
          tips: ['Seja conciso', 'Vá direto ao ponto', 'Evite rodeios'],
        });
      }
      
      if (vakType === 'K' || discProfile === 'S') {
        channels.push({
          channel: 'Reunião presencial',
          effectiveness: 92,
          reason: 'Perfil cinestésico/estável valoriza conexão pessoal',
          bestTimeSlot: 'Meio da manhã ou tarde',
          tips: ['Crie ambiente acolhedor', 'Demonstre calma', 'Permita tempo para processar'],
        });
      }
      
      // Add video call as universal option
      channels.push({
        channel: 'Videochamada',
        effectiveness: 75,
        reason: 'Combina elementos visuais e verbais',
        bestTimeSlot: bestWindow,
        tips: ['Cuide do ambiente', 'Mantenha contato visual', 'Use recursos de tela compartilhada'],
      });
      
      return channels.sort((a, b) => b.effectiveness - a.effectiveness);
    };

    // Generate personalized messages
    const generateMessages = (): PersonalizedMessage[] => {
      const messages: PersonalizedMessage[] = [];
      const firstName = contact.firstName;
      
      // Opening message
      if (discProfile === 'D') {
        messages.push({
          context: 'Abertura',
          message: `${firstName}, tenho algo que pode acelerar seus resultados. Posso te mostrar em 5 minutos?`,
          tone: 'Direto e objetivo',
          keyPhrases: ['resultados', 'acelerar', 'rápido'],
        });
      } else if (discProfile === 'I') {
        messages.push({
          context: 'Abertura',
          message: `${firstName}! Lembrei de você quando vi isso - acho que vai adorar!`,
          tone: 'Entusiasta e pessoal',
          keyPhrases: ['adorar', 'incrível', 'você'],
        });
      } else if (discProfile === 'S') {
        messages.push({
          context: 'Abertura',
          message: `Olá ${firstName}, espero que esteja tudo bem. Gostaria de compartilhar algo que pode te ajudar.`,
          tone: 'Caloroso e tranquilizador',
          keyPhrases: ['ajudar', 'tranquilo', 'juntos'],
        });
      } else if (discProfile === 'C') {
        messages.push({
          context: 'Abertura',
          message: `${firstName}, preparei uma análise detalhada que acredito ser relevante para sua situação.`,
          tone: 'Preciso e fundamentado',
          keyPhrases: ['análise', 'dados', 'detalhado'],
        });
      } else {
        messages.push({
          context: 'Abertura',
          message: `Olá ${firstName}, gostaria de compartilhar algo interessante com você.`,
          tone: 'Neutro e profissional',
          keyPhrases: ['interessante', 'compartilhar'],
        });
      }

      // Follow-up message
      if (metaprogramProfile?.motivationDirection === 'toward') {
        messages.push({
          context: 'Follow-up',
          message: `${firstName}, pensando no que conversamos, isso pode te aproximar ainda mais do seu objetivo.`,
          tone: 'Motivacional',
          keyPhrases: ['objetivo', 'conquistar', 'alcançar'],
        });
      } else {
        messages.push({
          context: 'Follow-up',
          message: `${firstName}, lembrei da nossa conversa - isso pode evitar aquele problema que você mencionou.`,
          tone: 'Protetor',
          keyPhrases: ['evitar', 'proteger', 'prevenir'],
        });
      }

      // Closing message
      messages.push({
        context: 'Fechamento',
        message: discProfile === 'D' 
          ? `${firstName}, a oportunidade está aqui. Podemos fechar agora?`
          : discProfile === 'I'
          ? `${firstName}, vai ser demais! Estou animado para começarmos!`
          : discProfile === 'S'
          ? `${firstName}, estou aqui para qualquer dúvida. Quando pudermos seguir, me avisa.`
          : `${firstName}, os dados indicam que é o momento ideal. Faz sentido prosseguirmos?`,
        tone: discProfile ? DISC_LABELS[discProfile]?.name || 'Equilibrado' : 'Equilibrado',
        keyPhrases: discProfile === 'D' ? ['agora', 'fechar'] : 
                   discProfile === 'I' ? ['juntos', 'animado'] :
                   discProfile === 'S' ? ['aqui', 'apoio'] :
                   ['lógico', 'faz sentido'],
      });
      
      return messages;
    };

    // Generate do and don't
    const generateDoAndDont = (): { do: string[]; dont: string[] } => {
      const doList: string[] = [];
      const dontList: string[] = [];
      
      // DISC-based
      if (discProfile === 'D') {
        doList.push('Seja direto e objetivo');
        doList.push('Foque em resultados e ROI');
        doList.push('Respeite o tempo dele');
        dontList.push('Enrole ou seja vago');
        dontList.push('Fale demais sobre detalhes');
        dontList.push('Questione a autoridade dele');
      } else if (discProfile === 'I') {
        doList.push('Seja entusiasta e positivo');
        doList.push('Use histórias e exemplos');
        doList.push('Reconheça as ideias dele');
        dontList.push('Seja frio ou distante');
        dontList.push('Ignore o aspecto social');
        dontList.push('Foque só em dados');
      } else if (discProfile === 'S') {
        doList.push('Demonstre paciência');
        doList.push('Forneça garantias');
        doList.push('Construa confiança gradualmente');
        dontList.push('Pressione por decisões rápidas');
        dontList.push('Mude planos repentinamente');
        dontList.push('Seja impaciente');
      } else if (discProfile === 'C') {
        doList.push('Apresente dados e evidências');
        doList.push('Seja preciso e detalhado');
        doList.push('Dê tempo para análise');
        dontList.push('Seja superficial');
        dontList.push('Pressione emocionalmente');
        dontList.push('Ignore perguntas técnicas');
      }
      
      // VAK-based additions
      if (vakType === 'V') {
        doList.push('Use recursos visuais');
      } else if (vakType === 'A') {
        doList.push('Comunique-se verbalmente');
      } else if (vakType === 'K') {
        doList.push('Demonstre empatia física');
      }
      
      // Bias-based warnings
      if (biasResult?.biasProfile.resistances) {
        biasResult.biasProfile.resistances.slice(0, 2).forEach(r => {
          dontList.push(`Evite estratégias que ativem: ${r}`);
        });
      }
      
      return { do: doList, dont: dontList };
    };

    // Generate objection handling
    const generateObjectionHandling = (): { objection: string; response: string; technique: string }[] => {
      const handling: { objection: string; response: string; technique: string }[] = [];
      
      // Based on hidden objections
      hiddenObjections.slice(0, 3).forEach(obj => {
        let response = '';
        let technique = '';
        
        if (obj.objection_type === 'price') {
          response = 'Entendo a preocupação com investimento. Deixa eu te mostrar o retorno que outros clientes obtiveram...';
          technique = 'ROI e prova social';
        } else if (obj.objection_type === 'timing') {
          response = 'Faz sentido. O que acontece se esperarmos mais tempo?';
          technique = 'Custo da inação';
        } else if (obj.objection_type === 'authority') {
          response = 'Perfeito, quem mais precisa participar dessa decisão?';
          technique = 'Inclusão de stakeholders';
        } else if (obj.objection_type === 'need') {
          response = 'Me ajuda a entender melhor sua situação atual...';
          technique = 'Redescoberta';
        } else {
          response = 'Interessante ponto. Me conta mais sobre isso...';
          technique = 'Exploração aberta';
        }
        
        handling.push({
          objection: obj.indicator,
          response,
          technique,
        });
      });
      
      // Add common objections if none detected
      if (handling.length === 0) {
        handling.push({
          objection: 'Preciso pensar',
          response: 'Claro! O que especificamente você gostaria de avaliar melhor?',
          technique: 'Especificação',
        });
        handling.push({
          objection: 'Está caro',
          response: 'Entendo. Comparado com o custo de não resolver isso, faz sentido o investimento?',
          technique: 'Reframe de valor',
        });
      }
      
      return handling;
    };

    // Generate closing techniques
    const generateClosingTechniques = (): { technique: string; script: string; effectiveness: number; bestFor: string }[] => {
      const techniques: { technique: string; script: string; effectiveness: number; bestFor: string }[] = [];
      
      if (discProfile === 'D') {
        techniques.push({
          technique: 'Fechamento Direto',
          script: 'Podemos fechar agora e começar amanhã?',
          effectiveness: 90,
          bestFor: 'Perfil Dominante',
        });
        techniques.push({
          technique: 'Fechamento de Escassez',
          script: 'Tenho disponibilidade só até sexta. Fechamos?',
          effectiveness: 85,
          bestFor: 'Decisores rápidos',
        });
      } else if (discProfile === 'I') {
        techniques.push({
          technique: 'Fechamento Entusiasta',
          script: 'Vai ser incrível trabalhar juntos! Quando começamos?',
          effectiveness: 88,
          bestFor: 'Perfil Influente',
        });
        techniques.push({
          technique: 'Fechamento de Visão',
          script: 'Imagina quando você conquistar isso! Vamos lá?',
          effectiveness: 82,
          bestFor: 'Motivados por reconhecimento',
        });
      } else if (discProfile === 'S') {
        techniques.push({
          technique: 'Fechamento de Segurança',
          script: 'Estarei aqui em cada etapa. Podemos começar devagar?',
          effectiveness: 86,
          bestFor: 'Perfil Estável',
        });
        techniques.push({
          technique: 'Fechamento de Garantia',
          script: 'Se não funcionar, voltamos atrás. Quer experimentar?',
          effectiveness: 80,
          bestFor: 'Avessos a risco',
        });
      } else if (discProfile === 'C') {
        techniques.push({
          technique: 'Fechamento Lógico',
          script: 'Analisando os dados, faz sentido seguirmos. Concorda?',
          effectiveness: 88,
          bestFor: 'Perfil Analítico',
        });
        techniques.push({
          technique: 'Fechamento de Resumo',
          script: 'Resumindo: [benefícios]. Os números indicam que é o momento.',
          effectiveness: 85,
          bestFor: 'Decisores racionais',
        });
      }
      
      // Universal techniques
      techniques.push({
        technique: 'Fechamento Alternativo',
        script: 'Você prefere começar segunda ou quarta?',
        effectiveness: 75,
        bestFor: 'Universal',
      });
      
      return techniques.sort((a, b) => b.effectiveness - a.effectiveness);
    };

    // Generate urgency triggers
    const generateUrgencyTriggers = (): string[] => {
      const triggers: string[] = [];
      
      if (metaprogramProfile?.motivationDirection === 'toward') {
        triggers.push('Destaque oportunidade limitada');
        triggers.push('Mostre early adopters obtendo resultados');
      } else {
        triggers.push('Destaque riscos de esperar');
        triggers.push('Mostre custo da inação');
      }
      
      if (discProfile === 'D') {
        triggers.push('Competidores já estão usando');
      } else if (discProfile === 'I') {
        triggers.push('Outros estão falando sobre isso');
      }
      
      triggers.push('Preço promocional por tempo limitado');
      triggers.push('Disponibilidade reduzida');
      
      return triggers;
    };

    // Generate trust builders
    const generateTrustBuilders = (): string[] => {
      const builders: string[] = [];
      
      if (metaprogramProfile?.referenceFrame === 'external') {
        builders.push('Apresente depoimentos de clientes');
        builders.push('Mostre logos de empresas conhecidas');
        builders.push('Cite estatísticas de mercado');
      } else {
        builders.push('Respeite a experiência dele');
        builders.push('Pergunte sua opinião antes de sugerir');
        builders.push('Valide intuições dele');
      }
      
      if (eqResult?.strengths?.includes('empathy')) {
        builders.push('Demonstre compreensão genuína');
      }
      
      builders.push('Seja transparente sobre limitações');
      builders.push('Cumpra promessas pequenas primeiro');
      
      return builders;
    };

    // Generate decision accelerators
    const generateDecisionAccelerators = (): string[] => {
      const accelerators: string[] = [];
      
      if (discProfile === 'D') {
        accelerators.push('Elimine burocracia');
        accelerators.push('Ofereça decisão imediata');
      } else if (discProfile === 'I') {
        accelerators.push('Torne divertido e social');
        accelerators.push('Envolva pessoas importantes');
      } else if (discProfile === 'S') {
        accelerators.push('Ofereça período de teste');
        accelerators.push('Garanta suporte contínuo');
      } else if (discProfile === 'C') {
        accelerators.push('Forneça documentação completa');
        accelerators.push('Dê tempo, mas defina deadline');
      }
      
      if (activeTriggers.some(t => t.trigger.name.toLowerCase().includes('urgência'))) {
        accelerators.push('Use escassez legítima');
      }
      
      accelerators.push('Simplifique a primeira ação');
      
      return accelerators;
    };

    // Key metrics
    const keyMetrics: { name: string; value: string; impact: string }[] = [
      {
        name: 'Confiança do Perfil',
        value: `${overallConfidence}%`,
        impact: overallConfidence > 70 ? 'Alta precisão' : overallConfidence > 50 ? 'Precisão moderada' : 'Dados limitados',
      },
      {
        name: 'Score de Rapport',
        value: `${rapportScore}%`,
        impact: rapportScore > 70 ? 'Conexão forte' : rapportScore > 40 ? 'Em desenvolvimento' : 'Precisa atenção',
      },
      {
        name: 'Objeções Ocultas',
        value: `${hiddenObjections.length}`,
        impact: hiddenObjections.length > 2 ? 'Alto risco' : hiddenObjections.length > 0 ? 'Atenção necessária' : 'Caminho livre',
      },
      {
        name: 'Gatilhos Ativos',
        value: `${activeTriggers.length}`,
        impact: activeTriggers.length > 2 ? 'Múltiplas oportunidades' : activeTriggers.length > 0 ? 'Opções disponíveis' : 'Descoberta necessária',
      },
    ];

    return {
      overallStrategy: {
        name: getStrategyName(),
        description: getStrategyDescription(),
        confidence: overallConfidence,
        riskLevel: calculateRiskLevel(),
        estimatedSuccessRate: calculateSuccessRate(),
      },
      phases: generatePhases(),
      channels: generateChannels(),
      personalizedMessages: generateMessages(),
      doAndDont: generateDoAndDont(),
      objectionHandling: generateObjectionHandling(),
      closingTechniques: generateClosingTechniques(),
      urgencyTriggers: generateUrgencyTriggers(),
      trustBuilders: generateTrustBuilders(),
      decisionAccelerators: generateDecisionAccelerators(),
      keyMetrics,
    };
  }, [
    contact,
    vakProfile,
    metaprogramProfile,
    eqResult,
    biasResult,
    emotionalState,
    topValues,
    activeTriggers,
    hiddenObjections,
    rapportScore,
  ]);
}
