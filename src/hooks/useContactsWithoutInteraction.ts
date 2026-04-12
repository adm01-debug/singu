import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface ContactWithoutInteraction {
  contact_id: string;
  contact_name: string;
  created_at: string;
  days_since_creation: number;
}

export function useContactsWithoutInteraction(limit = 20) {
  return useQuery({
    queryKey: ['contacts-without-interaction', limit],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ContactWithoutInteraction[]>(
        'get_contacts_without_interaction',
        { p_limit: limit }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
