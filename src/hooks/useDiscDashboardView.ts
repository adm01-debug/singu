import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export function useDiscDashboardView() {
  return useQuery({
    queryKey: ['vw-singu-disc-dashboard'],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_disc_dashboard',
        select: '*',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
