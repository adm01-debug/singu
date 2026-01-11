import { useMemo } from 'react';
import { SimulationResult, NegotiationScenario, NegotiationPath } from '@/types/nlp-advanced';
import { Contact, DISCProfile } from '@/types';
import { OBJECTION_PATTERNS } from '@/data/nlpAdvancedData';

export function useNegotiationSimulator(contact: Contact) {
  const simulationResult = useMemo((): SimulationResult => {
    const behavior = contact.behavior as any;
    const discProfile = (behavior?.discProfile as DISCProfile) || 'D';
    const motivationDirection = behavior?.metaprogramProfile?.motivationDirection || 'toward';
    const firstName = contact.firstName;

    // Generate scenarios based on profile
    const scenarios: NegotiationScenario[] = [
      {
        id: 'scenario-price',
        name: 'Objeção de Preço',
        description: `${firstName} questiona o valor do investimento`,
        clientReaction: discProfile === 'D' 
          ? '"Isso tá muito caro. Qual o melhor preço que você pode fazer?"'
          : discProfile === 'C'
          ? '"Preciso analisar o custo-benefício. Tem planilha de ROI?"'
          : '"Hmm, não sei se cabe no orçamento agora..."',
        probability: 70,
        bestResponse: motivationDirection === 'toward'
          ? `"${firstName}, entendo. Mas pensa no que você vai CONQUISTAR: [benefício]. Em X meses isso se paga."`
          : `"${firstName}, entendo. Mas pensa no quanto você está PERDENDO sem isso: [problema]. É isso que você quer evitar?"`,
        alternativeResponses: [
          'Divida o valor pelo período: "Por dia, são apenas R$ X..."',
          'Compare com o custo de não agir: "Cada mês sem isso custa..."',
          'Ofereça opções de parcelamento ou pacotes'
        ],
        nextScenarios: ['scenario-timing', 'scenario-authority']
      },
      {
        id: 'scenario-timing',
        name: 'Objeção de Timing',
        description: `${firstName} diz que não é o momento certo`,
        clientReaction: discProfile === 'S'
          ? '"Preciso pensar melhor. Deixa eu analisar com calma..."'
          : '"Estamos no meio de outro projeto. Talvez no próximo trimestre..."',
        probability: 60,
        bestResponse: `"${firstName}, entendo perfeitamente. ${discProfile === 'S' 
          ? 'Sem pressa. Mas deixa eu te perguntar: o que precisa acontecer para ser o momento certo?'
          : 'Só quero ter certeza: você está adiando porque não vê valor ou porque realmente há um impedimento?'}"`,
        alternativeResponses: [
          'Mostre o custo de esperar com números concretos',
          'Ofereça um início gradual ou piloto',
          'Crie urgência legítima se houver'
        ],
        nextScenarios: ['scenario-need', 'scenario-competition']
      },
      {
        id: 'scenario-authority',
        name: 'Não Decide Sozinho',
        description: `${firstName} precisa consultar outras pessoas`,
        clientReaction: '"Preciso falar com meu sócio/chefe/equipe sobre isso..."',
        probability: 50,
        bestResponse: `"${firstName}, faz total sentido. ${discProfile === 'D' 
          ? 'Posso participar dessa conversa para responder dúvidas diretamente?'
          : 'O que você acha que essa pessoa vai querer saber? Posso preparar algo específico.'}"`,
        alternativeResponses: [
          'Prepare material para o cliente "vender" internamente',
          'Descubra os critérios do decisor real',
          'Ofereça reunião com todos os envolvidos'
        ],
        nextScenarios: ['scenario-price', 'scenario-trust']
      },
      {
        id: 'scenario-need',
        name: 'Questionando a Necessidade',
        description: `${firstName} não vê necessidade clara`,
        clientReaction: '"Estamos bem assim. Não sei se precisamos disso..."',
        probability: 40,
        bestResponse: `"${firstName}, ${motivationDirection === 'toward'
          ? 'vocês estão bem, mas poderiam estar AINDA melhor. O que você está deixando de conquistar?'
          : 'vocês estão bem AGORA. Mas o que acontece se [cenário de risco]?'}"`,
        alternativeResponses: [
          'Mostre o que clientes similares não viam e passaram a ver',
          'Quantifique as perdas invisíveis',
          'Ofereça diagnóstico gratuito'
        ],
        nextScenarios: ['scenario-competition', 'scenario-timing']
      },
      {
        id: 'scenario-trust',
        name: 'Falta de Confiança',
        description: `${firstName} não conhece ou não confia`,
        clientReaction: '"Nunca ouvi falar de vocês. Como sei que funciona?"',
        probability: 35,
        bestResponse: `"${firstName}, essa é uma pergunta justa. ${behavior?.metaprogramProfile?.referenceFrame === 'external'
          ? 'Posso te conectar com clientes que tinham a mesma dúvida. Quer falar com alguém do seu setor?'
          : 'O que te faria confiar? Que tipo de garantia você precisa?'}"`,
        alternativeResponses: [
          'Apresente cases e depoimentos relevantes',
          'Ofereça garantia estendida ou trial',
          'Mostre tempo de mercado e resultados'
        ],
        nextScenarios: ['scenario-price', 'scenario-need']
      },
      {
        id: 'scenario-competition',
        name: 'Comparando com Concorrência',
        description: `${firstName} menciona alternativas`,
        clientReaction: '"Estou vendo outras opções. O concorrente X oferece por menos..."',
        probability: 45,
        bestResponse: `"${firstName}, fico feliz que você esteja pesquisando. ${discProfile === 'C'
          ? 'Posso te mostrar uma comparação detalhada?'
          : 'Qual o critério mais importante para você? Preço ou [diferencial seu]?'}"`,
        alternativeResponses: [
          'Destaque diferenciais únicos que só você tem',
          'Mostre custos ocultos da concorrência',
          'Foque em relacionamento e suporte superior'
        ],
        nextScenarios: ['scenario-price', 'scenario-authority']
      }
    ];

    // Generate optimal path based on profile
    const optimalPath: NegotiationPath = {
      approach: discProfile === 'D' 
        ? 'Abordagem Direta: Vá ao ponto, foque em resultados, minimize conversa fiada'
        : discProfile === 'I'
        ? 'Abordagem Entusiasta: Crie energia, conte histórias, mantenha leveza'
        : discProfile === 'S'
        ? 'Abordagem Segura: Vá devagar, construa confiança, elimine riscos'
        : 'Abordagem Analítica: Apresente dados, seja preciso, responda dúvidas',
      predictedReactions: [
        {
          reaction: scenarios[0].clientReaction,
          probability: scenarios[0].probability,
          counterStrategy: scenarios[0].bestResponse
        },
        {
          reaction: scenarios[1].clientReaction,
          probability: scenarios[1].probability,
          counterStrategy: scenarios[1].bestResponse
        }
      ],
      successProbability: behavior?.discConfidence || 65,
      riskLevel: 'medium',
      recommendedSequence: [
        '1. Rapport forte (2-3 min)',
        '2. Descoberta profunda (10-15 min)',
        '3. Apresentação conectada às dores (10 min)',
        '4. Tratamento proativo de objeções',
        '5. Fechamento adaptado ao perfil'
      ]
    };

    // Alternative paths
    const alternativePaths: NegotiationPath[] = [
      {
        approach: 'Caminho Consultivo: Foque em diagnóstico antes de apresentar solução',
        predictedReactions: [
          { reaction: 'Cliente se abre mais', probability: 70, counterStrategy: 'Aprofunde com perguntas' }
        ],
        successProbability: 60,
        riskLevel: 'low',
        recommendedSequence: ['Diagnóstico', 'Educação', 'Recomendação', 'Decisão']
      },
      {
        approach: 'Caminho de Urgência: Crie senso de urgência legítima',
        predictedReactions: [
          { reaction: 'Cliente pode resistir ou acelerar', probability: 50, counterStrategy: 'Use escassez real' }
        ],
        successProbability: 55,
        riskLevel: 'high',
        recommendedSequence: ['Contexto de mercado', 'Oportunidade limitada', 'Call to action']
      }
    ];

    // Closing strategies
    const closingStrategies = [
      {
        strategy: 'Fechamento Alternativo',
        effectiveness: discProfile === 'D' ? 90 : 70,
        script: `"${firstName}, você prefere [Opção A] ou [Opção B]?"`
      },
      {
        strategy: 'Fechamento por Assumção',
        effectiveness: discProfile === 'I' ? 85 : 65,
        script: `"${firstName}, vou preparar o contrato. Pode enviar os dados para faturamento?"`
      },
      {
        strategy: 'Fechamento por Resumo',
        effectiveness: discProfile === 'C' ? 90 : 75,
        script: `"${firstName}, recapitulando: você quer [X], [Y] e [Z]. Com nossa solução você terá tudo isso. Fechamos?"`
      },
      {
        strategy: 'Fechamento por Urgência',
        effectiveness: discProfile === 'D' ? 80 : 50,
        script: `"${firstName}, essa condição vale só até [data]. Vamos garantir?"`
      },
      {
        strategy: 'Fechamento Suave',
        effectiveness: discProfile === 'S' ? 90 : 60,
        script: `"${firstName}, quando você se sentir pronto, estou aqui. Mas se quiser começar com algo pequeno..."`
      }
    ];

    return {
      scenarios: scenarios.sort((a, b) => b.probability - a.probability),
      optimalPath,
      alternativePaths,
      anticipatedObjections: scenarios.map(s => s.name),
      closingStrategies: closingStrategies.sort((a, b) => b.effectiveness - a.effectiveness)
    };
  }, [contact]);

  return { simulationResult };
}
