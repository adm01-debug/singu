import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export function useDataHealthView() {
  return useQuery({
    queryKey: ['vw-singu-data-health'],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_data_health',
        select: '*',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}
