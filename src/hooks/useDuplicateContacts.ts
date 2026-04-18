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

let schemaBroken = false;

function isSchemaError(err: unknown): boolean {
  const msg = typeof err === 'string' ? err : (err as { message?: string })?.message || '';
  return /does not exist|is ambiguous|column .* not found/i.test(msg);
}

export function useDuplicateContacts(enabled = true) {
  return useQuery({
    queryKey: ['duplicate-contacts'],
    enabled: enabled && !schemaBroken,
    queryFn: async () => {
      // Defer this non-critical check to avoid blocking page load
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { data, error } = await callExternalRpc<DuplicateContact[]>(
          'get_duplicate_contacts',
          {}
        );
        if (error) {
          if (isSchemaError(error)) {
            schemaBroken = true;
            logger.warn('get_duplicate_contacts disabled for session (schema mismatch)');
          } else {
            logger.warn('[DuplicateContacts] RPC error:', error);
          }
          return [] as DuplicateContact[];
        }
        return (Array.isArray(data) ? data : []) as DuplicateContact[];
      } catch (e) {
        logger.warn('[DuplicateContacts] Fetch failed:', e);
        return [] as DuplicateContact[];
      }
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
