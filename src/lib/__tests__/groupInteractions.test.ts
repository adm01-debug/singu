import { describe, it, expect } from 'vitest';
import { groupInteractions, type GroupableInteraction } from '@/lib/groupInteractions';

function mk(over: Partial<GroupableInteraction>): GroupableInteraction {
  return {
    id: 'i' + Math.random(),
    type: 'note',
    title: 't',
    content: null,
    created_at: '2025-01-01T10:00:00Z',
    contact_id: null,
    company_id: null,
    contact_name: null,
    company_name: null,
    tags: null,
    ...over,
  };
}

describe('groupInteractions', () => {
  it('agrupa por contact_id corretamente', () => {
    const items = [
      mk({ id: '1', contact_id: 'c1', contact_name: 'Ana', created_at: '2025-01-03T10:00:00Z' }),
      mk({ id: '2', contact_id: 'c1', contact_name: 'Ana', created_at: '2025-01-02T10:00:00Z' }),
      mk({ id: '3', contact_id: 'c2', contact_name: 'Beto', created_at: '2025-01-04T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-contact', 'recent');
    expect(groups).toHaveLength(2);
    const ana = groups.find(g => g.entity_id === 'c1')!;
    expect(ana.events).toHaveLength(2);
    expect(ana.entity_name).toBe('Ana');
  });

  it('itens sem chave caem em "Sem identificação" e ficam por último', () => {
    const items = [
      mk({ id: '1', contact_id: null, created_at: '2025-01-05T10:00:00Z' }),
      mk({ id: '2', contact_id: 'c1', contact_name: 'Ana', created_at: '2025-01-01T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-contact', 'recent');
    expect(groups).toHaveLength(2);
    expect(groups[groups.length - 1].entity_name).toBe('Sem identificação');
    expect(groups[groups.length - 1].is_unidentified).toBe(true);
  });

  it('sort recent ordena grupos pela última interação desc', () => {
    const items = [
      mk({ id: '1', contact_id: 'a', contact_name: 'A', created_at: '2025-01-01T10:00:00Z' }),
      mk({ id: '2', contact_id: 'b', contact_name: 'B', created_at: '2025-01-10T10:00:00Z' }),
      mk({ id: '3', contact_id: 'c', contact_name: 'C', created_at: '2025-01-05T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-contact', 'recent');
    expect(groups.map(g => g.entity_id)).toEqual(['b', 'c', 'a']);
  });

  it('sort entity ordena grupos por nome alfabético', () => {
    const items = [
      mk({ id: '1', contact_id: 'a', contact_name: 'Carla', created_at: '2025-01-01T10:00:00Z' }),
      mk({ id: '2', contact_id: 'b', contact_name: 'Ana', created_at: '2025-01-02T10:00:00Z' }),
      mk({ id: '3', contact_id: 'c', contact_name: 'Bruno', created_at: '2025-01-03T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-contact', 'entity');
    expect(groups.map(g => g.entity_name)).toEqual(['Ana', 'Bruno', 'Carla']);
  });

  it('mantém a ordem dos eventos dentro do grupo (não reordena)', () => {
    const items = [
      mk({ id: '1', contact_id: 'a', contact_name: 'A', created_at: '2025-01-03T10:00:00Z' }),
      mk({ id: '2', contact_id: 'a', contact_name: 'A', created_at: '2025-01-01T10:00:00Z' }),
      mk({ id: '3', contact_id: 'a', contact_name: 'A', created_at: '2025-01-02T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-contact', 'recent');
    expect(groups[0].events.map(e => e.id)).toEqual(['1', '2', '3']);
  });

  it('agrupa por company_id quando mode=by-company', () => {
    const items = [
      mk({ id: '1', company_id: 'co1', company_name: 'Acme', created_at: '2025-01-01T10:00:00Z' }),
      mk({ id: '2', company_id: 'co1', company_name: 'Acme', created_at: '2025-01-02T10:00:00Z' }),
    ];
    const groups = groupInteractions(items, 'by-company', 'recent');
    expect(groups).toHaveLength(1);
    expect(groups[0].entity_type).toBe('company');
    expect(groups[0].entity_name).toBe('Acme');
  });
});
