import { describe, it, expect } from 'vitest';
import {
  computeIsolatedFilterCounts,
  pickMostReducingFilters,
} from '@/lib/computeIsolatedFilterCounts';
import type { Interaction } from '@/hooks/useInteractions';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

function makeInteraction(over: Partial<Interaction>): Interaction {
  return {
    id: over.id ?? Math.random().toString(36).slice(2),
    user_id: 'u1',
    contact_id: over.contact_id ?? 'c1',
    company_id: over.company_id ?? null,
    type: over.type ?? 'whatsapp',
    title: over.title ?? '',
    content: over.content ?? '',
    initiated_by: over.initiated_by ?? 'us',
    created_at: over.created_at ?? new Date('2025-01-15T12:00:00Z').toISOString(),
    sentiment: over.sentiment ?? null,
    tags: over.tags ?? [],
    follow_up_required: false,
    follow_up_date: null,
    duration: null,
    response_time: null,
    updated_at: new Date().toISOString(),
  } as unknown as Interaction;
}

const baseFilters: AdvancedFilters = {
  q: '',
  contact: '',
  company: '',
  canais: [],
  direcao: 'all',
  de: undefined,
  ate: undefined,
  sentimento: undefined,
  view: 'list',
  sort: 'recent',
  page: 1,
  perPage: 25,
  density: 'comfortable',
} as unknown as AdvancedFilters;

describe('computeIsolatedFilterCounts', () => {
  const dataset: Interaction[] = [
    makeInteraction({ id: '1', type: 'whatsapp', contact_id: 'cA', initiated_by: 'us', sentiment: 'positive' }),
    makeInteraction({ id: '2', type: 'email',    contact_id: 'cA', initiated_by: 'them', sentiment: 'neutral' }),
    makeInteraction({ id: '3', type: 'call',     contact_id: 'cB', initiated_by: 'us', sentiment: 'negative' }),
    makeInteraction({ id: '4', type: 'whatsapp', contact_id: 'cB', initiated_by: 'us' }),
    makeInteraction({ id: '5', type: 'whatsapp', contact_id: 'cC', initiated_by: 'them' }),
  ];

  it('retorna vazio quando nenhum filtro está ativo', () => {
    expect(computeIsolatedFilterCounts(dataset, baseFilters, '')).toEqual([]);
  });

  it('conta isoladamente um único filtro de canal', () => {
    const counts = computeIsolatedFilterCounts(
      dataset,
      { ...baseFilters, canais: ['whatsapp'] } as AdvancedFilters,
      '',
    );
    expect(counts).toHaveLength(1);
    expect(counts[0]).toMatchObject({ key: 'canais', count: 3 });
  });

  it('cada filtro é contado contra o dataset bruto, ignorando os demais', () => {
    const counts = computeIsolatedFilterCounts(
      dataset,
      {
        ...baseFilters,
        canais: ['whatsapp'],          // 3 itens
        contact: 'cA',                  // 2 itens (não restringido por canal)
        direcao: 'inbound',             // 2 itens (id 2 e 5)
        sentimento: 'positive',         // 1 item
      } as AdvancedFilters,
      '',
    );
    const byKey = Object.fromEntries(counts.map((c) => [c.key, c.count]));
    expect(byKey).toEqual({ canais: 3, contact: 2, direcao: 2, sentimento: 1 });
  });

  it('busca textual conta hits brutos, sem demais filtros', () => {
    const items = [
      makeInteraction({ id: 'a', title: 'Reunião sobre proposta' }),
      makeInteraction({ id: 'b', content: 'Proposta enviada' }),
      makeInteraction({ id: 'c', title: 'Follow-up' }),
    ];
    const counts = computeIsolatedFilterCounts(items, { ...baseFilters, q: 'proposta' } as AdvancedFilters, 'proposta');
    const q = counts.find((c) => c.key === 'q');
    expect(q?.count).toBe(2);
  });

  it('filtros de data isolam contra o dataset bruto', () => {
    const items = [
      makeInteraction({ id: 'a', created_at: '2025-01-01T10:00:00Z' }),
      makeInteraction({ id: 'b', created_at: '2025-02-01T10:00:00Z' }),
      makeInteraction({ id: 'c', created_at: '2025-03-01T10:00:00Z' }),
    ];
    const counts = computeIsolatedFilterCounts(
      items,
      { ...baseFilters, de: new Date('2025-02-01T00:00:00') } as AdvancedFilters,
      '',
    );
    expect(counts.find((c) => c.key === 'de')?.count).toBe(2);
  });
});

describe('pickMostReducingFilters', () => {
  it('escolhe os N de menor contagem (mais restritivos)', () => {
    const top = pickMostReducingFilters(
      [
        { key: 'canais', label: 'WhatsApp', count: 50 },
        { key: 'contact', label: 'Pessoa', count: 3 },
        { key: 'sentimento', label: 'Positivo', count: 12 },
        { key: 'direcao', label: 'Recebidas', count: 8 },
      ],
      2,
    );
    expect(top.map((t) => t.key)).toEqual(['contact', 'direcao']);
  });

  it('em empate, mantém a ordem original (estável)', () => {
    const top = pickMostReducingFilters(
      [
        { key: 'canais', label: 'A', count: 5 },
        { key: 'contact', label: 'B', count: 5 },
        { key: 'sentimento', label: 'C', count: 9 },
      ],
      2,
    );
    expect(top.map((t) => t.key)).toEqual(['canais', 'contact']);
  });

  it('retorna vazio para entrada inválida ou n <= 0', () => {
    expect(pickMostReducingFilters([], 2)).toEqual([]);
    expect(pickMostReducingFilters([{ key: 'q', label: 'x', count: 1 }], 0)).toEqual([]);
  });
});
