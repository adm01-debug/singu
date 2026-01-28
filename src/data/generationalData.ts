// Dados Geracionais Completos
// Base de conhecimento para 5 gerações com integração comportamental

import { GenerationProfile, GenerationType } from '@/types/generation';

export const GENERATION_PROFILES: Record<GenerationType, GenerationProfile> = {
  baby_boomer: {
    type: 'baby_boomer',
    name: 'Baby Boomer',
    shortName: 'Boomer',
    yearRange: { start: 1946, end: 1964 },
    ageRange: { min: 61, max: 79 },
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: '🏛️',
    
    coreValues: [
      'Lealdade à empresa',
      'Trabalho duro',
      'Respeito à hierarquia',
      'Estabilidade',
      'Propriedade e patrimônio',
      'Status e reconhecimento'
    ],
    formativeEvents: [
      'Crescimento econômico pós-guerra',
      'Movimento pelos direitos civis',
      'Guerra Fria',
      'Chegada do homem à lua'
    ],
    workStyle: 'Presencial, dedicado, focado em carreira longa na mesma empresa',
    communicationStyle: 'Formal, respeitoso, prefere interações pessoais',
    decisionMaking: 'Deliberado, baseado em experiência e referências de longo prazo',
    
    preferredChannels: ['Telefone', 'Email formal', 'Reuniões presenciais'],
    avoidChannels: ['TikTok', 'Discord', 'Mensagens de voz longas'],
    responseExpectation: 'Dentro do horário comercial, resposta em 24-48h é aceitável',
    contentPreference: 'Textos detalhados, documentos formais, apresentações estruturadas',
    
    effectiveTriggers: [
      'Autoridade e expertise',
      'Prova social de pares',
      'Tradição e legado',
      'Segurança e garantias',
      'Exclusividade'
    ],
    ineffectiveTriggers: [
      'FOMO agressivo',
      'Urgência artificial',
      'Linguagem muito casual',
      'Excesso de emojis'
    ],
    commonObjections: [
      'Preciso consultar minha equipe/família',
      'Sempre fizemos de outra forma',
      'Não confio em novidades',
      'Qual é a tradição dessa empresa?'
    ],
    persuasionApproach: 'Construir credibilidade através de histórico, referências e expertise demonstrada',
    
    discTendencies: {
      mostCommon: ['S', 'C'],
      adaptationTips: [
        'Respeitar hierarquia e formalidade',
        'Apresentar dados históricos',
        'Demonstrar estabilidade da solução',
        'Referenciar cases de longo prazo'
      ]
    },
    
    vakTendencies: {
      dominant: 'A',
      secondary: 'K',
      languagePatterns: [
        'Ouço você dizer que...',
        'Isso soa bem para mim',
        'Me conta mais sobre...',
        'Sinto que precisamos...'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'neocortex',
      keyMotivators: ['Segurança financeira', 'Legado', 'Reconhecimento', 'Estabilidade'],
      fearDrivers: ['Obsolescência', 'Perda de status', 'Instabilidade financeira'],
      dopamineTriggers: ['Conquistas de longo prazo', 'Reconhecimento público', 'Patrimônio acumulado']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Demonstre respeito genuíno',
        'Fale sobre interesses deles',
        'Deixe-os sentir que a ideia foi deles',
        'Apele a motivos nobres'
      ],
      rapportBuilders: [
        'Perguntar sobre carreira e conquistas',
        'Valorizar experiência e conhecimento',
        'Mostrar interesse pela família'
      ],
      influenceTechniques: [
        'Referências de autoridade',
        'Prova social de pares da mesma geração',
        'Demonstração de expertise'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Apresentação formal e respeitosa',
        'Mencionar referências e credenciais',
        'Demonstrar conhecimento do setor'
      ],
      presentationStyle: 'Estruturada, com dados históricos e projeções conservadoras',
      closingTechniques: [
        'Resumo de benefícios de longo prazo',
        'Garantias e suporte contínuo',
        'Referências de clientes estabelecidos'
      ],
      followUpPreference: 'Email formal ou ligação em horário comercial'
    },
    
    techProfile: {
      digitalFluency: 'medium',
      preferredPlatforms: ['LinkedIn', 'Email', 'WhatsApp (texto simples)'],
      contentConsumption: 'Artigos longos, newsletters, TV tradicional',
      privacyConcern: 'high'
    }
  },

  gen_x: {
    type: 'gen_x',
    name: 'Geração X',
    shortName: 'Gen X',
    yearRange: { start: 1965, end: 1980 },
    ageRange: { min: 45, max: 60 },
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '💼',
    
    coreValues: [
      'Independência',
      'Equilíbrio vida-trabalho',
      'Pragmatismo',
      'Autossuficiência',
      'Ceticismo saudável',
      'Flexibilidade'
    ],
    formativeEvents: [
      'Queda do Muro de Berlim',
      'Surgimento da AIDS',
      'MTV e cultura pop',
      'Primeiros computadores pessoais'
    ],
    workStyle: 'Adaptável, valoriza resultados sobre presença, gerencia bem sozinho',
    communicationStyle: 'Direto ao ponto, pragmático, aceita informalidade moderada',
    decisionMaking: 'Analítico mas rápido, busca eficiência e ROI claro',
    
    preferredChannels: ['Email', 'WhatsApp', 'Telefone', 'Videochamada'],
    avoidChannels: ['TikTok', 'Snapchat'],
    responseExpectation: 'Resposta rápida durante horário flexível',
    contentPreference: 'Resumos executivos, bullet points, dados concretos',
    
    effectiveTriggers: [
      'Eficiência e economia de tempo',
      'Autonomia e controle',
      'Custo-benefício claro',
      'Flexibilidade',
      'Resultados comprovados'
    ],
    ineffectiveTriggers: [
      'Promessas grandiosas',
      'Excesso de formalidade',
      'Dependência excessiva',
      'Burocracia'
    ],
    commonObjections: [
      'Qual é o ROI real?',
      'Isso vai me dar mais trabalho?',
      'Posso testar antes?',
      'Não quero depender de suporte'
    ],
    persuasionApproach: 'Apresentar dados concretos, mostrar eficiência e dar autonomia na decisão',
    
    discTendencies: {
      mostCommon: ['D', 'C'],
      adaptationTips: [
        'Ser direto e objetivo',
        'Apresentar ROI claramente',
        'Dar autonomia na decisão',
        'Evitar rodeios e burocracia'
      ]
    },
    
    vakTendencies: {
      dominant: 'V',
      secondary: 'K',
      languagePatterns: [
        'Me mostra os números...',
        'Quero ver como funciona',
        'Deixa eu sentir na prática',
        'Parece bom, mas preciso testar'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'neocortex',
      keyMotivators: ['Independência', 'Eficiência', 'Segurança moderada', 'Qualidade de vida'],
      fearDrivers: ['Perda de autonomia', 'Dependência', 'Ineficiência'],
      dopamineTriggers: ['Resolução de problemas', 'Conquista de autonomia', 'Otimização']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Respeite a opinião deles',
        'Deixe-os falar',
        'Admita erros rapidamente',
        'Faça perguntas ao invés de dar ordens'
      ],
      rapportBuilders: [
        'Valorizar experiência prática',
        'Mostrar que respeita o tempo deles',
        'Ser direto e autêntico'
      ],
      influenceTechniques: [
        'Demonstração prática',
        'Cases de eficiência',
        'Comparativos objetivos'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Ir direto ao ponto',
        'Mostrar que valoriza o tempo',
        'Apresentar benefício principal primeiro'
      ],
      presentationStyle: 'Concisa, baseada em dados, com demonstração prática',
      closingTechniques: [
        'Oferecer período de teste',
        'Mostrar facilidade de saída',
        'Apresentar flexibilidade de implementação'
      ],
      followUpPreference: 'Email objetivo ou mensagem curta'
    },
    
    techProfile: {
      digitalFluency: 'high',
      preferredPlatforms: ['LinkedIn', 'WhatsApp', 'Email', 'YouTube'],
      contentConsumption: 'Podcasts, vídeos curtos, artigos objetivos',
      privacyConcern: 'medium'
    }
  },

  millennial: {
    type: 'millennial',
    name: 'Millennial',
    shortName: 'Millennial',
    yearRange: { start: 1981, end: 1996 },
    ageRange: { min: 29, max: 44 },
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '🚀',
    
    coreValues: [
      'Propósito e significado',
      'Experiências sobre coisas',
      'Autenticidade',
      'Colaboração',
      'Impacto social',
      'Flexibilidade'
    ],
    formativeEvents: [
      '11 de setembro',
      'Crise financeira de 2008',
      'Surgimento das redes sociais',
      'iPhone e smartphones'
    ],
    workStyle: 'Colaborativo, busca propósito, prefere flexibilidade e feedback constante',
    communicationStyle: 'Informal, visual, espera comunicação omnichannel',
    decisionMaking: 'Pesquisa extensiva online, valoriza reviews e recomendações',
    
    preferredChannels: ['WhatsApp', 'Instagram', 'Email', 'Videochamada'],
    avoidChannels: ['Telefone frio', 'Correio físico'],
    responseExpectation: 'Resposta rápida, idealmente em poucas horas',
    contentPreference: 'Visual, vídeos curtos, stories, conteúdo autêntico',
    
    effectiveTriggers: [
      'Propósito e impacto',
      'FOMO (Fear of Missing Out)',
      'Prova social (reviews)',
      'Experiência única',
      'Autenticidade da marca'
    ],
    ineffectiveTriggers: [
      'Vendas agressivas',
      'Falta de transparência',
      'Excesso de formalidade',
      'Marcas sem propósito'
    ],
    commonObjections: [
      'Qual é o impacto ambiental/social?',
      'O que os outros estão dizendo?',
      'Posso personalizar?',
      'A empresa é autêntica?'
    ],
    persuasionApproach: 'Conectar com propósito, mostrar impacto social e prova social autêntica',
    
    discTendencies: {
      mostCommon: ['I', 'S'],
      adaptationTips: [
        'Ser autêntico e transparente',
        'Conectar com propósito maior',
        'Usar storytelling',
        'Mostrar impacto social'
      ]
    },
    
    vakTendencies: {
      dominant: 'V',
      secondary: 'A',
      languagePatterns: [
        'Imagina só como seria...',
        'Vejo muito potencial nisso',
        'Me fala mais sobre a experiência',
        'Como isso parece na prática?'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'limbic',
      keyMotivators: ['Propósito', 'Conexão', 'Experiências', 'Crescimento pessoal'],
      fearDrivers: ['Irrelevância', 'FOMO', 'Falta de propósito', 'Estagnação'],
      dopamineTriggers: ['Novas experiências', 'Reconhecimento social', 'Conquistas compartilháveis']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Interesse genuíno pela pessoa',
        'Fazer sentir importante',
        'Apelar a motivos nobres',
        'Dramatizar suas ideias'
      ],
      rapportBuilders: [
        'Compartilhar experiências pessoais',
        'Demonstrar valores alinhados',
        'Engajar em causas comuns'
      ],
      influenceTechniques: [
        'Storytelling emocional',
        'Prova social visual',
        'Experiências imersivas'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Começar com propósito da empresa',
        'Compartilhar história autêntica',
        'Criar conexão pessoal'
      ],
      presentationStyle: 'Visual, com storytelling, demonstrando impacto',
      closingTechniques: [
        'Criar senso de comunidade',
        'Oferecer experiência exclusiva',
        'Mostrar impacto da decisão'
      ],
      followUpPreference: 'Mensagem personalizada via WhatsApp ou Instagram'
    },
    
    techProfile: {
      digitalFluency: 'native',
      preferredPlatforms: ['Instagram', 'WhatsApp', 'LinkedIn', 'YouTube', 'Spotify'],
      contentConsumption: 'Vídeos, podcasts, stories, conteúdo UGC',
      privacyConcern: 'medium'
    }
  },

  gen_z: {
    type: 'gen_z',
    name: 'Geração Z',
    shortName: 'Gen Z',
    yearRange: { start: 1997, end: 2012 },
    ageRange: { min: 13, max: 28 },
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    icon: '⚡',
    
    coreValues: [
      'Autenticidade radical',
      'Diversidade e inclusão',
      'Saúde mental',
      'Justiça social',
      'Individualidade',
      'Sustentabilidade'
    ],
    formativeEvents: [
      'Smartphones desde infância',
      'Mudanças climáticas',
      'Pandemia COVID-19',
      'Movimentos sociais (BLM, etc.)'
    ],
    workStyle: 'Multitarefa, prefere trabalho remoto, busca significado e flexibilidade extrema',
    communicationStyle: 'Ultra-informal, visual, rápido, memes e referências culturais',
    decisionMaking: 'Impulsivo mas pesquisado, influenciado por creators e comunidades online',
    
    preferredChannels: ['TikTok', 'Instagram', 'WhatsApp', 'Discord'],
    avoidChannels: ['Email formal', 'Telefone', 'Facebook'],
    responseExpectation: 'Imediata, minutos não horas',
    contentPreference: 'Vídeos curtos, memes, conteúdo autêntico e não-polido',
    
    effectiveTriggers: [
      'Autenticidade (anti-polished)',
      'Inclusão e diversidade',
      'Sustentabilidade',
      'FOMO de comunidade',
      'Tendências virais'
    ],
    ineffectiveTriggers: [
      'Marketing tradicional',
      'Conteúdo over-produced',
      'Falta de responsabilidade social',
      'Slow content'
    ],
    commonObjections: [
      'Isso é sustentável?',
      'A empresa é inclusiva?',
      'Parece muito corporativo/fake',
      'Ninguém que eu sigo usa isso'
    ],
    persuasionApproach: 'Ser autêntico, engajar creators, mostrar valores e criar comunidade',
    
    discTendencies: {
      mostCommon: ['I', 'D'],
      adaptationTips: [
        'Ser ultra-autêntico',
        'Usar linguagem casual',
        'Engajar via comunidade',
        'Mostrar valores sociais'
      ]
    },
    
    vakTendencies: {
      dominant: 'V',
      secondary: 'A',
      languagePatterns: [
        'Isso é muito aesthetic',
        'Me mostra no TikTok',
        'Ouvi um podcast sobre isso',
        'Vibe muito boa'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'limbic',
      keyMotivators: ['Pertencimento', 'Expressão individual', 'Impacto social', 'Autenticidade'],
      fearDrivers: ['Exclusão social', 'Irrelevância', 'Inautenticidade', 'Injustiça'],
      dopamineTriggers: ['Viralização', 'Validação social', 'Novas trends', 'Comunidade']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Interesse genuíno como pessoa',
        'Fazer sentir importante',
        'Respeitar opiniões',
        'Usar nome frequentemente'
      ],
      rapportBuilders: [
        'Entender referências culturais',
        'Validar perspectivas únicas',
        'Demonstrar valores alinhados'
      ],
      influenceTechniques: [
        'Influenciadores e creators',
        'Comunidades online',
        'Conteúdo colaborativo'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Começar casual e autêntico',
        'Referenciar trends ou creators',
        'Mostrar lado humano da marca'
      ],
      presentationStyle: 'Rápida, visual, com memes e referências culturais',
      closingTechniques: [
        'Criar senso de comunidade',
        'Oferecer co-criação',
        'Mostrar que outros da idade estão usando'
      ],
      followUpPreference: 'DM no Instagram ou mensagem curta via WhatsApp'
    },
    
    techProfile: {
      digitalFluency: 'native',
      preferredPlatforms: ['TikTok', 'Instagram', 'YouTube', 'Discord', 'Twitch'],
      contentConsumption: 'Vídeos curtos, lives, memes, conteúdo de creators',
      privacyConcern: 'low'
    }
  },

  gen_alpha: {
    type: 'gen_alpha',
    name: 'Geração Alpha',
    shortName: 'Gen Alpha',
    yearRange: { start: 2013, end: 2025 },
    ageRange: { min: 0, max: 12 },
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: '🤖',
    
    coreValues: [
      'Tecnologia como extensão',
      'Diversidade natural',
      'Aprendizado gamificado',
      'Sustentabilidade inata',
      'Personalização extrema',
      'Imediatismo'
    ],
    formativeEvents: [
      'Nativos de IA',
      'Pandemia na infância',
      'Mudanças climáticas visíveis',
      'Metaverso emergente'
    ],
    workStyle: 'Ainda em formação - tendência a gamificação e tech-first',
    communicationStyle: 'Ultra-visual, interativo, gamificado, com assistentes de IA',
    decisionMaking: 'Influenciado por algoritmos, gamificação e pais (Millennials)',
    
    preferredChannels: ['YouTube Kids', 'Roblox', 'Jogos interativos'],
    avoidChannels: ['Email', 'Telefone', 'Texto longo'],
    responseExpectation: 'Instantânea, gamificada',
    contentPreference: 'Vídeos, jogos, experiências interativas, RA/RV',
    
    effectiveTriggers: [
      'Gamificação',
      'Personalização',
      'Experiências imersivas',
      'Influência dos pais',
      'Conteúdo interativo'
    ],
    ineffectiveTriggers: [
      'Texto longo',
      'Conteúdo estático',
      'Falta de interatividade',
      'Experiências passivas'
    ],
    commonObjections: [
      'Decisões via pais (Millennials)',
      'Precisa ser divertido',
      'Onde está a gamificação?'
    ],
    persuasionApproach: 'Gamificar experiência e alinhar com valores dos pais Millennials',
    
    discTendencies: {
      mostCommon: ['I', 'D'],
      adaptationTips: [
        'Usar elementos de games',
        'Criar experiências imersivas',
        'Personalização extrema',
        'Direcionar via pais'
      ]
    },
    
    vakTendencies: {
      dominant: 'V',
      secondary: 'K',
      languagePatterns: [
        'Me mostra no tablet',
        'Quero jogar isso',
        'Posso mexer?',
        'Cadê a parte divertida?'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'limbic',
      keyMotivators: ['Diversão', 'Recompensas instantâneas', 'Interação', 'Personalização'],
      fearDrivers: ['Tédio', 'Exclusão', 'Falta de estímulo'],
      dopamineTriggers: ['Conquistas em games', 'Recompensas visuais', 'Novas experiências']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Fazer sentir especial',
        'Interesse genuíno',
        'Elogio sincero',
        'Tornar divertido'
      ],
      rapportBuilders: [
        'Conectar via interesses (games, creators)',
        'Incluir em decisões',
        'Gamificar interação'
      ],
      influenceTechniques: [
        'Via pais Millennials',
        'Influenciadores kids',
        'Experiências gamificadas'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Abordar pais com linguagem Millennial',
        'Mostrar valor educacional',
        'Demonstrar elementos interativos'
      ],
      presentationStyle: 'Gamificada, interativa, com elementos visuais ricos',
      closingTechniques: [
        'Convencer pais (B2C2C)',
        'Oferecer trial gamificado',
        'Mostrar benefícios educacionais'
      ],
      followUpPreference: 'Via pais por WhatsApp/Instagram'
    },
    
    techProfile: {
      digitalFluency: 'native',
      preferredPlatforms: ['YouTube', 'Roblox', 'Minecraft', 'Apps educativos'],
      contentConsumption: 'Vídeos, jogos, experiências interativas',
      privacyConcern: 'low'
    }
  },

  silent: {
    type: 'silent',
    name: 'Geração Silenciosa',
    shortName: 'Silent',
    yearRange: { start: 1928, end: 1945 },
    ageRange: { min: 80, max: 97 },
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '📜',
    
    coreValues: [
      'Disciplina',
      'Respeito à autoridade',
      'Frugalidade',
      'Lealdade',
      'Conformidade',
      'Trabalho árduo'
    ],
    formativeEvents: [
      'Grande Depressão',
      'Segunda Guerra Mundial',
      'Era pré-televisão',
      'Valores tradicionais fortes'
    ],
    workStyle: 'Tradicional, leal, respeito à hierarquia, dedicação vitalícia',
    communicationStyle: 'Muito formal, respeitoso, presencial preferido',
    decisionMaking: 'Muito deliberado, conservador, baseado em confiança de longo prazo',
    
    preferredChannels: ['Presencial', 'Telefone', 'Correio'],
    avoidChannels: ['Redes sociais', 'Apps', 'Mensagens digitais'],
    responseExpectation: 'Sem pressa, comunicação formal',
    contentPreference: 'Impresso, conversas presenciais, cartas',
    
    effectiveTriggers: [
      'Tradição',
      'Segurança',
      'Respeito',
      'Confiança de longo prazo',
      'Autoridade estabelecida'
    ],
    ineffectiveTriggers: [
      'Novidade',
      'Tecnologia',
      'Informalidade',
      'Pressa'
    ],
    commonObjections: [
      'Sempre fiz de outro jeito',
      'Não confio em tecnologia',
      'Preciso conhecer a pessoa',
      'Qual é a tradição da empresa?'
    ],
    persuasionApproach: 'Construir confiança pessoal, demonstrar tradição e respeito',
    
    discTendencies: {
      mostCommon: ['S', 'C'],
      adaptationTips: [
        'Máximo respeito e formalidade',
        'Paciência e tempo',
        'Construir relacionamento pessoal',
        'Demonstrar tradição'
      ]
    },
    
    vakTendencies: {
      dominant: 'A',
      secondary: 'K',
      languagePatterns: [
        'Me conte sobre...',
        'Ouço o que você diz...',
        'Sinto que precisamos...',
        'Parece familiar...'
      ]
    },
    
    neuroProfile: {
      dominantBrain: 'neocortex',
      keyMotivators: ['Segurança', 'Tradição', 'Família', 'Legado'],
      fearDrivers: ['Mudança', 'Tecnologia', 'Instabilidade', 'Desrespeito'],
      dopamineTriggers: ['Conexões familiares', 'Reconhecimento', 'Estabilidade']
    },
    
    carnegieApproach: {
      principlesEmphasis: [
        'Máximo respeito',
        'Interesse genuíno na história',
        'Valorizar experiência de vida',
        'Nunca criticar'
      ],
      rapportBuilders: [
        'Ouvir histórias de vida',
        'Demonstrar respeito profundo',
        'Conexão através de valores tradicionais'
      ],
      influenceTechniques: [
        'Referências familiares',
        'Histórico de confiança',
        'Recomendações pessoais'
      ]
    },
    
    salesApproach: {
      openingStrategies: [
        'Apresentação formal e respeitosa',
        'Referência por conhecidos',
        'Tempo para construir rapport'
      ],
      presentationStyle: 'Muito formal, presencial se possível, sem pressa',
      closingTechniques: [
        'Construir confiança antes de fechar',
        'Envolver família na decisão',
        'Garantias de longo prazo'
      ],
      followUpPreference: 'Ligação telefônica ou visita presencial'
    },
    
    techProfile: {
      digitalFluency: 'low',
      preferredPlatforms: ['Telefone fixo', 'TV tradicional'],
      contentConsumption: 'Jornais, revistas, TV, rádio',
      privacyConcern: 'high'
    }
  }
};

