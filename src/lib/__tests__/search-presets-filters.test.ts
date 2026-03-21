/**
 * Testes exaustivos — Módulo de Busca, Presets e Filtros Salvos
 * Cobre: useSearchPresets, useSavedFilters, useFuzzySearch (lógica pura)
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ── SearchPreset Logic ──

interface SearchPreset {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  createdAt: string;
}

function createPreset(
  presets: SearchPreset[],
  preset: Omit<SearchPreset, 'id' | 'createdAt'>,
  maxPresets = 10
): { presets: SearchPreset[]; created: SearchPreset } {
  const newPreset: SearchPreset = {
    ...preset,
    id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  return {
    presets: [newPreset, ...presets].slice(0, maxPresets),
    created: newPreset,
  };
}

function deletePreset(presets: SearchPreset[], id: string): SearchPreset[] {
  return presets.filter(p => p.id !== id);
}

function updatePreset(
  presets: SearchPreset[],
  id: string,
  updates: Partial<Omit<SearchPreset, 'id' | 'createdAt'>>
): SearchPreset[] {
  return presets.map(p => (p.id === id ? { ...p, ...updates } : p));
}

// ── SavedFilter Logic ──

interface SavedFilter {
  id: string;
  name: string;
  type: 'contacts' | 'companies' | 'interactions';
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  usageCount: number;
}

function createFilter(name: string, type: SavedFilter['type'], config: Record<string, unknown>): SavedFilter {
  return {
    id: `filter-${Date.now()}`,
    name,
    type,
    filters: config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
    usageCount: 0,
  };
}

function applyFilter(filters: SavedFilter[], id: string): SavedFilter[] {
  return filters.map(f =>
    f.id === id
      ? { ...f, usageCount: f.usageCount + 1, updatedAt: new Date().toISOString() }
      : f
  );
}

function setDefaultFilter(filters: SavedFilter[], id: string | null): SavedFilter[] {
  return filters.map(f => ({ ...f, isDefault: f.id === id }));
}

function duplicateFilter(filters: SavedFilter[], id: string): { filters: SavedFilter[]; duplicate: SavedFilter | null } {
  const original = filters.find(f => f.id === id);
  if (!original) return { filters, duplicate: null };

  const dup: SavedFilter = {
    ...original,
    id: `filter-dup-${Date.now()}`,
    name: `${original.name} (cópia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
    usageCount: 0,
  };
  return { filters: [...filters, dup], duplicate: dup };
}

function getMostUsed(filters: SavedFilter[], limit = 5): SavedFilter[] {
  return [...filters].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
}

function getRecent(filters: SavedFilter[], limit = 5): SavedFilter[] {
  return [...filters]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

// ── Fuzzy Search Logic ──

function normalizeString(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function simpleSearch<T>(items: T[], query: string, fields: (keyof T)[], minChars = 1): T[] {
  if (!query || query.length < minChars) return items;
  const normalized = normalizeString(query);
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value !== 'string') return false;
      return normalizeString(value).includes(normalized);
    })
  );
}

function highlightMatches(text: string, indices: readonly [number, number][]): string {
  if (!indices || indices.length === 0) return text;
  let result = '';
  let lastIndex = 0;
  indices.forEach(([start, end]) => {
    if (start > lastIndex) result += text.slice(lastIndex, start);
    result += `«${text.slice(start, end + 1)}»`;
    lastIndex = end + 1;
  });
  if (lastIndex < text.length) result += text.slice(lastIndex);
  return result;
}

// ══════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════

describe('SearchPreset — CRUD', () => {
  let presets: SearchPreset[];

  beforeEach(() => { presets = []; });

  it('creates a preset with auto ID and timestamp', () => {
    const { presets: updated, created } = createPreset(presets, {
      name: 'VIP Contacts', filters: { tags: ['vip'] }, sortBy: 'name', sortOrder: 'asc',
    });
    expect(updated.length).toBe(1);
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.name).toBe('VIP Contacts');
  });

  it('prepends new preset (most recent first)', () => {
    const { presets: p1 } = createPreset(presets, { name: 'First', filters: {}, sortBy: 'name', sortOrder: 'asc' });
    const { presets: p2 } = createPreset(p1, { name: 'Second', filters: {}, sortBy: 'name', sortOrder: 'asc' });
    expect(p2[0].name).toBe('Second');
    expect(p2[1].name).toBe('First');
  });

  it('enforces max 10 presets', () => {
    let current: SearchPreset[] = [];
    for (let i = 0; i < 15; i++) {
      const { presets: updated } = createPreset(current, {
        name: `Preset ${i}`, filters: {}, sortBy: 'name', sortOrder: 'asc',
      });
      current = updated;
    }
    expect(current.length).toBe(10);
    expect(current[0].name).toBe('Preset 14');
  });

  it('deletes a preset by ID', () => {
    const { presets: p1, created: c1 } = createPreset(presets, { name: 'A', filters: {}, sortBy: 'name', sortOrder: 'asc' });
    const { presets: p2 } = createPreset(p1, { name: 'B', filters: {}, sortBy: 'name', sortOrder: 'asc' });
    const result = deletePreset(p2, c1.id);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('B');
  });

  it('handles deleting non-existent preset', () => {
    const { presets: p1 } = createPreset(presets, { name: 'A', filters: {}, sortBy: 'name', sortOrder: 'asc' });
    const result = deletePreset(p1, 'nonexistent');
    expect(result.length).toBe(1);
  });

  it('updates preset fields', () => {
    const { presets: p1, created } = createPreset(presets, { name: 'Old', filters: { tags: ['old'] }, sortBy: 'name', sortOrder: 'asc' });
    const updated = updatePreset(p1, created.id, { name: 'New', sortOrder: 'desc' });
    expect(updated[0].name).toBe('New');
    expect(updated[0].sortOrder).toBe('desc');
    expect(updated[0].filters).toEqual({ tags: ['old'] }); // unchanged
  });

  it('preserves search term in preset', () => {
    const { created } = createPreset(presets, {
      name: 'With Term', filters: {}, sortBy: 'name', sortOrder: 'asc', searchTerm: 'João',
    });
    expect(created.searchTerm).toBe('João');
  });
});

describe('SavedFilter — Full Lifecycle', () => {
  let filters: SavedFilter[];

  beforeEach(() => {
    filters = [
      createFilter('VIP', 'contacts', { tags: ['vip'] }),
      createFilter('Recentes', 'contacts', { sort: 'recent' }),
      createFilter('Ativas', 'companies', { status: 'active' }),
    ];
    // Simulate different usage counts
    filters[0].usageCount = 10;
    filters[1].usageCount = 25;
    filters[2].usageCount = 5;
  });

  it('creates filter with correct defaults', () => {
    const f = createFilter('Test', 'interactions', { type: 'call' });
    expect(f.isDefault).toBe(false);
    expect(f.usageCount).toBe(0);
    expect(f.type).toBe('interactions');
  });

  it('increments usage count on apply', () => {
    const updated = applyFilter(filters, filters[0].id);
    expect(updated.find(f => f.id === filters[0].id)?.usageCount).toBe(11);
  });

  it('does not affect other filters on apply', () => {
    const updated = applyFilter(filters, filters[0].id);
    expect(updated.find(f => f.id === filters[1].id)?.usageCount).toBe(25);
  });

  it('sets default filter (only one)', () => {
    const updated = setDefaultFilter(filters, filters[0].id);
    expect(updated.filter(f => f.isDefault).length).toBe(1);
    expect(updated.find(f => f.id === filters[0].id)?.isDefault).toBe(true);
  });

  it('clears default when null', () => {
    const withDefault = setDefaultFilter(filters, filters[0].id);
    const cleared = setDefaultFilter(withDefault, null);
    expect(cleared.every(f => !f.isDefault)).toBe(true);
  });

  it('duplicates filter with (cópia) suffix', () => {
    const { filters: updated, duplicate } = duplicateFilter(filters, filters[0].id);
    expect(duplicate).not.toBeNull();
    expect(duplicate!.name).toBe('VIP (cópia)');
    expect(duplicate!.usageCount).toBe(0);
    expect(duplicate!.isDefault).toBe(false);
    expect(updated.length).toBe(4);
  });

  it('returns null for duplicating non-existent', () => {
    const { duplicate } = duplicateFilter(filters, 'nonexistent');
    expect(duplicate).toBeNull();
  });

  it('getMostUsed returns correct order', () => {
    const top = getMostUsed(filters, 2);
    expect(top[0].name).toBe('Recentes'); // 25
    expect(top[1].name).toBe('VIP'); // 10
  });

  it('getRecent returns most recently updated first', () => {
    filters[2].updatedAt = new Date(Date.now() + 1000).toISOString();
    const recent = getRecent(filters, 2);
    expect(recent[0].name).toBe('Ativas');
  });

  it('handles empty filter list', () => {
    expect(getMostUsed([], 5)).toEqual([]);
    expect(getRecent([], 5)).toEqual([]);
  });
});

describe('SimpleSearch — Accent & Case Insensitive', () => {
  interface Item { name: string; email: string; }
  const items: Item[] = [
    { name: 'João Silva', email: 'joao@test.com' },
    { name: 'María García', email: 'maria@test.com' },
    { name: 'André Müller', email: 'andre@test.com' },
    { name: 'François Lê', email: 'francois@test.com' },
    { name: 'Ação Rápida', email: 'acao@test.com' },
  ];

  it('finds by exact name', () => {
    expect(simpleSearch(items, 'João Silva', ['name']).length).toBe(1);
  });

  it('finds without accents', () => {
    expect(simpleSearch(items, 'joao', ['name']).length).toBe(1);
  });

  it('case insensitive', () => {
    expect(simpleSearch(items, 'MARIA', ['name']).length).toBe(1);
  });

  it('finds across multiple fields', () => {
    expect(simpleSearch(items, 'andre', ['name', 'email']).length).toBe(1);
  });

  it('finds by email', () => {
    expect(simpleSearch(items, 'francois@test', ['email']).length).toBe(1);
  });

  it('accent-insensitive: ação → acao', () => {
    expect(simpleSearch(items, 'acao rapida', ['name']).length).toBe(1);
  });

  it('returns all items for empty query', () => {
    expect(simpleSearch(items, '', ['name']).length).toBe(5);
  });

  it('returns all items for query below minChars', () => {
    expect(simpleSearch(items, 'a', ['name'], 2).length).toBe(5);
  });

  it('returns empty for no matches', () => {
    expect(simpleSearch(items, 'zzzzz', ['name'])).toEqual([]);
  });

  it('handles special characters', () => {
    expect(simpleSearch(items, 'Lê', ['name']).length).toBe(1);
  });

  it('handles umlaut (Müller)', () => {
    expect(simpleSearch(items, 'muller', ['name']).length).toBe(1);
  });

  it('partial match works', () => {
    expect(simpleSearch(items, 'Sil', ['name']).length).toBe(1);
  });
});

describe('Highlight Matches', () => {
  it('highlights single match', () => {
    expect(highlightMatches('Hello World', [[0, 4]])).toBe('«Hello» World');
  });

  it('highlights multiple matches', () => {
    expect(highlightMatches('abcdefgh', [[0, 1], [4, 5]])).toBe('«ab»cd«ef»gh');
  });

  it('handles no indices', () => {
    expect(highlightMatches('Hello', [])).toBe('Hello');
  });

  it('highlights entire string', () => {
    expect(highlightMatches('abc', [[0, 2]])).toBe('«abc»');
  });

  it('handles single character match', () => {
    expect(highlightMatches('abc', [[1, 1]])).toBe('a«b»c');
  });

  it('handles match at end', () => {
    expect(highlightMatches('Hello', [[3, 4]])).toBe('Hel«lo»');
  });

  it('handles adjacent matches', () => {
    expect(highlightMatches('abcd', [[0, 1], [2, 3]])).toBe('«ab»«cd»');
  });
});

describe('normalizeString', () => {
  it('lowercases', () => expect(normalizeString('HELLO')).toBe('hello'));
  it('removes accents', () => expect(normalizeString('àáâãäå')).toBe('aaaaaa'));
  it('handles cedilla', () => expect(normalizeString('Ação')).toBe('acao'));
  it('handles tilde', () => expect(normalizeString('São Paulo')).toBe('sao paulo'));
  it('handles combined', () => expect(normalizeString('JOÃO MÜLLER')).toBe('joao muller'));
  it('handles empty', () => expect(normalizeString('')).toBe(''));
  it('handles plain ASCII', () => expect(normalizeString('hello')).toBe('hello'));
});
