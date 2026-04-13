import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { logger } from '@/lib/logger';

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
      // Defer this non-critical check to avoid blocking page load
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { data, error } = await callExternalRpc<DuplicateContact[]>(
          'get_duplicate_contacts',
          {}
        );
        if (error) {
          logger.warn('[DuplicateContacts] RPC error (known schema issue):', error);
          return [] as DuplicateContact[];
        }
        return (Array.isArray(data) ? data : []) as DuplicateContact[];
      } catch (e) {
        logger.warn('[DuplicateContacts] Fetch failed:', e);
        return [] as DuplicateContact[];
      }
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
