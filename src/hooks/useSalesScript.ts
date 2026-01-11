import { useMemo } from 'react';
import { PersonalizedScript, ScriptSection, SalesStage } from '@/types/nlp-advanced';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { SALES_STAGE_INFO, POWER_WORDS } from '@/data/nlpAdvancedData';

export function useSalesScript(contact: Contact) {
  const personalizedScript = useMemo((): PersonalizedScript => {
    const behavior = contact.behavior as any;
    const vakType = (behavior?.vakProfile?.primary as VAKType) || 'V';
    const discProfile = (behavior?.discProfile as DISCProfile) || 'D';
    const motivationDirection = behavior?.metaprogramProfile?.motivationDirection || 'toward';
    const referenceFrame = behavior?.metaprogramProfile?.referenceFrame || 'external';
    const workingStyle = behavior?.metaprogramProfile?.workingStyle || 'options';

    const firstName = contact.firstName;

    // Power words for this profile
    const powerWords = [
      ...(POWER_WORDS.vak[vakType] || []),
      ...(POWER_WORDS.disc[discProfile] || []),
      ...(POWER_WORDS.metaprograms[motivationDirection] || [])
    ];

    // Words to avoid
    const wordsToAvoid = vakType === 'V' 
      ? ['ouvir', 'sentir', 'escutar', 'tocar']
      : vakType === 'A'
      ? ['ver', 'olhar', 'visualizar', 'imagem']
      : vakType === 'K'
      ? ['ver', 'ouvir', 'analisar', 'dados']
      : ['sentir', 'imaginar', 'intuição', 'emoção'];

    // Generate script sections
    const sections: ScriptSection[] = [
      {
        stage: 'rapport',
        title: '1. Construindo Conexão',
        objective: 'Criar confiança e sintonia inicial',
        script: discProfile === 'D'
          ? `"${firstName}, vou direto ao ponto. Sei que seu tempo é valioso. Tenho algo que pode impactar diretamente seus resultados."`
          : discProfile === 'I'
          ? `"${firstName}! Que bom finalmente conversarmos! Estou animado para compartilhar algo incrível com você!"`
          : discProfile === 'S'
          ? `"${firstName}, espero que esteja bem. Quero que se sinta à vontade. Vamos conversar sem pressa."`
          : `"${firstName}, preparei uma análise detalhada especificamente para sua situação. Posso compartilhar os dados?"`,
        magicWords: powerWords.slice(0, 5),
        anchorPhrases: [
          vakType === 'V' ? 'Deixa eu te mostrar...' : vakType === 'A' ? 'Escuta só...' : 'Sente essa...',
          discProfile === 'D' ? 'O resultado é...' : 'O interessante é que...'
        ],
        transitionTo: 'Perfeito, então deixa eu entender melhor sua situação...',
        warningSignals: ['respostas monossilábicas', 'distrações', 'olhar no relógio'],
        adaptations: {
          ifPositive: 'Avance para descoberta rapidamente',
          ifNegative: 'Faça mais perguntas pessoais, construa mais rapport',
          ifNeutral: 'Tente uma abordagem diferente baseada em interesses'
        },
        estimatedDuration: '2-3 min'
      },
      {
        stage: 'discovery',
        title: '2. Descobrindo Necessidades',
        objective: 'Entender dores, desejos e critérios de decisão',
        script: `"${firstName}, para eu ${vakType === 'V' ? 'te mostrar' : vakType === 'A' ? 'te explicar' : 'te ajudar com'} a melhor solução, preciso entender algumas coisas...

${motivationDirection === 'toward' 
  ? '• O que você quer ALCANÇAR nos próximos meses?'
  : '• Qual problema você precisa RESOLVER urgentemente?'}

• ${referenceFrame === 'internal' 
  ? 'Na sua avaliação, o que faria diferença?'
  : 'O que seu mercado/equipe tem demandado?'}

• ${workingStyle === 'options'
  ? 'Que tipo de flexibilidade você busca?'
  : 'Qual processo você gostaria de seguir?'}"`,
        magicWords: ['me conta', 'me ajuda a entender', 'o que mais importa'],
        anchorPhrases: [
          motivationDirection === 'toward' ? 'E quando você alcançar isso...' : 'E quando resolver isso...',
          'O que muda na sua vida quando...'
        ],
        transitionTo: 'Entendi perfeitamente. Baseado no que você me disse...',
        warningSignals: ['respostas vagas', 'não sabe explicar a dor', 'muda de assunto'],
        adaptations: {
          ifPositive: 'Aprofunde na dor principal descoberta',
          ifNegative: 'Faça perguntas mais abertas e emocionais',
          ifNeutral: 'Use exemplos de outros clientes para gerar identificação'
        },
        estimatedDuration: '10-15 min'
      },
      {
        stage: 'presentation',
        title: '3. Apresentando a Solução',
        objective: 'Conectar benefícios às necessidades descobertas',
        script: `"${firstName}, baseado em tudo que você me ${vakType === 'A' ? 'contou' : 'mostrou'}, ${vakType === 'V' ? 'veja como' : vakType === 'A' ? 'ouça como' : 'sinta como'} [SOLUÇÃO] ${motivationDirection === 'toward' ? 'vai te ajudar a alcançar' : 'vai resolver'} [PROBLEMA DESCOBERTO].

${referenceFrame === 'external' 
  ? '• Clientes como a [EMPRESA REFERÊNCIA] conseguiram [RESULTADO ESPECÍFICO]'
  : '• Você vai perceber rapidamente que [BENEFÍCIO] faz sentido para você'}

${discProfile === 'D' ? 'O resultado é: [NÚMERO/RESULTADO CONCRETO]' :
  discProfile === 'I' ? 'O mais incrível é: [BENEFÍCIO EMOCIONAL]' :
  discProfile === 'S' ? 'E você terá todo suporte para: [SEGURANÇA]' :
  'Os dados mostram: [ESTATÍSTICA/PROVA]'}"`,
        magicWords: powerWords.slice(0, 8),
        anchorPhrases: [
          `${firstName}, ${vakType === 'V' ? 'visualiza' : vakType === 'A' ? 'imagina' : 'sente'} isso funcionando...`,
          'E sabe o melhor?'
        ],
        transitionTo: 'Faz sentido para você? Alguma dúvida até aqui?',
        warningSignals: ['olhar duvidoso', 'braços cruzados', 'perguntas sobre alternativas'],
        adaptations: {
          ifPositive: 'Peça um micro-compromisso: "Isso resolve seu problema?"',
          ifNegative: 'Pergunte: "O que não ficou claro?"',
          ifNeutral: 'Adicione mais prova social ou demonstração prática'
        },
        estimatedDuration: '10-20 min'
      },
      {
        stage: 'objection_handling',
        title: '4. Tratando Objeções',
        objective: 'Resolver dúvidas e resistências com elegância',
        script: `"${firstName}, entendo sua preocupação sobre [OBJEÇÃO]. É uma dúvida válida.

${discProfile === 'D' ? 'Vou ser direto:' : 'Deixa eu te explicar melhor:'}

[RESPOSTA USANDO SLEIGHT OF MOUTH APROPRIADO]

${referenceFrame === 'external' 
  ? 'Inclusive, [CLIENTE REFERÊNCIA] tinha a mesma dúvida e depois [RESULTADO].'
  : 'Na sua análise, isso faz sentido?'}"`,
        magicWords: ['entendo', 'faz sentido', 'justamente por isso'],
        anchorPhrases: [
          'E é exatamente por isso que...',
          'Na verdade, isso é um ponto positivo porque...'
        ],
        transitionTo: 'Essa era sua única preocupação ou tem algo mais?',
        warningSignals: ['repetição da mesma objeção', 'novas objeções surgindo', 'tom defensivo'],
        adaptations: {
          ifPositive: 'Avance para negociação/fechamento',
          ifNegative: 'Investigue a objeção real por trás',
          ifNeutral: 'Ofereça garantia ou período de teste'
        },
        estimatedDuration: '5-10 min'
      },
      {
        stage: 'closing',
        title: '5. Fechamento',
        objective: 'Obter o compromisso de forma natural',
        script: `"${firstName}, ${discProfile === 'D' 
  ? 'vamos fechar. Qual forma de pagamento prefere?'
  : discProfile === 'I'
  ? 'estou animado para começar essa parceria! Vamos oficializar?'
  : discProfile === 'S'
  ? 'vou te dar todo suporte. Podemos começar com calma. Fechamos?'
  : 'analisando tudo, faz sentido prosseguir. Confirmamos?'}

${workingStyle === 'options'
  ? 'Você prefere [OPÇÃO A] ou [OPÇÃO B]?'
  : 'O próximo passo é [PASSO ESPECÍFICO]. Podemos fazer isso agora?'}

${motivationDirection === 'toward'
  ? 'Assim você começa a [BENEFÍCIO] já essa semana!'
  : 'Assim você resolve [PROBLEMA] de uma vez por todas!'}"`,
        magicWords: ['vamos começar', 'próximo passo', 'fechamos'],
        anchorPhrases: [
          'Estamos juntos nessa!',
          'Você não vai se arrepender!'
        ],
        transitionTo: 'Perfeito! Vou te enviar o contrato/link agora.',
        warningSignals: ['hesitação', 'preciso pensar', 'deixa eu ver'],
        adaptations: {
          ifPositive: 'Confirme e agradeça! Fale dos próximos passos.',
          ifNegative: 'Identifique a objeção final e resolva',
          ifNeutral: 'Ofereça um primeiro passo menor para reduzir risco'
        },
        estimatedDuration: '5 min'
      },
      {
        stage: 'follow_up',
        title: '6. Pós-Venda',
        objective: 'Garantir satisfação e gerar indicações',
        script: `"${firstName}! Como está sua experiência com [SOLUÇÃO]?

${vakType === 'V' ? 'Está conseguindo ver os resultados?' 
  : vakType === 'A' ? 'O que você tem ouvido de feedback?'
  : 'Como você está se sentindo com a mudança?'}

${discProfile === 'D' ? 'Quais resultados você já alcançou?'
  : discProfile === 'I' ? 'Está gostando? Quem mais poderia se beneficiar?'
  : discProfile === 'S' ? 'Precisa de algum suporte adicional?'
  : 'Os números estão de acordo com o esperado?'}

Aliás, você conhece alguém que também poderia se beneficiar disso?"`,
        magicWords: ['satisfeito', 'resultados', 'indicação', 'feedback'],
        anchorPhrases: [
          'Fico feliz em saber!',
          'Você é um cliente especial!'
        ],
        transitionTo: 'Obrigado pela confiança! Estou à disposição.',
        warningSignals: ['reclamações', 'sem resposta', 'respostas secas'],
        adaptations: {
          ifPositive: 'Peça indicação e depoimento',
          ifNegative: 'Resolva o problema e compense',
          ifNeutral: 'Ofereça suporte adicional proativo'
        },
        estimatedDuration: '5-10 min'
      }
    ];

    // Profile summary
    const profileSummary = `
👤 ${firstName} | ${discProfile} ${vakType}
🎯 Motivação: ${motivationDirection === 'toward' ? 'Em Direção A (ganhos)' : 'Afastar-se De (evitar problemas)'}
📊 Referência: ${referenceFrame === 'internal' ? 'Interna (decide sozinho)' : 'Externa (valoriza opiniões)'}
⚙️ Estilo: ${workingStyle === 'options' ? 'Opções (flexibilidade)' : 'Procedimentos (passo a passo)'}
    `.trim();

    // Key insights
    const keyInsights = [
      `Use predicados ${vakType === 'V' ? 'visuais (ver, mostrar, claro)' : vakType === 'A' ? 'auditivos (ouvir, soar, harmonia)' : vakType === 'K' ? 'cinestésicos (sentir, tocar, confortável)' : 'digitais (analisar, lógico, dados)'}`,
      discProfile === 'D' ? 'Seja direto e focado em resultados' :
        discProfile === 'I' ? 'Seja entusiasta e conte histórias' :
        discProfile === 'S' ? 'Seja paciente e ofereça segurança' :
        'Seja preciso e apresente dados',
      motivationDirection === 'toward' 
        ? 'Foque nos GANHOS e conquistas' 
        : 'Foque nos PROBLEMAS que serão resolvidos',
      referenceFrame === 'external'
        ? 'Use depoimentos e casos de sucesso'
        : 'Dê espaço para ele decidir por conta própria'
    ];

    // Calculate success probability
    const confidence = behavior?.discConfidence || 50;
    const vakConfidence = behavior?.vakProfile?.confidence || 50;
    const successProbability = Math.round((confidence + vakConfidence) / 2);

    return {
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      generatedAt: new Date().toISOString(),
      profileSummary,
      sections,
      powerWords: [...new Set(powerWords)].slice(0, 15),
      wordsToAvoid,
      keyInsights,
      successProbability
    };
  }, [contact]);

  return {
    personalizedScript,
    SALES_STAGE_INFO
  };
}
