import { useMemo } from 'react';
import { useExternalInteractions } from './useExternalInteractions';
import { countByChannel } from '@/lib/countByChannel';
import type { Ficha360Period } from './useFicha360Filters';

/**
 * Conta interações por canal no período ativo, ignorando o filtro de canal atual.
 * Útil para badges "potencial por canal" em UI de faceted search.
 *
 * Reutiliza `useExternalInteractions` sem `channels` — queryKey distinta garante
 * cache separado da query principal filtrada.
 */
export function useFicha360ChannelCounts(
  contactId: string | undefined,
  days: Ficha360Period,
) {
  const query = useExternalInteractions(contactId, 200, { days });

  const counts = useMemo(() => countByChannel(query.data), [query.data]);

  return {
    counts,
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}
