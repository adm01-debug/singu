// Metaprograms Types for NLP-based client profiling

// The three core metaprograms
export type MotivationDirection = 'toward' | 'away_from' | 'balanced';
export type ReferenceFrame = 'internal' | 'external' | 'balanced';
export type WorkingStyle = 'options' | 'procedures' | 'balanced';

export interface MetaprogramScores {
  // Motivation Direction
  toward: number;
  awayFrom: number;
  
  // Reference Frame
  internal: number;
  external: number;
  
  // Working Style
  options: number;
  procedures: number;
}

export interface MetaprogramProfile {
  motivationDirection: MotivationDirection;
  motivationConfidence: number;
  
  referenceFrame: ReferenceFrame;
  referenceConfidence: number;
  
  workingStyle: WorkingStyle;
  workingConfidence: number;
  
  overallConfidence: number;
  analyzedInteractions: number;
}

export interface MetaprogramAnalysisResult {
  scores: MetaprogramScores;
  detectedWords: {
    toward: string[];
    awayFrom: string[];
    internal: string[];
    external: string[];
    options: string[];
    procedures: string[];
  };
}

// Labels and descriptions for each metaprogram
export const METAPROGRAM_LABELS = {
  motivationDirection: {
    toward: {
      name: 'Em Direção A',
      icon: '🎯',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      description: 'Motivado por objetivos, conquistas e ganhos. Foca no que quer alcançar.',
      communicationTips: [
        'Use palavras como: alcançar, conquistar, obter, ganhar, realizar',
        'Foque nos benefícios e resultados positivos',
        'Mostre o que ele vai GANHAR',
        'Estabeleça metas claras e atraentes'
      ]
    },
    away_from: {
      name: 'Afastar-se De',
      icon: '🛡️',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      description: 'Motivado por evitar problemas, dores e riscos. Foca no que quer evitar.',
      communicationTips: [
        'Use palavras como: evitar, prevenir, eliminar, resolver, proteger',
        'Destaque os problemas que será resolvidos',
        'Mostre o que ele vai EVITAR',
        'Apresente os riscos de não agir'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Usa ambas as direções motivacionais dependendo do contexto.',
      communicationTips: [
        'Combine benefícios com prevenção de problemas',
        'Mostre o que ganha E o que evita',
        'Adapte conforme o assunto específico'
      ]
    }
  },
  referenceFrame: {
    internal: {
      name: 'Interno',
      icon: '🧭',
      color: 'bg-violet-100 text-violet-700 border-violet-200',
      description: 'Toma decisões baseado em seus próprios critérios e intuição.',
      communicationTips: [
        'Use frases como: "Você vai perceber que...", "Na sua avaliação..."',
        'Deixe espaço para ele decidir por conta própria',
        'Não force opiniões externas',
        'Pergunte: "O que você acha?"'
      ]
    },
    external: {
      name: 'Externo',
      icon: '👥',
      color: 'bg-sky-100 text-sky-700 border-sky-200',
      description: 'Toma decisões baseado em feedback externo, dados e opiniões de outros.',
      communicationTips: [
        'Use depoimentos e casos de sucesso',
        'Mostre estatísticas e dados de mercado',
        'Mencione especialistas e referências',
        'Pergunte: "O que os outros dizem?"'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Usa referência interna e externa dependendo do contexto.',
      communicationTips: [
        'Combine dados externos com espaço para avaliação pessoal',
        'Apresente evidências mas respeite a opinião dele'
      ]
    }
  },
  workingStyle: {
    options: {
      name: 'Opções',
      icon: '🔀',
      color: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
      description: 'Gosta de ter alternativas, flexibilidade e possibilidades.',
      communicationTips: [
        'Ofereça múltiplas alternativas',
        'Use: "Você pode escolher entre...", "Há várias opções..."',
        'Destaque a flexibilidade',
        'Evite processos rígidos'
      ]
    },
    procedures: {
      name: 'Procedimentos',
      icon: '📋',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      description: 'Prefere processos claros, passo a passo e métodos estruturados.',
      communicationTips: [
        'Apresente um processo passo a passo',
        'Use: "Primeiro... depois... então..."',
        'Mostre metodologias comprovadas',
        'Dê um caminho claro a seguir'
      ]
    },
    balanced: {
      name: 'Equilibrado',
      icon: '⚖️',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Usa opções e procedimentos dependendo do contexto.',
      communicationTips: [
        'Ofereça opções dentro de um processo estruturado',
        'Combine flexibilidade com clareza'
      ]
    }
  }
};

// Detection keywords for each metaprogram (Portuguese)
export const METAPROGRAM_KEYWORDS = {
  toward: [
    'alcançar', 'conquistar', 'obter', 'ganhar', 'realizar', 'conseguir',
    'atingir', 'chegar', 'crescer', 'melhorar', 'avançar', 'progredir',
    'sucesso', 'objetivo', 'meta', 'sonho', 'ambição', 'desejo',
    'oportunidade', 'possibilidade', 'potencial', 'vantagem', 'benefício',
    'quero', 'preciso ter', 'meu objetivo', 'busco', 'aspiro',
    'almejo', 'pretendo', 'planejo conquistar', 'vou alcançar'
  ],
  awayFrom: [
    'evitar', 'prevenir', 'eliminar', 'resolver', 'proteger', 'escapar',
    'fugir', 'livrar', 'sair de', 'não quero', 'problema', 'dor',
    'risco', 'perigo', 'ameaça', 'medo', 'preocupação', 'cuidado',
    'dificuldade', 'obstáculo', 'barreira', 'impedimento', 'não posso',
    'não dá', 'tenho que resolver', 'preciso acabar com', 'me livrar de',
    'não suporto', 'não aguento', 'chega de', 'basta de'
  ],
  internal: [
    'eu sei', 'eu sinto', 'na minha opinião', 'eu acho', 'eu decido',
    'minha experiência', 'meu feeling', 'minha intuição', 'eu percebo',
    'para mim', 'no meu entendimento', 'eu avalio', 'eu julgo',
    'meu critério', 'minha análise', 'eu determino', 'eu escolho',
    'já me convenci', 'tenho certeza', 'eu defino', 'eu prefiro',
    'minha visão', 'do meu ponto de vista', 'pessoalmente'
  ],
  external: [
    'o que você acha', 'os outros dizem', 'todo mundo', 'as pessoas',
    'pesquisas mostram', 'dados indicam', 'estatísticas', 'estudos',
    'especialistas', 'referências', 'depoimentos', 'feedback',
    'aprovação', 'reconhecimento', 'validação', 'opinião de',
    'recomendação', 'sugestão', 'o mercado', 'a empresa',
    'meu chefe', 'minha equipe', 'clientes dizem', 'concorrência'
  ],
  options: [
    'opções', 'alternativas', 'possibilidades', 'escolhas', 'variedade',
    'flexibilidade', 'liberdade', 'depende', 'pode ser', 'ou então',
    'outra forma', 'diferentes maneiras', 'vários caminhos', 'explorar',
    'experimentar', 'testar', 'ver o que funciona', 'adaptar',
    'modificar', 'personalizar', 'customizar', 'ajustar', 'variar',
    'diversificar', 'não me prenda', 'quero poder mudar'
  ],
  procedures: [
    'processo', 'passo a passo', 'metodologia', 'sistema', 'estrutura',
    'primeiro', 'depois', 'então', 'em seguida', 'por último',
    'etapa', 'fase', 'sequência', 'ordem', 'rotina', 'padrão',
    'procedimento', 'protocolo', 'regra', 'método', 'como funciona',
    'qual o caminho', 'me explica como', 'preciso de um guia',
    'passo por passo', 'na ordem certa', 'seguindo o processo'
  ]
};
