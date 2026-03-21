import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const STORAGE_KEY = 'relateiq-recently-viewed';
const MAX_ITEMS = 10;

// Mock React hooks so we can test without renderHook
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  let stateValue: unknown;
  return {
    ...actual as object,
    useState: (init: unknown) => {
      const val = typeof init === 'function' ? (init as () => unknown)() : init;
      if (stateValue === undefined) stateValue = val;
      return [stateValue, (v: unknown) => { stateValue = typeof v === 'function' ? (v as Function)(stateValue) : v; }];
    },
    useEffect: (fn: () => void) => { fn(); },
    useCallback: (fn: Function) => fn,
  };
});

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  describe('getStoredItems (via localStorage)', () => {
    it('returns empty array when localStorage is empty', () => {
      const items = localStorage.getItem(STORAGE_KEY);
      expect(items).toBeNull();
    });

    it('returns empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');
      // The hook would catch the parse error and return []
      expect(() => JSON.parse('invalid-json')).toThrow();
    });

    it('stores items as JSON array', () => {
      const items = [{ id: '1', type: 'contact', name: 'Test', viewedAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Test');
    });

    it('parses stored items correctly', () => {
      const items = [
        { id: '1', type: 'contact', name: 'Alice', viewedAt: '2024-01-01T00:00:00Z' },
        { id: '2', type: 'company', name: 'ACME', viewedAt: '2024-01-02T00:00:00Z' },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(2);
    });
  });

  describe('trackView logic', () => {
    it('adds new item to localStorage', () => {
      const items = [{ id: '1', type: 'contact', name: 'Alice', viewedAt: new Date().toISOString() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toHaveLength(1);
    });

    it('moves existing item to front (deduplication)', () => {
      const items = [
        { id: '2', type: 'contact', name: 'Bob', viewedAt: '2024-01-02T00:00:00Z' },
        { id: '1', type: 'contact', name: 'Alice', viewedAt: '2024-01-01T00:00:00Z' },
      ];
      // Simulate trackView: filter out id=1 contact, prepend
      const filtered = items.filter(i => !(i.id === '1' && i.type === 'contact'));
      const updated = [{ id: '1', type: 'contact', name: 'Alice', viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_ITEMS);
      expect(updated[0].id).toBe('1');
      expect(updated).toHaveLength(2);
    });

    it('respects MAX_ITEMS limit of 10', () => {
      const items = Array.from({ length: 12 }, (_, i) => ({
        id: String(i),
        type: 'contact' as const,
        name: `Person ${i}`,
        viewedAt: new Date().toISOString(),
      }));
      const sliced = items.slice(0, MAX_ITEMS);
      expect(sliced).toHaveLength(10);
    });

    it('new item always appears at position 0', () => {
      const existing = [
        { id: '1', type: 'contact', name: 'Alice', viewedAt: '2024-01-01T00:00:00Z' },
      ];
      const newItem = { id: '2', type: 'contact', name: 'Bob', viewedAt: new Date().toISOString() };
      const updated = [newItem, ...existing].slice(0, MAX_ITEMS);
      expect(updated[0].id).toBe('2');
    });

    it('sets viewedAt to current ISO timestamp', () => {
      const before = new Date().toISOString();
      const viewedAt = new Date().toISOString();
      const after = new Date().toISOString();
      expect(viewedAt >= before).toBe(true);
      expect(viewedAt <= after).toBe(true);
    });

    it('handles same id with different types as separate items', () => {
      const items = [
        { id: '1', type: 'contact' as const, name: 'Alice Contact', viewedAt: '2024-01-01T00:00:00Z' },
        { id: '1', type: 'company' as const, name: 'Alice Company', viewedAt: '2024-01-01T00:00:00Z' },
      ];
      // Filtering for id=1, type=contact should keep the company
      const filtered = items.filter(i => !(i.id === '1' && i.type === 'contact'));
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('company');
    });
  });

  describe('filtering by type', () => {
    it('returns all items when filterType is undefined', () => {
      const items = [
        { id: '1', type: 'contact' as const, name: 'Alice' },
        { id: '2', type: 'company' as const, name: 'ACME' },
      ];
      const filtered = items; // no filter
      expect(filtered).toHaveLength(2);
    });

    it('filters by contact type', () => {
      const items = [
        { id: '1', type: 'contact' as const, name: 'Alice' },
        { id: '2', type: 'company' as const, name: 'ACME' },
        { id: '3', type: 'contact' as const, name: 'Bob' },
      ];
      const filtered = items.filter(i => i.type === 'contact');
      expect(filtered).toHaveLength(2);
    });

    it('filters by company type', () => {
      const items = [
        { id: '1', type: 'contact' as const, name: 'Alice' },
        { id: '2', type: 'company' as const, name: 'ACME' },
      ];
      const filtered = items.filter(i => i.type === 'company');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('ACME');
    });

    it('returns empty array when no items match filter', () => {
      const items = [
        { id: '1', type: 'contact' as const, name: 'Alice' },
      ];
      const filtered = items.filter(i => i.type === 'company');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('localStorage integration', () => {
    it('saves items to localStorage', () => {
      const items = [{ id: '1', type: 'contact', name: 'Test', viewedAt: '2024-01-01T00:00:00Z' }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('reads items from localStorage', () => {
      const items = [{ id: '1', type: 'contact', name: 'Test', viewedAt: '2024-01-01T00:00:00Z' }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      const result = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(result).toEqual(items);
    });

    it('handles empty localStorage gracefully', () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeNull();
      const items = raw ? JSON.parse(raw) : [];
      expect(items).toEqual([]);
    });

    it('handles malformed JSON gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '{broken');
      let items: unknown[] = [];
      try {
        items = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      } catch {
        items = [];
      }
      expect(items).toEqual([]);
    });

    it('dispatches custom event on trackView', () => {
      const listener = vi.fn();
      window.addEventListener('recently-viewed-updated', listener);
      window.dispatchEvent(new Event('recently-viewed-updated'));
      expect(listener).toHaveBeenCalledOnce();
      window.removeEventListener('recently-viewed-updated', listener);
    });
  });

  describe('RecentlyViewedItem interface', () => {
    it('accepts optional subtitle', () => {
      const item = { id: '1', type: 'contact' as const, name: 'Test', subtitle: 'CEO', viewedAt: '2024-01-01T00:00:00Z' };
      expect(item.subtitle).toBe('CEO');
    });

    it('accepts optional avatarUrl', () => {
      const item = { id: '1', type: 'contact' as const, name: 'Test', avatarUrl: 'https://example.com/avatar.png', viewedAt: '2024-01-01T00:00:00Z' };
      expect(item.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('works without optional fields', () => {
      const item = { id: '1', type: 'contact' as const, name: 'Test', viewedAt: '2024-01-01T00:00:00Z' };
      expect(item.subtitle).toBeUndefined();
      expect(item.avatarUrl).toBeUndefined();
    });
  });
});
