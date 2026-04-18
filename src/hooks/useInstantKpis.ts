import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { logger } from '@/lib/logger';

export interface InstantKpis {
  total_companies: number;
  total_contacts: number;
  total_deals: number;
  open_deals_value: number;
  deals_won_month: number;
  revenue_month: number;
  interactions_today: number;
  pending_followups: number;
  overdue_tasks: number;
}

// Session-level circuit breaker: once we detect a schema error, stop calling
let schemaBroken = false;

function isSchemaError(err: unknown): boolean {
  const msg = typeof err === 'string' ? err : (err as { message?: string })?.message || '';
  return /does not exist|is ambiguous|column .* not found/i.test(msg);
}

export function useInstantKpis() {
  return useQuery({
    queryKey: ['instant-kpis'],
    enabled: !schemaBroken,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<InstantKpis>(
        'get_instant_kpis',
        {}
      );
      if (error) {
        if (isSchemaError(error)) {
          schemaBroken = true;
          logger.warn('get_instant_kpis disabled for session (schema mismatch)');
        } else {
          logger.warn('get_instant_kpis unavailable, falling back to null', error);
        }
        return null;
      }
      return data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 0,
  });
}
