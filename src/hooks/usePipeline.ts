import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData, updateExternalData } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────

export interface PipelineDeal {
  id: string;
  titulo: string;
  valor: number;
  status: string;
  pipeline_stage: string;
  probabilidade: number;
  company_id: string;
  contact_id?: string;
  company_name?: string;
  contact_name?: string;
  previsao_fechamento?: string;
  dias_no_estagio_atual?: number;
  created_at: string;
}

export interface PipelineSummary {
  total_deals: number;
  total_value: number;
  weighted_value: number;
  stages: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  avg_cycle_days: number;
  conversion_rate: number;
}

export interface WeightedForecast {
  stage: string;
  count: number;
  total_value: number;
  probability: number;
  weighted_value: number;
}

export interface StageVelocity {
  stage: string;
  avg_days: number;
  median_days: number;
  deal_count: number;
}

export interface StalledDeal {
  id: string;
  titulo: string;
  valor: number;
  stage: string;
  days_stalled: number;
  company_name: string;
  contact_name?: string;
}

export interface VelocityMetrics {
  avg_cycle_days: number;
  median_cycle_days: number;
  win_rate: number;
  avg_deal_size: number;
  velocity_score: number;
}

// ── Hooks ──────────────────────────────────────────

export function useDealsPipeline() {
  return useQuery({
    queryKey: ['deals-pipeline'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<PipelineDeal[]>(
        'get_deals_pipeline',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function usePipelineSummary() {
  return useQuery({
    queryKey: ['pipeline-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<PipelineSummary>(
        'get_pipeline_summary',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeightedForecast() {
  return useQuery({
    queryKey: ['weighted-forecast'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<WeightedForecast[]>(
        'get_weighted_forecast',
        {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStageVelocity() {
  return useQuery({
    queryKey: ['stage-velocity'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<StageVelocity[]>(
        'get_stage_velocity',
        {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useStalledDeals(days = 14) {
  return useQuery({
    queryKey: ['stalled-deals', days],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<StalledDeal[]>(
        'get_stalled_deals',
        { p_days: days }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useVelocityMetrics() {
  return useQuery({
    queryKey: ['velocity-metrics'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<VelocityMetrics>(
        'get_velocity_metrics',
        {}
      );
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, newStage, probability }: {
      dealId: string;
      newStage: string;
      probability?: number;
    }) => {
      const updates: Record<string, unknown> = { pipeline_stage: newStage };
      if (probability !== undefined) updates.probabilidade = probability;
      const { error } = await updateExternalData('deals', dealId, updates);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['weighted-forecast'] });
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const { data, error } = await callExternalRpc<{ id: string }>(
        'create_deal',
        params
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
    },
  });
}
