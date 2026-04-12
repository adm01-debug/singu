import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface DealVelocityAnalysisRow {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  user_id: string | null;
  avg_days_to_close: number | null;
  current_deal_age: number | null;
  bottleneck_stage: string | null;
  velocity_score: number | null;
  stage_transitions: unknown;
  benchmark_vs_team: number | null;
  benchmark_vs_segment: number | null;
  recommendations: string[] | null;
  analyzed_at: string | null;
  created_at: string;
}

export function useDealVelocityAnalysis(contactId: string | undefined) {
  return useQuery({
    queryKey: ['deal-velocity-analysis', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await queryExternalData<DealVelocityAnalysisRow>({
        table: 'deal_velocity_analysis',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 9 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
