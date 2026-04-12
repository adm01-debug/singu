import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactDeal {
  id: string;
  contact_id: string | null;
  company_id?: string;
  titulo: string;
  valor?: number;
  status?: string;
  pipeline_stage?: string;
  probabilidade?: number;
  previsao_fechamento?: string;
  closed_at?: string;
  motivo_perda?: string;
  notas?: string;
  metadata?: Record<string, unknown>;
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
