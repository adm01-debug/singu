import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface DailySummary {
  date: string;
  interactions_count: number;
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  revenue: number;
  new_companies: number;
  new_contacts: number;
  followups_completed: number;
  followups_pending: number;
}

export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (date) params.p_date = date;
      const { data, error } = await callExternalRpc<DailySummary>(
        'get_daily_summary',
        params
      );
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
