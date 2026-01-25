// ==============================================
// TRIGGER A/B TESTING HOOK
// Manages neural A/B tests for trigger effectiveness
// ==============================================

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { AllTriggerTypes } from '@/types/triggers-advanced';

export interface TriggerABTest {
  id: string;
  user_id: string;
  contact_id: string | null;
  name: string;
  disc_profile: string | null;
  variant_a_trigger: string;
  variant_a_template: string | null;
  variant_a_uses: number;
  variant_a_conversions: number;
  variant_a_avg_rating: number;
  variant_b_trigger: string;
  variant_b_template: string | null;
  variant_b_uses: number;
  variant_b_conversions: number;
  variant_b_avg_rating: number;
  winner: 'A' | 'B' | 'tie' | null;
  confidence: number;
  is_active: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateABTestInput {
  name: string;
  contact_id?: string | null;
  disc_profile?: string | null;
  variant_a_trigger: AllTriggerTypes;
  variant_a_template?: string;
  variant_b_trigger: AllTriggerTypes;
  variant_b_template?: string;
}

export interface RecordVariantUsageInput {
  test_id: string;
  variant: 'A' | 'B';
  converted: boolean;
  rating?: number;
}

export function useTriggerABTesting(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch active tests for contact or portfolio-wide
  const { data: activeTests, isLoading } = useQuery({
    queryKey: ['trigger-ab-tests', user?.id, contactId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('trigger_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('started_at', { ascending: false });

      if (contactId) {
        query = query.or(`contact_id.eq.${contactId},contact_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TriggerABTest[];
    },
    enabled: !!user?.id,
  });

  // Fetch completed tests with results
  const { data: completedTests } = useQuery({
    queryKey: ['trigger-ab-tests-completed', user?.id, contactId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('trigger_ab_tests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', false)
        .not('winner', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TriggerABTest[];
    },
    enabled: !!user?.id,
  });

  // Create new A/B test
  const createTestMutation = useMutation({
    mutationFn: async (input: CreateABTestInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('trigger_ab_tests')
        .insert({
          user_id: user.id,
          name: input.name,
          contact_id: input.contact_id || null,
          disc_profile: input.disc_profile || null,
          variant_a_trigger: input.variant_a_trigger,
          variant_a_template: input.variant_a_template || null,
          variant_b_trigger: input.variant_b_trigger,
          variant_b_template: input.variant_b_template || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TriggerABTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-ab-tests'] });
      toast.success('Teste A/B criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar teste A/B');
      console.error(error);
    },
  });

  // Record variant usage
  const recordUsageMutation = useMutation({
    mutationFn: async ({ test_id, variant, converted, rating }: RecordVariantUsageInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      // First, get the current test
      const { data: test, error: fetchError } = await supabase
        .from('trigger_ab_tests')
        .select('*')
        .eq('id', test_id)
        .single();

      if (fetchError) throw fetchError;
      if (!test) throw new Error('Test not found');

      // Calculate new values
      const variantPrefix = variant === 'A' ? 'variant_a' : 'variant_b';
      const currentUses = test[`${variantPrefix}_uses` as keyof typeof test] as number || 0;
      const currentConversions = test[`${variantPrefix}_conversions` as keyof typeof test] as number || 0;
      const currentAvgRating = test[`${variantPrefix}_avg_rating` as keyof typeof test] as number || 0;

      const newUses = currentUses + 1;
      const newConversions = converted ? currentConversions + 1 : currentConversions;
      const newAvgRating = rating 
        ? ((currentAvgRating * currentUses) + rating) / newUses 
        : currentAvgRating;

      // Update the test
      const updateData: Record<string, number> = {
        [`${variantPrefix}_uses`]: newUses,
        [`${variantPrefix}_conversions`]: newConversions,
        [`${variantPrefix}_avg_rating`]: Math.round(newAvgRating * 100) / 100,
      };

      const { data, error } = await supabase
        .from('trigger_ab_tests')
        .update(updateData)
        .eq('id', test_id)
        .select()
        .single();

      if (error) throw error;

      // Check if we should conclude the test
      const updatedTest = data as TriggerABTest;
      const totalUses = updatedTest.variant_a_uses + updatedTest.variant_b_uses;
      
      if (totalUses >= 30) {
        // Calculate statistical confidence and determine winner
        await concludeTest(updatedTest);
      }

      return data as TriggerABTest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-ab-tests'] });
    },
  });

  // Conclude test and determine winner
  const concludeTest = async (test: TriggerABTest) => {
    const rateA = test.variant_a_uses > 0 
      ? test.variant_a_conversions / test.variant_a_uses 
      : 0;
    const rateB = test.variant_b_uses > 0 
      ? test.variant_b_conversions / test.variant_b_uses 
      : 0;

    // Simple confidence calculation
    const totalSamples = test.variant_a_uses + test.variant_b_uses;
    const baseConfidence = Math.min(95, 50 + (totalSamples / 2));
    const rateDiff = Math.abs(rateA - rateB);
    const confidence = Math.round(baseConfidence * (1 + rateDiff));

    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (rateDiff > 0.1) {
      winner = rateA > rateB ? 'A' : 'B';
    } else if (test.variant_a_avg_rating !== test.variant_b_avg_rating) {
      winner = test.variant_a_avg_rating > test.variant_b_avg_rating ? 'A' : 'B';
    }

    await supabase
      .from('trigger_ab_tests')
      .update({
        is_active: false,
        winner,
        confidence: Math.min(99, confidence),
        completed_at: new Date().toISOString(),
      })
      .eq('id', test.id);

    toast.info(`Teste A/B concluído! Vencedor: Variante ${winner}`);
  };

  // Get recommended variant for a test
  const getRecommendedVariant = useCallback((testId: string): 'A' | 'B' => {
    const test = activeTests?.find(t => t.id === testId);
    if (!test) return 'A';

    // Thompson Sampling simplified: explore less used variant
    const totalUses = test.variant_a_uses + test.variant_b_uses;
    if (totalUses < 10) {
      // Early exploration: alternate
      return totalUses % 2 === 0 ? 'A' : 'B';
    }

    // Exploit: use better performing variant more often
    const rateA = test.variant_a_uses > 0 
      ? test.variant_a_conversions / test.variant_a_uses 
      : 0.5;
    const rateB = test.variant_b_uses > 0 
      ? test.variant_b_conversions / test.variant_b_uses 
      : 0.5;

    // 80% exploit, 20% explore
    if (Math.random() < 0.2) {
      return Math.random() < 0.5 ? 'A' : 'B';
    }
    
    return rateA >= rateB ? 'A' : 'B';
  }, [activeTests]);

  // Get winning triggers
  const getWinningTriggers = useCallback((): { trigger: AllTriggerTypes; wins: number }[] => {
    if (!completedTests) return [];

    const winCounts = new Map<string, number>();
    
    completedTests.forEach(test => {
      if (test.winner === 'A') {
        const count = winCounts.get(test.variant_a_trigger) || 0;
        winCounts.set(test.variant_a_trigger, count + 1);
      } else if (test.winner === 'B') {
        const count = winCounts.get(test.variant_b_trigger) || 0;
        winCounts.set(test.variant_b_trigger, count + 1);
      }
    });

    return Array.from(winCounts.entries())
      .map(([trigger, wins]) => ({ trigger: trigger as AllTriggerTypes, wins }))
      .sort((a, b) => b.wins - a.wins);
  }, [completedTests]);

  return {
    activeTests: activeTests || [],
    completedTests: completedTests || [],
    isLoading,
    
    createTest: createTestMutation.mutate,
    recordUsage: recordUsageMutation.mutate,
    
    getRecommendedVariant,
    getWinningTriggers,
    
    isCreating: createTestMutation.isPending,
    isRecording: recordUsageMutation.isPending,
  };
}
