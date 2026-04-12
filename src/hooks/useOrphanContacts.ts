import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

interface OrphanContact {
  id?: string;
  contact_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useOrphanContacts(enabled = true) {
  return useQuery({
    queryKey: ['orphan-contacts'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<OrphanContact[]>(
        'get_orphan_contacts',
        {}
      );
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as OrphanContact[];
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  });
}
