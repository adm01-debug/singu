import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export function useUsageKpisView() {
  return useQuery({
    queryKey: ['vw-singu-usage-kpis'],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_usage_kpis',
        select: '*',
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}
