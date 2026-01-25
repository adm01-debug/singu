// ==============================================
// TRIGGER INTENSITY HISTORY HOOK
// Tracks intensity levels used with each contact
// ==============================================

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { AllTriggerTypes } from '@/types/triggers-advanced';

export type IntensityResult = 'success' | 'neutral' | 'failure' | 'resistance';

export interface IntensityHistoryRecord {
  id: string;
  user_id: string;
  contact_id: string;
  trigger_type: string;
  intensity_level: 1 | 2 | 3 | 4 | 5;
  result: IntensityResult | null;
  notes: string | null;
  interaction_id: string | null;
  created_at: string;
}

export interface RecordIntensityInput {
  contact_id: string;
  trigger_type: AllTriggerTypes;
  intensity_level: 1 | 2 | 3 | 4 | 5;
  result?: IntensityResult;
  notes?: string;
  interaction_id?: string;
}

export interface IntensityAnalysis {
  triggerId: AllTriggerTypes;
  avgIntensityUsed: number;
  bestIntensity: number;
  worstIntensity: number;
  resistanceThreshold: number;
  recommendedNext: number;
}

export function useTriggerIntensityHistory(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch intensity history for contact
  const { data: history, isLoading } = useQuery({
    queryKey: ['trigger-intensity-history', user?.id, contactId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('trigger_intensity_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as IntensityHistoryRecord[];
    },
    enabled: !!user?.id,
  });

  // Record intensity usage
  const recordMutation = useMutation({
    mutationFn: async (input: RecordIntensityInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trigger_intensity_history')
        .insert({
          user_id: user.id,
          contact_id: input.contact_id,
          trigger_type: input.trigger_type,
          intensity_level: input.intensity_level,
          result: input.result || null,
          notes: input.notes || null,
          interaction_id: input.interaction_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as IntensityHistoryRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-intensity-history'] });
    },
  });

  // Update result for an intensity record
  const updateResultMutation = useMutation({
    mutationFn: async ({ id, result, notes }: { id: string; result: IntensityResult; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const updateData: { result: IntensityResult; notes?: string } = { result };
      if (notes) updateData.notes = notes;

      const { data, error } = await supabase
        .from('trigger_intensity_history')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as IntensityHistoryRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-intensity-history'] });
    },
  });

  // Analyze intensity patterns for a trigger
  const analyzeIntensity = useCallback((triggerId: AllTriggerTypes): IntensityAnalysis | null => {
    if (!history) return null;

    const triggerHistory = history.filter(h => h.trigger_type === triggerId);
    if (triggerHistory.length === 0) return null;

    // Calculate average intensity used
    const avgIntensity = triggerHistory.reduce((sum, h) => sum + h.intensity_level, 0) / triggerHistory.length;

    // Find best intensity (most successes)
    const intensityCounts = new Map<number, { success: number; total: number }>();
    triggerHistory.forEach(h => {
      const existing = intensityCounts.get(h.intensity_level) || { success: 0, total: 0 };
      intensityCounts.set(h.intensity_level, {
        success: h.result === 'success' ? existing.success + 1 : existing.success,
        total: existing.total + 1,
      });
    });

    let bestIntensity: 1 | 2 | 3 | 4 | 5 = 2;
    let bestRate = 0;
    let worstIntensity: 1 | 2 | 3 | 4 | 5 = 2;
    let worstRate = 1;

    intensityCounts.forEach((stats, level) => {
      const rate = stats.total > 0 ? stats.success / stats.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestIntensity = level as 1 | 2 | 3 | 4 | 5;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstIntensity = level as 1 | 2 | 3 | 4 | 5;
      }
    });

    // Find resistance threshold
    const resistanceHistory = triggerHistory.filter(h => h.result === 'resistance');
    const resistanceThreshold = resistanceHistory.length > 0
      ? Math.min(...resistanceHistory.map(h => h.intensity_level))
      : 5;

    // Calculate recommended next intensity
    const lastUsed = triggerHistory[0]?.intensity_level || 2;
    const lastResult = triggerHistory[0]?.result;
    
    let recommendedNext = lastUsed;
    if (lastResult === 'success' && lastUsed < 4) {
      recommendedNext = Math.min(resistanceThreshold - 1, lastUsed + 1) as 1 | 2 | 3 | 4 | 5;
    } else if (lastResult === 'failure' || lastResult === 'resistance') {
      recommendedNext = Math.max(1, lastUsed - 1) as 1 | 2 | 3 | 4 | 5;
    }

    return {
      triggerId,
      avgIntensityUsed: Math.round(avgIntensity * 10) / 10,
      bestIntensity,
      worstIntensity,
      resistanceThreshold,
      recommendedNext,
    };
  }, [history]);

  // Get overall intensity profile for contact
  const intensityProfile = useMemo(() => {
    if (!history || history.length === 0) return null;

    const results = {
      totalRecords: history.length,
      avgIntensity: 0,
      successRate: 0,
      resistanceRate: 0,
      intensityDistribution: {} as Record<number, number>,
      bestApproach: 'moderate' as 'gentle' | 'moderate' | 'aggressive',
    };

    let totalIntensity = 0;
    let successCount = 0;
    let resistanceCount = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    history.forEach(h => {
      totalIntensity += h.intensity_level;
      distribution[h.intensity_level]++;
      if (h.result === 'success') successCount++;
      if (h.result === 'resistance') resistanceCount++;
    });

    results.avgIntensity = Math.round((totalIntensity / history.length) * 10) / 10;
    results.successRate = Math.round((successCount / history.length) * 100);
    results.resistanceRate = Math.round((resistanceCount / history.length) * 100);
    results.intensityDistribution = distribution;

    // Determine best approach
    if (results.resistanceRate > 20 || results.avgIntensity > 3.5) {
      results.bestApproach = 'gentle';
    } else if (results.successRate > 60 && results.avgIntensity > 2.5) {
      results.bestApproach = 'aggressive';
    } else {
      results.bestApproach = 'moderate';
    }

    return results;
  }, [history]);

  // Get last intensity used for a trigger
  const getLastIntensity = useCallback((triggerId: AllTriggerTypes): number | null => {
    if (!history) return null;
    const last = history.find(h => h.trigger_type === triggerId);
    return last?.intensity_level || null;
  }, [history]);

  return {
    history: history || [],
    isLoading,
    
    recordIntensity: recordMutation.mutate,
    updateResult: updateResultMutation.mutate,
    isRecording: recordMutation.isPending,
    
    analyzeIntensity,
    intensityProfile,
    getLastIntensity,
  };
}
