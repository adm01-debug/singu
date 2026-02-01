// ==============================================
// COPYWRITING SALES TOOLS - Type Definitions
// Enterprise-grade copywriting framework types
// ==============================================

// ============================================
// 1. FAB - FEATURE, ADVANTAGE, BENEFIT
// ============================================
export interface FABElement {
  id: string;
  feature: string;           // O que é (característica técnica)
  advantage: string;         // O que faz (vantagem funcional)
  benefit: string;           // Por que importa (benefício emocional)
  emotionalHook?: string;    // Gancho emocional adicional
  targetPain?: string;       // Dor que resolve
}

export interface FABTemplate {
  id: string;
  name: string;
  category: 'product' | 'service' | 'feature' | 'solution';
  template: {
    featurePrompt: string;
    advantagePrompt: string;
    benefitPrompt: string;
  };
  example: FABElement;
  powerWords: string[];
}

export interface FABAnalysis {
  elements: FABElement[];
  overallStrength: number;      // 0-100
  missingEmotionalHooks: boolean;
  suggestions: string[];
}

// ============================================
// 2. AIDA - ATTENTION, INTEREST, DESIRE, ACTION
// ============================================
export type AIDAStage = 'attention' | 'interest' | 'desire' | 'action';

export interface AIDASection {
  stage: AIDAStage;
  title: string;
  content: string;
  techniques: string[];
  powerWords: string[];
  duration?: string;          // Tempo estimado de leitura/fala
  transitionPhrase?: string;  // Frase de transição para próximo estágio
}

export interface AIDATemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'call' | 'presentation' | 'landing_page';
  targetProfile?: {
    disc?: string;
    vak?: string;
  };
  sections: AIDASection[];
  estimatedConversion: number;
  tips: string[];
}

export interface AIDAScript {
  id: string;
  contactId?: string;
  channel: string;
  sections: AIDASection[];
  totalDuration: string;
  adaptations: {
    ifPositive: string;
    ifNegative: string;
    ifNeutral: string;
  };
  generatedAt: string;
}

// ============================================
// 3. CTA - CALL TO ACTION
// ============================================
export type CTAType = 
  | 'primary'      // Ação principal
  | 'secondary'    // Ação alternativa
  | 'soft'         // Baixo comprometimento
  | 'urgent'       // Com urgência
  | 'exclusive'    // Com exclusividade
  | 'social'       // Com prova social
  | 'guarantee';   // Com garantia

export type CTAVerb = 
  | 'descobrir' | 'garantir' | 'reservar' | 'acessar' | 'começar'
  | 'aproveitar' | 'experimentar' | 'transformar' | 'conquistar' | 'dominar'
  | 'liberar' | 'desbloquear' | 'ativar' | 'receber' | 'obter';

export interface CTATemplate {
  id: string;
  type: CTAType;
  verb: CTAVerb;
  template: string;
  example: string;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  bestFor: string[];
  avoidFor: string[];
  discCompatibility: {
    D: number;  // 0-100
    I: number;
    S: number;
    C: number;
  };
}

export interface CTAVariation {
  original: string;
  variations: {
    text: string;
    type: CTAType;
    strength: number;
  }[];
  recommendedFor: {
    disc?: string;
    urgencyLevel?: string;
    channel?: string;
  };
}

// ============================================
// 4. TARGET SEGMENTATION
// ============================================
export interface TargetSegment {
  id: string;
  name: string;
  description: string;
  painPoints: string[];
  desires: string[];
  objections: string[];
  demographics?: {
    ageRange?: string;
    profession?: string;
    industry?: string;
    companySize?: string;
  };
  psychographics?: {
    values: string[];
    fears: string[];
    aspirations: string[];
  };
}

export interface IdealForSection {
  primaryAudience: string;
  secondaryAudiences: string[];
  notIdealFor: string[];
  qualifyingQuestions: string[];
  disqualifyingSignals: string[];
}

export interface SegmentationAnalysis {
  detectedSegments: TargetSegment[];
  idealForSection: IdealForSection;
  messagingRecommendations: {
    segment: string;
    keyMessage: string;
    avoidMessage: string;
  }[];
  confidence: number;
}

// ============================================
// 5. TRANSITION WORDS & CONNECTORS
// ============================================
export type TransitionCategory = 
  | 'contrast'      // Mas, porém, no entanto
  | 'addition'      // Além disso, também
  | 'cause'         // Porque, já que
  | 'consequence'   // Portanto, assim
  | 'emphasis'      // Principalmente, especialmente
  | 'example'       // Por exemplo, como
  | 'conclusion'    // Em resumo, finalmente
  | 'temporal'      // Primeiro, depois, agora
  | 'comparison';   // Assim como, da mesma forma

export interface TransitionWord {
  word: string;
  category: TransitionCategory;
  usage: string;
  example: string;
  formalLevel: 'informal' | 'neutral' | 'formal';
  persuasionStrength: number; // 1-5
}

export interface PersuasiveConnector {
  id: string;
  phrase: string;
  purpose: string;
  example: string;
  bestAfter: TransitionCategory[];
  bestBefore: TransitionCategory[];
  emotionalImpact: 'low' | 'medium' | 'high';
}

// ============================================
// 6. HEADLINE FORMULAS
// ============================================
export type HeadlineType = 
  | 'how_to'           // Como [fazer algo]
  | 'number_list'      // X maneiras de...
  | 'question'         // Você sabia que...?
  | 'command'          // Descubra, Aprenda...
  | 'testimonial'      // "Citação do cliente"
  | 'news'             // Novo, Lançamento
  | 'reason_why'       // Por que [algo acontece]
  | 'secret'           // O segredo para...
  | 'warning'          // Cuidado com...
  | 'guarantee';       // Garantido ou...

export interface HeadlineFormula {
  id: string;
  type: HeadlineType;
  formula: string;
  example: string;
  variables: string[];
  effectiveness: number; // 1-10
  bestFor: string[];
  powerWordsToUse: string[];
}

// ============================================
// 7. COMBINED COPYWRITING PROFILE
// ============================================
export interface CopywritingProfile {
  contactId?: string;
  fabAnalysis: FABAnalysis;
  aidaScript: AIDAScript;
  recommendedCTAs: CTATemplate[];
  segmentation: SegmentationAnalysis;
  headlines: HeadlineFormula[];
  transitionWords: TransitionWord[];
  overallScore: number;
  generatedAt: string;
}

// ============================================
// 8. COPYWRITING GENERATION OPTIONS
// ============================================
export interface CopywritingGenerationOptions {
  channel: 'whatsapp' | 'email' | 'call' | 'presentation' | 'landing_page';
  tone: 'formal' | 'casual' | 'urgent' | 'friendly' | 'professional';
  length: 'short' | 'medium' | 'long';
  includeEmoji: boolean;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  targetDisc?: string;
  targetVak?: string;
  productOrService?: string;
  mainBenefit?: string;
  mainPain?: string;
}
