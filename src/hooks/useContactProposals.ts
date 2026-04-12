import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactProposal {
  id: string;
  contact_id: string;
  deal_id?: string;
  title: string;
  value?: number;
  status?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useContactProposals(contactId?: string) {
  return useQuery({
    queryKey: ['contact-proposals', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactProposal>({
        table: 'proposals',
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
