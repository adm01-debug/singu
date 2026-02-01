/**
 * Gallery of Demo Contacts with varied profiles and copywriting analyses
 * Used for demonstration, training, and testing purposes
 */

import { Contact, ContactBehavior } from '@/types';
import { CopyAnalysis } from '@/types/copywriting';
import { TemperamentProfile } from '@/types/temperament';

// ============================================
// CONTACT 1: MARIA SILVA - Dominant D Profile
// High-achiever, results-focused executive
// ============================================

const MARIA_TEMPERAMENT: TemperamentProfile = {
  primary: 'choleric',
  secondary: 'sanguine',
  scores: { sanguine: 55, choleric: 88, melancholic: 25, phlegmatic: 32 },
  confidence: 85,
  analyzedAt: new Date().toISOString(),
  description: 'Perfil altamente Colérico. Líder natural com forte orientação a resultados.',
  strengths: ['Liderança assertiva', 'Decisões rápidas', 'Foco extremo em metas', 'Alta produtividade'],
  weaknesses: ['Impaciente', 'Pode intimidar', 'Dificuldade em ouvir'],
  communicationStyle: 'Direto, objetivo e sem rodeios. Prefere bullet points a parágrafos.',
  salesApproach: [
    'Vá direto ao ponto nos primeiros 30 segundos',
    'Apresente ROI e números concretos',
    'Ofereça exclusividade e vantagem competitiva',
    'Respeite o tempo dela - reuniões curtas',
    'Deixe ela no controle da decisão'
  ]
};

