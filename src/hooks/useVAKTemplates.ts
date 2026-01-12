import { useMemo } from 'react';
import { Contact } from '@/types';
import { VAKType, VAKProfile } from '@/types/vak';
import { VAK_ADAPTED_TEMPLATES, VAKAdaptedTemplate, VAKTemplateVariation } from '@/data/vakTemplates';
import { PersuasionScenario, MENTAL_TRIGGERS } from '@/types/triggers';
import { useVAKAnalysis } from './useVAKAnalysis';
import { getBehavior, getVAKPrimary, getVAKSecondary, getVAKConfidence } from '@/types/behavior';

export interface AdaptedTemplate {
  id: string;
  title: string;
  trigger: string;
  triggerInfo: typeof MENTAL_TRIGGERS[keyof typeof MENTAL_TRIGGERS] | null;
  scenario?: PersuasionScenario;
  template: string;
  variables: string[];
  tips: string[];
  keywords: string[];
  channel: string;
  vakType: VAKType;
  matchScore: number; // 0-100 based on VAK profile confidence
  adaptationReason: string;
}

export interface VAKTemplatesResult {
  adaptedTemplates: AdaptedTemplate[];
  contactVAKProfile: VAKProfile | null;
  isLoading: boolean;
  filterByScenario: (scenario: PersuasionScenario | 'all') => AdaptedTemplate[];
  filterByTrigger: (trigger: string) => AdaptedTemplate[];
  getAlternativeVariations: (templateId: string) => {
    vakType: VAKType;
    template: string;
    keywords: string[];
  }[];
}

export function useVAKTemplates(contact: Contact): VAKTemplatesResult {
  const { getContactVAKProfile, analyzing } = useVAKAnalysis();

  // Get contact's VAK profile
  const contactVAKProfile = useMemo(() => {
    return null as VAKProfile | null;
  }, []);

  // Generate adapted templates based on contact's VAK profile or default to all
  const adaptedTemplates = useMemo(() => {
    const behaviorData = getBehavior(contact.behavior);
    const primaryVAK = getVAKPrimary(contact.behavior) ?? 'V';
    const secondaryVAK = getVAKSecondary(contact.behavior);
    const confidence = getVAKConfidence(contact.behavior);

    const templates: AdaptedTemplate[] = [];

    VAK_ADAPTED_TEMPLATES.forEach((vakTemplate) => {
      // Get the primary VAK variation
      const primaryVariation = vakTemplate.variations.find(v => v.vakType === primaryVAK);
      if (primaryVariation) {
        const triggerInfo = MENTAL_TRIGGERS[vakTemplate.trigger as keyof typeof MENTAL_TRIGGERS] || null;
        
        templates.push({
          id: `${vakTemplate.id}-${primaryVAK}`,
          title: `${vakTemplate.baseTitle} (${primaryVAK})`,
          trigger: vakTemplate.trigger,
          triggerInfo,
          scenario: vakTemplate.scenario,
          template: primaryVariation.template,
          variables: vakTemplate.variables,
          tips: [...primaryVariation.tips, ...vakTemplate.universalTips],
          keywords: primaryVariation.keywords,
          channel: vakTemplate.channel,
          vakType: primaryVAK,
          matchScore: confidence,
          adaptationReason: `Adaptado para perfil ${getVAKLabel(primaryVAK)} (${confidence}% confiança)`,
        });
      }

      // If there's a secondary VAK with good confidence, also suggest that
      if (secondaryVAK && confidence > 60) {
        const secondaryVariation = vakTemplate.variations.find(v => v.vakType === secondaryVAK);
        if (secondaryVariation) {
          const triggerInfo = MENTAL_TRIGGERS[vakTemplate.trigger as keyof typeof MENTAL_TRIGGERS] || null;
          
          templates.push({
            id: `${vakTemplate.id}-${secondaryVAK}`,
            title: `${vakTemplate.baseTitle} (${secondaryVAK})`,
            trigger: vakTemplate.trigger,
            triggerInfo,
            scenario: vakTemplate.scenario,
            template: secondaryVariation.template,
            variables: vakTemplate.variables,
            tips: [...secondaryVariation.tips, ...vakTemplate.universalTips],
            keywords: secondaryVariation.keywords,
            channel: vakTemplate.channel,
            vakType: secondaryVAK,
            matchScore: Math.round(confidence * 0.7), // Secondary has lower score
            adaptationReason: `Alternativa para perfil ${getVAKLabel(secondaryVAK)} (secundário)`,
          });
        }
      }
    });

    // Sort by match score
    return templates.sort((a, b) => b.matchScore - a.matchScore);
  }, [contact]);

  const filterByScenario = (scenario: PersuasionScenario | 'all'): AdaptedTemplate[] => {
    if (scenario === 'all') return adaptedTemplates;
    return adaptedTemplates.filter(t => t.scenario === scenario);
  };

  const filterByTrigger = (trigger: string): AdaptedTemplate[] => {
    return adaptedTemplates.filter(t => t.trigger === trigger);
  };

  const getAlternativeVariations = (templateId: string): {
    vakType: VAKType;
    template: string;
    keywords: string[];
  }[] => {
    // Extract base template id (without VAK suffix)
    const baseId = templateId.replace(/-[VAKD]$/, '');
    const vakTemplate = VAK_ADAPTED_TEMPLATES.find(t => t.id === baseId);
    
    if (!vakTemplate) return [];

    return vakTemplate.variations.map(v => ({
      vakType: v.vakType,
      template: v.template,
      keywords: v.keywords,
    }));
  };

  return {
    adaptedTemplates,
    contactVAKProfile,
    isLoading: analyzing,
    filterByScenario,
    filterByTrigger,
    getAlternativeVariations,
  };
}

function getVAKLabel(vak: VAKType): string {
  const labels: Record<VAKType, string> = {
    V: 'Visual',
    A: 'Auditivo',
    K: 'Cinestésico',
    D: 'Digital',
  };
  return labels[vak] || vak;
}
