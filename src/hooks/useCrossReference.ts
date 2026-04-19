import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface CrossRefInput {
  entityIds: string[];
  entityType: 'contact' | 'company';
}

export interface CrossRefResult {
  sharedInteractions: Array<{ id: string; occurred_at: string; type: string; channel: string }>;
  sharedDeals: Array<{ id: string; title: string; value: number; stage: string }>;
  temporalOverlap: Array<{ date: string; count: number }>;
}

export function useCrossReference({ entityIds, entityType }: CrossRefInput) {
  return useQuery({
    queryKey: ['cross-reference', entityType, entityIds.sort().join(',')],
    enabled: entityIds.length >= 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CrossRefResult> => {
      const column = entityType === 'contact' ? 'contact_id' : 'company_id';

      const { data: ints } = await queryExternalData<Record<string, unknown>>({
        table: 'interactions',
        select: 'id, type, channel, occurred_at, contact_id, company_id',
        filters: [{ type: 'in', column, value: entityIds }],
        order: { column: 'occurred_at', ascending: false },
        range: { from: 0, to: 199 },
      });

      const intsList = ints || [];
      const sharedInteractions = intsList.slice(0, 30).map((i) => ({
        id: String(i.id),
        occurred_at: String(i.occurred_at),
        type: String(i.type || 'unknown'),
        channel: String(i.channel || 'unknown'),
      }));

      const buckets = new Map<string, number>();
      intsList.forEach((i) => {
        const d = String(i.occurred_at).slice(0, 10);
        buckets.set(d, (buckets.get(d) || 0) + 1);
      });
      const temporalOverlap = Array.from(buckets.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      const { data: deals } = await queryExternalData<Record<string, unknown>>({
        table: 'deals',
        select: 'id, title, value, stage, contact_id, company_id',
        filters: [{ type: 'in', column, value: entityIds }],
        range: { from: 0, to: 49 },
      });
      const sharedDeals = (deals || []).map((d) => ({
        id: String(d.id),
        title: String(d.title || 'Sem título'),
        value: Number(d.value || 0),
        stage: String(d.stage || 'unknown'),
      }));

      return { sharedInteractions, sharedDeals, temporalOverlap };
    },
  });
}