const MARIA_BEHAVIOR: ContactBehavior = {
  discProfile: 'D',
  discConfidence: 88,
  preferredChannel: 'email',
  formalityLevel: 4,
  decisionCriteria: ['quality', 'speed', 'innovation'],
  needsApproval: false,
  decisionPower: 9,
  supportLevel: 4,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Escalar operação 3x', 'Reduzir custos operacionais'],
  competitorsUsed: ['Salesforce', 'HubSpot'],
  vakProfile: { visual: 70, auditory: 20, kinesthetic: 10, primary: 'V' },
  temperamentProfile: MARIA_TEMPERAMENT,
  bigFiveProfile: {
    openness: 65,
    conscientiousness: 92,
    extraversion: 78,
    agreeableness: 35,
    neuroticism: 28,
    confidence: 82,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ENTJ',
    confidence: 85,
    dimensions: {
      E_I: { E: 82, I: 18 },
      S_N: { S: 30, N: 70 },
      T_F: { T: 88, F: 12 },
      J_P: { J: 85, P: 15 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 8,
    wing: 7,
    confidence: 78,
    scores: { 1: 55, 2: 30, 3: 72, 4: 25, 5: 45, 6: 35, 7: 68, 8: 88, 9: 28 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT_MARIA: Contact = {
  id: 'demo-maria',
  firstName: 'Maria',
  lastName: 'Silva',
  companyId: '',
  companyName: 'TechScale Ventures',
  role: 'decision_maker',
  roleTitle: 'CEO',
  relationshipStage: 'qualified_lead',
  relationshipScore: 78,
  sentiment: 'positive',
  interactionCount: 8,
  tags: ['VIP', 'Enterprise', 'Fast-Mover'],
  hobbies: ['Tênis', 'Leitura de negócios', 'Viagens executivas'],
  interests: ['Scaling', 'M&A', 'Tech Investments'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: MARIA_BEHAVIOR
};

// Sample Copy Analysis for Maria (D profile)
export const MARIA_COPY_ANALYSIS: CopyAnalysis = {
  id: 'analysis-maria-001',
  originalText: 'Maria, resultados em 30 dias ou devolvemos seu investimento. ROI médio de 340% comprovado. Agende 15 minutos e veja os números.',
  readability: {
    fleschScore: 72,
    avgSentenceLength: 8.3,
    avgWordLength: 5.2,
    complexWordPercentage: 12,
    level: 'facil',
    recommendation: 'Texto direto e objetivo, ideal para perfil D.'
  },
  triggerDensity: {
    totalTriggers: 5,
    triggersPerSentence: 1.67,
    dominantTriggers: ['scarcity', 'authority', 'reciprocity'],
    missingTriggers: ['social_proof'],
    saturationLevel: 'optimal',
    recommendation: 'Excelente densidade. Adicione um case de sucesso.'
  },
  persuasionScore: 88,
  emotionalScore: 45,
  clarityScore: 72,
  ctaStrength: 85,
  issues: [],
  strengths: [
    'CTA claro e objetivo',
    'Garantia reduz risco',
    'Números específicos geram credibilidade',
    'Respeita o tempo (15 min)'
  ],
  generatedAt: new Date().toISOString()
};

// ============================================
// CONTACT 2: PEDRO SANTOS - Influence I Profile
// Creative, relationship-focused marketing director
// ============================================

const PEDRO_TEMPERAMENT: TemperamentProfile = {
  primary: 'sanguine',
  secondary: 'choleric',
  scores: { sanguine: 85, choleric: 55, melancholic: 22, phlegmatic: 38 },
  confidence: 80,
  analyzedAt: new Date().toISOString(),
  description: 'Sanguíneo vibrante com energia contagiante. Adora networking e novas ideias.',
  strengths: ['Comunicação envolvente', 'Criatividade', 'Networking natural', 'Entusiasmo'],
  weaknesses: ['Disperso', 'Dificuldade com detalhes', 'Pode prometer demais'],
  communicationStyle: 'Expressivo, usa muitos gestos e histórias. Gosta de conversa informal antes dos negócios.',
  salesApproach: [
    'Comece com conversa leve e pessoal',
    'Use histórias e cases inspiradores',
    'Mostre como ele será reconhecido',
    'Deixe-o falar bastante',
    'Marque reuniões presenciais quando possível'
  ]
};

const PEDRO_BEHAVIOR: ContactBehavior = {
  discProfile: 'I',
  discConfidence: 82,
  preferredChannel: 'whatsapp',
  formalityLevel: 2,
  decisionCriteria: ['innovation', 'relationship', 'reputation'],
  needsApproval: true,
  decisionPower: 6,
  supportLevel: 9,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Aumentar engajamento', 'Criar campanha viral'],
  competitorsUsed: ['Mailchimp', 'Buffer'],
  vakProfile: { visual: 45, auditory: 40, kinesthetic: 15, primary: 'V' },
  temperamentProfile: PEDRO_TEMPERAMENT,
  bigFiveProfile: {
    openness: 92,
    conscientiousness: 45,
    extraversion: 95,
    agreeableness: 82,
    neuroticism: 42,
    confidence: 78,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ENFP',
    confidence: 82,
    dimensions: {
      E_I: { E: 92, I: 8 },
      S_N: { S: 25, N: 75 },
      T_F: { T: 35, F: 65 },
      J_P: { J: 28, P: 72 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 7,
    wing: 8,
    confidence: 75,
    scores: { 1: 32, 2: 68, 3: 72, 4: 55, 5: 38, 6: 42, 7: 88, 8: 58, 9: 45 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT_PEDRO: Contact = {
  id: 'demo-pedro',
  firstName: 'Pedro',
  lastName: 'Santos',
  companyId: '',
  companyName: 'Creative Minds Agency',
  role: 'influencer',
  roleTitle: 'Diretor de Marketing',
  relationshipStage: 'opportunity',
  relationshipScore: 85,
  sentiment: 'positive',
  interactionCount: 15,
  tags: ['Criativo', 'Influencer', 'Social-First'],
  hobbies: ['Fotografia', 'Festivais de música', 'Podcasts'],
  interests: ['Trends', 'Branding', 'Storytelling'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: PEDRO_BEHAVIOR
};

export const PEDRO_COPY_ANALYSIS: CopyAnalysis = {
  id: 'analysis-pedro-001',
  originalText: 'Pedro! 🎉 Imagina sua campanha viralizando e todo mundo comentando "foi o Pedro que fez isso"? A gente tem uma ideia INCRÍVEL pra te mostrar. Bora um café?',
  readability: {
    fleschScore: 85,
    avgSentenceLength: 12,
    avgWordLength: 4.5,
    complexWordPercentage: 5,
    level: 'muito_facil',
    recommendation: 'Linguagem perfeita para perfil I - leve e envolvente.'
  },
  triggerDensity: {
    totalTriggers: 4,
    triggersPerSentence: 1.33,
    dominantTriggers: ['social_proof', 'curiosity', 'liking'],
    missingTriggers: ['authority'],
    saturationLevel: 'optimal',
    recommendation: 'Tom perfeito. O emoji adiciona leveza.'
  },
  persuasionScore: 82,
  emotionalScore: 92,
  clarityScore: 85,
  ctaStrength: 70,
  issues: [
    {
      issue: 'CTA muito informal',
      severity: 'low',
      suggestion: 'Para alguns contextos, especifique data/hora'
    }
  ],
  strengths: [
    'Usa o nome dele - conexão pessoal',
    'Apela ao reconhecimento (I adora)',
    'Linguagem energética e entusiasmada',
    'Emoji estratégico no início'
  ],
  generatedAt: new Date().toISOString()
};

// ============================================
// CONTACT 3: ANA COSTA - Steadiness S Profile
// Loyal, process-oriented operations manager
// ============================================

const ANA_TEMPERAMENT: TemperamentProfile = {
  primary: 'phlegmatic',
  secondary: 'melancholic',
  scores: { sanguine: 32, choleric: 28, melancholic: 58, phlegmatic: 82 },
  confidence: 78,
  analyzedAt: new Date().toISOString(),
  description: 'Fleumática estável com traços analíticos. Valoriza harmonia e processos claros.',
  strengths: ['Confiável', 'Paciente', 'Boa ouvinte', 'Mantém a calma sob pressão'],
  weaknesses: ['Resistente a mudanças', 'Lenta para decidir', 'Evita conflitos'],
  communicationStyle: 'Calmo e ponderado. Prefere comunicação escrita para ter tempo de pensar.',
  salesApproach: [
    'Não pressione - dê tempo para processar',
    'Mostre estabilidade e suporte contínuo',
    'Apresente cases de clientes de longo prazo',
    'Fale sobre a equipe que vai apoiá-la',
    'Garanta que a transição será suave'
  ]
};

const ANA_BEHAVIOR: ContactBehavior = {
  discProfile: 'S',
  discConfidence: 78,
  preferredChannel: 'email',
  formalityLevel: 3,
  decisionCriteria: ['support', 'relationship', 'quality'],
  needsApproval: true,
  decisionPower: 5,
  supportLevel: 8,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Implementar novo sistema sem atritos', 'Manter equipe motivada'],
  competitorsUsed: ['Monday.com', 'Asana'],
  vakProfile: { visual: 35, auditory: 25, kinesthetic: 40, primary: 'K' },
  temperamentProfile: ANA_TEMPERAMENT,
  bigFiveProfile: {
    openness: 42,
    conscientiousness: 78,
    extraversion: 35,
    agreeableness: 92,
    neuroticism: 55,
    confidence: 72,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ISFJ',
    confidence: 80,
    dimensions: {
      E_I: { E: 28, I: 72 },
      S_N: { S: 75, N: 25 },
      T_F: { T: 38, F: 62 },
      J_P: { J: 72, P: 28 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 6,
    wing: 5,
    confidence: 72,
    scores: { 1: 55, 2: 72, 3: 38, 4: 42, 5: 58, 6: 85, 7: 28, 8: 32, 9: 78 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT_ANA: Contact = {
  id: 'demo-ana',
  firstName: 'Ana',
  lastName: 'Costa',
  companyId: '',
  companyName: 'Grupo Harmonia',
  role: 'manager',
  roleTitle: 'Gerente de Operações',
  relationshipStage: 'prospect',
  relationshipScore: 55,
  sentiment: 'neutral',
  interactionCount: 4,
  tags: ['Operações', 'Processo', 'Longo-Prazo'],
  hobbies: ['Jardinagem', 'Culinária', 'Livros de desenvolvimento pessoal'],
  interests: ['Eficiência', 'Bem-estar da equipe', 'Processos'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: ANA_BEHAVIOR
};

export const ANA_COPY_ANALYSIS: CopyAnalysis = {
  id: 'analysis-ana-001',
  originalText: 'Ana, entendemos que mudanças podem gerar preocupação na equipe. Por isso, nossa implementação é gradual e com suporte dedicado. Mais de 200 empresas fizeram a transição sem impacto na operação. Posso enviar um material detalhado?',
  readability: {
    fleschScore: 58,
    avgSentenceLength: 14,
    avgWordLength: 5.8,
    complexWordPercentage: 18,
    level: 'medio',
    recommendation: 'Bom equilíbrio entre profissionalismo e clareza.'
  },
  triggerDensity: {
    totalTriggers: 4,
    triggersPerSentence: 1.0,
    dominantTriggers: ['social_proof', 'authority', 'reciprocity'],
    missingTriggers: ['scarcity'],
    saturationLevel: 'optimal',
    recommendation: 'Tom adequado para S. Evitou pressão.'
  },
  persuasionScore: 72,
  emotionalScore: 65,
  clarityScore: 58,
  ctaStrength: 60,
  issues: [
    {
      issue: 'CTA poderia ser mais específico',
      severity: 'low',
      suggestion: 'Especifique o que o material contém'
    }
  ],
  strengths: [
    'Reconhece as preocupações dela (empatia)',
    'Enfatiza suporte e gradualidade',
    'Prova social com número específico',
    'CTA suave, sem pressão'
  ],
  generatedAt: new Date().toISOString()
};

// ============================================
// CONTACT 4: CARLOS MENDES - Conscientiousness C Profile
// Analytical, detail-oriented CFO
// ============================================

const CARLOS_TEMPERAMENT: TemperamentProfile = {
  primary: 'melancholic',
  secondary: 'phlegmatic',
  scores: { sanguine: 22, choleric: 38, melancholic: 88, phlegmatic: 52 },
  confidence: 82,
  analyzedAt: new Date().toISOString(),
  description: 'Melancólico analítico. Perfeccionista que valoriza dados e precisão acima de tudo.',
  strengths: ['Análise profunda', 'Atenção a detalhes', 'Organização', 'Pensamento crítico'],
  weaknesses: ['Paralisia por análise', 'Muito crítico', 'Lento para agir'],
  communicationStyle: 'Preciso e detalhado. Faz muitas perguntas técnicas. Desconfia de promessas vagas.',
  salesApproach: [
    'Prepare-se com dados e documentação',
    'Seja preciso - evite exageros',
    'Responda todas as perguntas técnicas',
    'Envie material para análise prévia',
    'Dê tempo para ele processar'
  ]
};

const CARLOS_BEHAVIOR: ContactBehavior = {
  discProfile: 'C',
  discConfidence: 85,
  preferredChannel: 'email',
  formalityLevel: 5,
  decisionCriteria: ['quality', 'price', 'reputation'],
  needsApproval: false,
  decisionPower: 8,
  supportLevel: 3,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Reduzir riscos financeiros', 'Compliance SOX'],
  competitorsUsed: ['SAP', 'Oracle'],
  vakProfile: { visual: 55, auditory: 35, kinesthetic: 10, primary: 'V' },
  temperamentProfile: CARLOS_TEMPERAMENT,
  bigFiveProfile: {
    openness: 55,
    conscientiousness: 95,
    extraversion: 28,
    agreeableness: 42,
    neuroticism: 62,
    confidence: 80,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ISTJ',
    confidence: 88,
    dimensions: {
      E_I: { E: 22, I: 78 },
      S_N: { S: 82, N: 18 },
      T_F: { T: 92, F: 8 },
      J_P: { J: 88, P: 12 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 5,
    wing: 6,
    confidence: 82,
    scores: { 1: 72, 2: 25, 3: 45, 4: 38, 5: 92, 6: 68, 7: 22, 8: 42, 9: 35 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT_CARLOS: Contact = {
  id: 'demo-carlos',
  firstName: 'Carlos',
  lastName: 'Mendes',
  companyId: '',
  companyName: 'Precision Finance Group',
  role: 'decision_maker',
  roleTitle: 'CFO',
  relationshipStage: 'qualified_lead',
  relationshipScore: 62,
  sentiment: 'neutral',
  interactionCount: 6,
  tags: ['Financeiro', 'Analítico', 'Enterprise'],
  hobbies: ['Xadrez', 'Leitura técnica', 'Investimentos'],
  interests: ['Compliance', 'Risk Management', 'Data Analytics'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: CARLOS_BEHAVIOR
};

export const CARLOS_COPY_ANALYSIS: CopyAnalysis = {
  id: 'analysis-carlos-001',
  originalText: 'Carlos, segue análise técnica conforme solicitado: ROI projetado de 127% (±8% margem), payback em 14.2 meses, compliance ISO 27001 e SOC 2 Type II. Documentação completa em anexo (47 páginas). Disponível para call técnico às 14h de terça?',
  readability: {
    fleschScore: 42,
    avgSentenceLength: 18,
    avgWordLength: 6.2,
    complexWordPercentage: 28,
    level: 'dificil',
    recommendation: 'Apropriado para perfil C - técnico e preciso.'
  },
  triggerDensity: {
    totalTriggers: 4,
    triggersPerSentence: 1.33,
    dominantTriggers: ['authority', 'specificity', 'reciprocity'],
    missingTriggers: ['social_proof'],
    saturationLevel: 'optimal',
    recommendation: 'Excelente precisão. Adicione um case de empresa similar.'
  },
  persuasionScore: 78,
  emotionalScore: 25,
  clarityScore: 42,
  ctaStrength: 82,
  issues: [],
  strengths: [
    'Números extremamente precisos (127% ±8%)',
    'Menciona certificações específicas',
    'Documentação detalhada disponível',
    'CTA com horário específico',
    'Tom profissional e técnico'
  ],
  generatedAt: new Date().toISOString()
};

// ============================================
// CONTACT 5: JULIANA FERREIRA - Balanced DI Profile
// Entrepreneurial, visionary startup founder
// ============================================

const JULIANA_TEMPERAMENT: TemperamentProfile = {
  primary: 'choleric',
  secondary: 'sanguine',
  scores: { sanguine: 72, choleric: 78, melancholic: 35, phlegmatic: 15 },
  confidence: 75,
  analyzedAt: new Date().toISOString(),
  description: 'Blend Colérico-Sanguíneo. Visionária com energia para executar.',
  strengths: ['Visão estratégica', 'Carisma', 'Execução rápida', 'Inspiradora'],
  weaknesses: ['Impulsiva', 'Pode ignorar detalhes', 'Multitarefa excessiva'],
  communicationStyle: 'Mistura de objetividade com entusiasmo. Alterna entre big picture e ação.',
  salesApproach: [
    'Comece com a visão, termine com ação',
    'Mostre como ela será pioneira',
    'Use analogias com startups de sucesso',
    'Seja flexível - ela muda de ideia rápido',
    'Destaque velocidade de implementação'
  ]
};

const JULIANA_BEHAVIOR: ContactBehavior = {
  discProfile: 'D',
  discConfidence: 72,
  preferredChannel: 'whatsapp',
  formalityLevel: 2,
  decisionCriteria: ['innovation', 'speed', 'reputation'],
  needsApproval: false,
  decisionPower: 10,
  supportLevel: 5,
  influencedByIds: [],
  influencesIds: [],
  currentChallenges: ['Captar Series A', 'Escalar para 10x'],
  competitorsUsed: ['Notion', 'Slack', 'Figma'],
  vakProfile: { visual: 60, auditory: 30, kinesthetic: 10, primary: 'V' },
  temperamentProfile: JULIANA_TEMPERAMENT,
  bigFiveProfile: {
    openness: 95,
    conscientiousness: 58,
    extraversion: 88,
    agreeableness: 52,
    neuroticism: 45,
    confidence: 78,
    analyzedAt: new Date().toISOString()
  },
  mbtiProfile: {
    type: 'ENTP',
    confidence: 78,
    dimensions: {
      E_I: { E: 85, I: 15 },
      S_N: { S: 18, N: 82 },
      T_F: { T: 62, F: 38 },
      J_P: { J: 35, P: 65 }
    },
    analyzedAt: new Date().toISOString()
  },
  enneagramProfile: {
    type: 3,
    wing: 7,
    confidence: 72,
    scores: { 1: 42, 2: 48, 3: 85, 4: 38, 5: 55, 6: 32, 7: 78, 8: 72, 9: 25 },
    analyzedAt: new Date().toISOString()
  }
};

export const DEMO_CONTACT_JULIANA: Contact = {
  id: 'demo-juliana',
  firstName: 'Juliana',
  lastName: 'Ferreira',
  companyId: '',
  companyName: 'RocketScale (Startup)',
  role: 'decision_maker',
  roleTitle: 'Founder & CEO',
  relationshipStage: 'negotiation',
  relationshipScore: 82,
  sentiment: 'positive',
  interactionCount: 12,
  tags: ['Startup', 'Inovadora', 'Fast-Mover', 'Founder'],
  hobbies: ['Surf', 'Podcasts de startups', 'Networking events'],
  interests: ['Venture Capital', 'Product-Led Growth', 'Web3'],
  lifeEvents: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  behavior: JULIANA_BEHAVIOR
};

export const JULIANA_COPY_ANALYSIS: CopyAnalysis = {
  id: 'analysis-juliana-001',
  originalText: 'Ju! 🚀 Lembra que você falou de escalar 10x? A Stripe cresceu 40% no Q1 usando exatamente isso. Posso te mostrar em 10 min como aplicar no RocketScale. Amanhã às 9h?',
  readability: {
    fleschScore: 78,
    avgSentenceLength: 10,
    avgWordLength: 4.8,
    complexWordPercentage: 8,
    level: 'facil',
    recommendation: 'Tom perfeito para founder - informal mas com substância.'
  },
  triggerDensity: {
    totalTriggers: 5,
    triggersPerSentence: 1.25,
    dominantTriggers: ['social_proof', 'authority', 'curiosity'],
    missingTriggers: [],
    saturationLevel: 'optimal',
    recommendation: 'Excelente mix de urgência e prova social.'
  },
  persuasionScore: 88,
  emotionalScore: 75,
  clarityScore: 78,
  ctaStrength: 92,
  issues: [],
  strengths: [
    'Referência a conversa anterior (continuidade)',
    'Benchmark com empresa admirada (Stripe)',
    'Número específico e verificável (40%)',
    'CTA super específico (10 min, amanhã 9h)',
    'Tom casual mas profissional'
  ],
  generatedAt: new Date().toISOString()
};

// ============================================
// COMPLETE GALLERY EXPORT
// ============================================

export const DEMO_CONTACTS_GALLERY: Contact[] = [
  DEMO_CONTACT_MARIA,
  DEMO_CONTACT_PEDRO,
  DEMO_CONTACT_ANA,
  DEMO_CONTACT_CARLOS,
  DEMO_CONTACT_JULIANA
];

export const DEMO_COPY_ANALYSES: Record<string, CopyAnalysis> = {
  'demo-maria': MARIA_COPY_ANALYSIS,
  'demo-pedro': PEDRO_COPY_ANALYSIS,
  'demo-ana': ANA_COPY_ANALYSIS,
  'demo-carlos': CARLOS_COPY_ANALYSIS,
  'demo-juliana': JULIANA_COPY_ANALYSIS
};

// Helper to get analysis by contact ID
export function getDemoCopyAnalysis(contactId: string): CopyAnalysis | null {
  return DEMO_COPY_ANALYSES[contactId] || null;
}

// Helper to get contact by ID
export function getDemoContact(contactId: string): Contact | null {
  return DEMO_CONTACTS_GALLERY.find(c => c.id === contactId) || null;
}

// Profile distribution summary
export const DEMO_PROFILE_SUMMARY = {
  discDistribution: {
    D: ['demo-maria', 'demo-juliana'],
    I: ['demo-pedro'],
    S: ['demo-ana'],
    C: ['demo-carlos']
  },
  temperamentDistribution: {
    choleric: ['demo-maria', 'demo-juliana'],
    sanguine: ['demo-pedro'],
    phlegmatic: ['demo-ana'],
    melancholic: ['demo-carlos']
  },
  mbtiDistribution: {
    ENTJ: ['demo-maria'],
    ENFP: ['demo-pedro'],
    ISFJ: ['demo-ana'],
    ISTJ: ['demo-carlos'],
    ENTP: ['demo-juliana']
  }
};
