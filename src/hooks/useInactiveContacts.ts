import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface InactiveContact {
  contact_id: string;
  contact_name: string;
  days_inactive: number;
  last_interaction_at: string | null;
  risk_level: string;
}

export function useInactiveContacts(limit = 20) {
  return useQuery({
    queryKey: ['inactive-contacts', limit],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<InactiveContact[]>(
        'detect_inactive_contacts',
        { p_limit: limit }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
