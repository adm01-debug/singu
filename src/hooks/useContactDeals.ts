import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactDeal {
  id: string;
  contact_id: string;
  company_id?: string;
  title: string;
  value?: number;
  currency?: string;
  stage?: string;
  status?: string;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  lost_reason?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useContactDeals(contactId?: string) {
  return useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactDeal>({
        table: 'deals',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
  });
}
