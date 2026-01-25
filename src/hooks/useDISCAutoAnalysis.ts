// ==============================================
// DISC Auto Analysis Hook - Trigger on New Interactions
// Enterprise Level Feature
// ==============================================

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDISCAnalysis } from './useDISCAnalysis';

interface AutoAnalysisConfig {
  minTextLength: number;
  cooldownMinutes: number;
  enabledTypes: string[];
}

const DEFAULT_CONFIG: AutoAnalysisConfig = {
  minTextLength: 100,
  cooldownMinutes: 30,
  enabledTypes: ['call', 'meeting', 'video_call', 'email', 'whatsapp']
};

export function useDISCAutoAnalysis(contactId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { analyzeText, fetchLatestAnalysis } = useDISCAnalysis(contactId);
  const lastAnalysisRef = useRef<Date | null>(null);
  const isAnalyzingRef = useRef(false);

  const shouldTriggerAnalysis = useCallback(async (
    interactionType: string,
    content: string,
    config: AutoAnalysisConfig = DEFAULT_CONFIG
  ): Promise<boolean> => {
    // Check if interaction type is enabled
    if (!config.enabledTypes.includes(interactionType)) {
      return false;
    }

    // Check minimum text length
    if (content.length < config.minTextLength) {
      return false;
    }

    // Check cooldown
    if (lastAnalysisRef.current) {
      const cooldownMs = config.cooldownMinutes * 60 * 1000;
      const elapsed = Date.now() - lastAnalysisRef.current.getTime();
      if (elapsed < cooldownMs) {
        return false;
      }
    }

    // Check if already analyzing
    if (isAnalyzingRef.current) {
      return false;
    }

    return true;
  }, []);

  const triggerAutoAnalysis = useCallback(async (
    interactionId: string,
    interactionType: string,
    content: string,
    transcription?: string
  ) => {
    if (!user || !contactId) return null;

    const fullText = [content, transcription].filter(Boolean).join('\n\n');
    
    const shouldAnalyze = await shouldTriggerAnalysis(interactionType, fullText);
    if (!shouldAnalyze) {
      return null;
    }

    isAnalyzingRef.current = true;

    try {
      // Get recent interactions for context
      const { data: recentInteractions } = await supabase
        .from('interactions')
        .select('content, transcription')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5);

      const allTexts = [
        fullText,
        ...(recentInteractions || []).map(i => 
          [i.content, i.transcription].filter(Boolean).join(' ')
        )
      ].filter(Boolean);

      // Call AI analysis via edge function
      const { data, error } = await supabase.functions.invoke('disc-analyzer', {
        body: {
          texts: allTexts,
          contactId,
          interactionId,
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      lastAnalysisRef.current = new Date();

      // Show success toast with mini-celebration
      if (data?.success && data?.analysis) {
        const profile = data.analysis.primaryProfile;
        const blend = data.analysis.blendProfile;
        const confidence = data.analysis.confidence;

        toast({
          title: `🎯 Perfil DISC Detectado: ${blend || profile}`,
          description: `Confiança: ${confidence}%. Estratégias de vendas atualizadas automaticamente.`,
        });
      }

      return data;
    } catch (error) {
      console.error('Auto DISC analysis error:', error);
      
      // Fallback to local analysis
      try {
        const result = await analyzeText([fullText], interactionId);
        if (result) {
          toast({
            title: `📊 Perfil DISC Atualizado (Local)`,
            description: `Perfil: ${result.primaryProfile}. Análise offline aplicada.`,
          });
        }
        return result;
      } catch {
        return null;
      }
    } finally {
      isAnalyzingRef.current = false;
    }
  }, [user, contactId, shouldTriggerAnalysis, analyzeText, toast]);

  const getLastAnalysisTime = useCallback(() => {
    return lastAnalysisRef.current;
  }, []);

  const resetCooldown = useCallback(() => {
    lastAnalysisRef.current = null;
  }, []);

  return {
    triggerAutoAnalysis,
    shouldTriggerAnalysis,
    getLastAnalysisTime,
    resetCooldown,
    isAnalyzing: isAnalyzingRef.current
  };
}
