import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface EqDashboard {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  eq_score: number | null;
  eq_level: string | null;
  communication_style: unknown;
  emotional_trend: string | null;
  avg_sentiment_score: number | null;
  closing_timing: string | null;
  closing_readiness: string | null;
  disc_type: string | null;
  relationship_score: number | null;
  action_summary: string | null;
}

export function useEqDashboard(contactId: string | undefined) {
  return useQuery({
    queryKey: ['eq-dashboard', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<EqDashboard>({
        table: 'vw_eq_dashboard',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
