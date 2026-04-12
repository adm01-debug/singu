import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export function useCompaniesDuplicatasView(limit = 50) {
  return useQuery({
    queryKey: ['vw-companies-duplicatas', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_companies_duplicatas',
        select: '*',
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
