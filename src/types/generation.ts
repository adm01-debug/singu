// Generational Analysis Types
// Sistema de Inteligência Geracional integrado com frameworks comportamentais

export type GenerationType = 'silent' | 'baby_boomer' | 'gen_x' | 'millennial' | 'gen_z' | 'gen_alpha';

export interface GenerationProfile {
  type: GenerationType;
  name: string;
  shortName: string;
  yearRange: { start: number; end: number };
  ageRange: { min: number; max: number }; // Calculado dinamicamente
  color: string;
  icon: string;
  
  // Características Core
  coreValues: string[];
  formativeEvents: string[];
  workStyle: string;
  communicationStyle: string;
  decisionMaking: string;
  
  // Preferências de Comunicação
  preferredChannels: string[];
  avoidChannels: string[];
  responseExpectation: string;
  contentPreference: string;
  
  // Gatilhos e Objeções
  effectiveTriggers: string[];
  ineffectiveTriggers: string[];
  commonObjections: string[];
  persuasionApproach: string;
  
  // Integração com DISC
  discTendencies: {
    mostCommon: ('D' | 'I' | 'S' | 'C')[];
    adaptationTips: string[];
  };
  
  // Integração com VAK
  vakTendencies: {
    dominant: 'V' | 'A' | 'K';
    secondary: 'V' | 'A' | 'K';
    languagePatterns: string[];
  };
  
  // Integração com Neuromarketing
  neuroProfile: {
    dominantBrain: 'reptilian' | 'limbic' | 'neocortex';
    keyMotivators: string[];
    fearDrivers: string[];
    dopamineTriggers: string[];
  };
  
  // Integração com Carnegie
  carnegieApproach: {
    principlesEmphasis: string[];
    rapportBuilders: string[];
    influenceTechniques: string[];
  };
  
  // Vendas e Negociação
  salesApproach: {
    openingStrategies: string[];
    presentationStyle: string;
    closingTechniques: string[];
    followUpPreference: string;
  };
  
  // Tecnologia e Digital
  techProfile: {
    digitalFluency: 'low' | 'medium' | 'high' | 'native';
    preferredPlatforms: string[];
    contentConsumption: string;
    privacyConcern: 'low' | 'medium' | 'high';
  };
}

export interface GenerationalAnalysis {
  generation: GenerationProfile;
  confidence: number;
  birthYear: number;
  age: number;
  
  // Cruzamento com perfil atual
  discAlignment: {
    score: number;
    insights: string[];
  };
  vakAlignment: {
    score: number;
    insights: string[];
  };
  neuroAlignment: {
    score: number;
    insights: string[];
  };
  
  // Recomendações personalizadas
  recommendations: {
    communication: string[];
    approach: string[];
    avoid: string[];
  };
}

export interface GenerationalCrossAnalysis {
  contact: {
    generation: GenerationType;
    profile: GenerationProfile;
  };
  salesperson: {
    generation: GenerationType;
    profile: GenerationProfile;
  };
  compatibility: {
    score: number;
    strengths: string[];
    challenges: string[];
    bridgingStrategies: string[];
  };
}
