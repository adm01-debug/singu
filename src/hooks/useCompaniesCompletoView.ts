import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export function useCompaniesCompletoView(companyId?: string) {
  return useQuery({
    queryKey: ['vw-companies-completo', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_companies_completo',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}
