// Hook para Análise Geracional
// Detecta geração e integra com frameworks comportamentais

import { useMemo } from 'react';
import { Contact } from '@/types';
import { GenerationType, GenerationProfile, GenerationalAnalysis, GenerationalCrossAnalysis } from '@/types/generation';
import { GENERATION_PROFILES, detectGeneration, calculateAge } from '@/data/generationalData';
import { getContactBehavior, getDISCProfile, getVAKProfile } from '@/lib/contact-utils';

interface UseGenerationalAnalysisProps {
  contact: Contact | null;
  salespersonBirthYear?: number;
}

export function useGenerationalAnalysis({ contact, salespersonBirthYear }: UseGenerationalAnalysisProps) {
  const analysis = useMemo((): GenerationalAnalysis | null => {
    if (!contact?.birthday) return null;

    const birthDate = new Date(contact.birthday);
    const birthYear = birthDate.getFullYear();
    
    if (isNaN(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear()) {
      return null;
    }

    const generationType = detectGeneration(birthYear);
    if (!generationType) return null;

    const generation = GENERATION_PROFILES[generationType];
    const age = calculateAge(birthYear);
    const behavior = getContactBehavior(contact);

    // Calcular alinhamento DISC
    const discProfile = getDISCProfile(contact);
    const discAlignment = calculateDISCAlignment(discProfile, generation);

    // Calcular alinhamento VAK
    const vakProfile = getVAKProfile(contact);
    const vakAlignment = calculateVAKAlignment(vakProfile, generation);

    // Calcular alinhamento Neuro
    const neuroAlignment = calculateNeuroAlignment(behavior, generation);

    // Gerar recomendações personalizadas
    const recommendations = generateRecommendations(generation, discProfile, vakProfile);

    return {
      generation,
      confidence: calculateConfidence(age, generation),
      birthYear,
      age,
      discAlignment,
      vakAlignment,
      neuroAlignment,
      recommendations
    };
  }, [contact]);

  // Análise cruzada vendedor x contato
  const crossAnalysis = useMemo((): GenerationalCrossAnalysis | null => {
    if (!analysis || !salespersonBirthYear) return null;

    const spGenType = detectGeneration(salespersonBirthYear);
    if (!spGenType) return null;

    const spProfile = GENERATION_PROFILES[spGenType];
    
    return {
      contact: {
        generation: analysis.generation.type,
        profile: analysis.generation
      },
      salesperson: {
        generation: spGenType,
        profile: spProfile
      },
      compatibility: calculateGenerationalCompatibility(spProfile, analysis.generation)
    };
  }, [analysis, salespersonBirthYear]);

  return {
    analysis,
    crossAnalysis,
    generation: analysis?.generation || null,
    hasData: !!analysis
  };
}

// Funções auxiliares de cálculo

function calculateDISCAlignment(
  discProfile: string | null,
  generation: GenerationProfile
): { score: number; insights: string[] } {
  const insights: string[] = [];
  let score = 70; // Score base

  if (!discProfile) {
    return { score: 50, insights: ['Perfil DISC não detectado - usando tendências geracionais'] };
  }

  const isExpectedProfile = generation.discTendencies.mostCommon.includes(discProfile as any);

  if (isExpectedProfile) {
    score = 90;
    insights.push(`Perfil ${discProfile} alinha-se com tendência típica de ${generation.name}`);
    insights.push(...generation.discTendencies.adaptationTips.slice(0, 2));
  } else {
    score = 65;
    insights.push(`Perfil ${discProfile} é atípico para ${generation.name} - adaptar abordagem`);
    insights.push(`Perfis mais comuns em ${generation.shortName}: ${generation.discTendencies.mostCommon.join(', ')}`);
    insights.push('Considerar características individuais sobre estereótipos geracionais');
  }

  return { score, insights };
}

function calculateVAKAlignment(
  vakProfile: { visual: number; auditory: number; kinesthetic: number; primary: string },
  generation: GenerationProfile
): { score: number; insights: string[] } {
  const insights: string[] = [];
  let score = 70;

  const expectedDominant = generation.vakTendencies.dominant;
  const actualDominant = vakProfile.primary;

  if (actualDominant === expectedDominant) {
    score = 90;
    insights.push(`Perfil ${actualDominant} confirma tendência ${generation.name}`);
  } else if (actualDominant === generation.vakTendencies.secondary) {
    score = 80;
    insights.push(`Perfil ${actualDominant} é secundário típico para ${generation.name}`);
  } else {
    score = 60;
    insights.push(`Perfil ${actualDominant} difere da tendência ${generation.shortName} (${expectedDominant})`);
  }

  insights.push(...generation.vakTendencies.languagePatterns.slice(0, 2).map(p => `Usar: "${p}"`));

  return { score, insights };
}

function calculateNeuroAlignment(
  behavior: any,
  generation: GenerationProfile
): { score: number; insights: string[] } {
  const insights: string[] = [];
  let score = 75;

  insights.push(`Cérebro dominante: ${translateBrain(generation.neuroProfile.dominantBrain)}`);
  insights.push(`Motivadores-chave: ${generation.neuroProfile.keyMotivators.slice(0, 2).join(', ')}`);
  insights.push(`Gatilhos de dopamina: ${generation.neuroProfile.dopamineTriggers.slice(0, 2).join(', ')}`);
  
  // Adicionar medos se relevante
  if (generation.neuroProfile.fearDrivers.length > 0) {
    insights.push(`Evitar gatilhar: ${generation.neuroProfile.fearDrivers[0]}`);
  }

  return { score, insights };
}

function translateBrain(brain: string): string {
  const translations: Record<string, string> = {
    'reptilian': 'Reptiliano (instinto)',
    'limbic': 'Límbico (emoção)',
    'neocortex': 'Neocórtex (razão)'
  };
  return translations[brain] || brain;
}

function calculateConfidence(age: number, generation: GenerationProfile): number {
  // Maior confiança quando idade está no meio do range
  const midAge = (generation.ageRange.min + generation.ageRange.max) / 2;
  const deviation = Math.abs(age - midAge);
  const range = (generation.ageRange.max - generation.ageRange.min) / 2;
  
  // Confiança base de 85%, variando conforme posição no range
  return Math.round(85 - (deviation / range) * 15);
}

function generateRecommendations(
  generation: GenerationProfile,
  discProfile: string | null,
  vakProfile: { primary: string }
): { communication: string[]; approach: string[]; avoid: string[] } {
  const communication: string[] = [
    ...generation.preferredChannels.slice(0, 2).map(c => `Preferir: ${c}`),
    `Expectativa de resposta: ${generation.responseExpectation}`,
    `Estilo: ${generation.communicationStyle}`
  ];

  const approach: string[] = [
    ...generation.effectiveTriggers.slice(0, 3).map(t => `Gatilho: ${t}`),
    ...generation.salesApproach.openingStrategies.slice(0, 2)
  ];

  const avoid: string[] = [
    ...generation.ineffectiveTriggers.slice(0, 2).map(t => `Evitar: ${t}`),
    ...generation.avoidChannels.slice(0, 2).map(c => `Não usar: ${c}`)
  ];

  return { communication, approach, avoid };
}

function calculateGenerationalCompatibility(
  salesperson: GenerationProfile,
  contact: GenerationProfile
): { score: number; strengths: string[]; challenges: string[]; bridgingStrategies: string[] } {
  const strengths: string[] = [];
  const challenges: string[] = [];
  const bridgingStrategies: string[] = [];
  let score = 70;

  // Mesma geração = alta compatibilidade base
  if (salesperson.type === contact.type) {
    score = 95;
    strengths.push('Mesma geração - comunicação natural');
    strengths.push('Referências culturais compartilhadas');
    strengths.push('Expectativas similares');
    return { score, strengths, challenges, bridgingStrategies };
  }

  // Gerações adjacentes = boa compatibilidade
  const generationOrder: GenerationType[] = ['silent', 'baby_boomer', 'gen_x', 'millennial', 'gen_z', 'gen_alpha'];
  const spIndex = generationOrder.indexOf(salesperson.type);
  const ctIndex = generationOrder.indexOf(contact.type);
  const gap = Math.abs(spIndex - ctIndex);

  if (gap === 1) {
    score = 80;
    strengths.push('Gerações adjacentes - ponte natural');
    bridgingStrategies.push('Usar pontos de conexão entre as gerações');
  } else if (gap === 2) {
    score = 65;
    challenges.push('Gap geracional moderado');
    bridgingStrategies.push('Adaptar linguagem e referências');
    bridgingStrategies.push('Focar em valores universais');
  } else {
    score = 50;
    challenges.push('Gap geracional significativo');
    challenges.push('Expectativas de comunicação muito diferentes');
    bridgingStrategies.push('Evitar estereótipos - tratar como indivíduo');
    bridgingStrategies.push('Adaptar completamente estilo de comunicação');
    bridgingStrategies.push('Buscar valores e interesses comuns');
  }

  // Adicionar forças e desafios específicos
  const sharedChannels = salesperson.preferredChannels.filter(c => 
    contact.preferredChannels.includes(c)
  );
  
  if (sharedChannels.length > 0) {
    strengths.push(`Canais em comum: ${sharedChannels.join(', ')}`);
  } else {
    challenges.push('Nenhum canal preferido em comum');
    bridgingStrategies.push(`Adaptar para canais do contato: ${contact.preferredChannels[0]}`);
  }

  // VAK compatibility
  if (salesperson.vakTendencies.dominant === contact.vakTendencies.dominant) {
    strengths.push(`Mesmo VAK dominante: ${contact.vakTendencies.dominant}`);
    score += 5;
  }

  // Brain dominance
  if (salesperson.neuroProfile.dominantBrain === contact.neuroProfile.dominantBrain) {
    strengths.push('Mesmo perfil neuro dominante');
    score += 5;
  }

  return { 
    score: Math.min(100, score), 
    strengths, 
    challenges, 
    bridgingStrategies 
  };
}

export default useGenerationalAnalysis;
