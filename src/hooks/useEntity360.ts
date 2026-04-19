import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export type Entity360Type = 'contact' | 'company' | 'deal';

export interface Entity360Result {
  type: Entity360Type;
  id: string;
  metadata: Record<string, unknown>;
  timeline: Array<{
    id: string;
    occurred_at: string;
    kind: string;
    title: string;
    detail?: string;
  }>;
  related: Array<{ id: string; type: string; name: string; meta?: string }>;
}

const tableMap: Record<Entity360Type, string> = {
  contact: 'contacts',
  company: 'companies',
  deal: 'deals',
};

export function useEntity360(type: Entity360Type | null, id: string | null) {
  return useQuery({
    queryKey: ['entity-360', type, id],
    enabled: !!type && !!id,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<Entity360Result | null> => {
      if (!type || !id) return null;
      const table = tableMap[type];

      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: '*',
        filters: [{ type: 'eq', column: 'id', value: id }],
        range: { from: 0, to: 0 },
      });
      const meta = rows?.[0] || {};

      const timeline: Entity360Result['timeline'] = [];

      if (type === 'contact') {
        const { data: ints } = await queryExternalData<Record<string, unknown>>({
          table: 'interactions',
          select: 'id, type, channel, content, occurred_at',
          filters: [{ type: 'eq', column: 'contact_id', value: id }],
          order: { column: 'occurred_at', ascending: false },
          range: { from: 0, to: 49 },
        });
        (ints || []).forEach((i) => {
          timeline.push({
            id: String(i.id),
            occurred_at: String(i.occurred_at),
            kind: String(i.channel || i.type || 'INT'),
            title: String(i.type || 'Interação'),
            detail: typeof i.content === 'string' ? i.content.slice(0, 160) : undefined,
          });
        });
      }

      const related: Entity360Result['related'] = [];
      if (type === 'contact' && meta.company_id) {
        const { data: comp } = await queryExternalData<Record<string, unknown>>({
          table: 'companies',
          select: 'id, name, industry',
          filters: [{ type: 'eq', column: 'id', value: meta.company_id }],
          range: { from: 0, to: 0 },
        });
        if (comp?.[0]) {
          related.push({
            id: String(comp[0].id),
            type: 'COMPANY',
            name: String(comp[0].name),
            meta: comp[0].industry ? String(comp[0].industry) : undefined,
          });
        }
      }
      if (type === 'company') {
        const { data: contacts } = await queryExternalData<Record<string, unknown>>({
          table: 'contacts',
          select: 'id, full_name, role',
          filters: [{ type: 'eq', column: 'company_id', value: id }],
          range: { from: 0, to: 19 },
        });
        (contacts || []).forEach((c) => {
          related.push({
            id: String(c.id),
            type: 'CONTACT',
            name: String(c.full_name || 'Sem nome'),
            meta: c.role ? String(c.role) : undefined,
          });
        });
      }

      return { type, id, metadata: meta, timeline, related };
    },
  });
}