// Função para detectar geração por ano de nascimento
export function detectGeneration(birthYear: number): GenerationType | null {
  if (birthYear >= 2013) return 'gen_alpha';
  if (birthYear >= 1997) return 'gen_z';
  if (birthYear >= 1981) return 'millennial';
  if (birthYear >= 1965) return 'gen_x';
  if (birthYear >= 1946) return 'baby_boomer';
  if (birthYear >= 1928) return 'silent';
  return null;
}

// Função para calcular idade atual
export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

// Labels para exibição
export const GENERATION_LABELS: Record<GenerationType, string> = {
  silent: 'Geração Silenciosa',
  baby_boomer: 'Baby Boomer',
  gen_x: 'Geração X',
  millennial: 'Millennial',
  gen_z: 'Geração Z',
  gen_alpha: 'Geração Alpha'
};

// Cores para badges
export const GENERATION_COLORS: Record<GenerationType, string> = {
  silent: 'bg-gray-100 text-gray-700 border-gray-200',
  baby_boomer: 'bg-amber-100 text-amber-700 border-amber-200',
  gen_x: 'bg-blue-100 text-blue-700 border-blue-200',
  millennial: 'bg-purple-100 text-purple-700 border-purple-200',
  gen_z: 'bg-pink-100 text-pink-700 border-pink-200',
  gen_alpha: 'bg-cyan-100 text-cyan-700 border-cyan-200'
};
