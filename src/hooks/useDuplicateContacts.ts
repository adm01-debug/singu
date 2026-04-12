import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

interface DuplicateContact {
  id?: string;
  contact_id?: string;
  duplicate_of?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  similarity_score?: number;
  [key: string]: unknown;
}

export function useDuplicateContacts(enabled = true) {
  return useQuery({
    queryKey: ['duplicate-contacts'],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<DuplicateContact[]>(
          'get_duplicate_contacts',
          {}
        );
        if (error) {
          console.warn('[DuplicateContacts] RPC error (known schema issue):', error);
          return [] as DuplicateContact[];
        }
        return (Array.isArray(data) ? data : []) as DuplicateContact[];
      } catch (e) {
        console.warn('[DuplicateContacts] Fetch failed:', e);
        return [] as DuplicateContact[];
      }
    },
    enabled,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}
