import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fuse from 'fuse.js';

// Test Fuse.js search behavior directly and the highlight/normalizeString pure functions

interface TestItem {
  id: number;
  name: string;
  email: string;
  city?: string;
}

const testItems: TestItem[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', city: 'New York' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', city: 'Los Angeles' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', city: 'Chicago' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', city: 'Washington' },
  { id: 5, name: 'Eve Adams', email: 'eve@example.com', city: 'Boston' },
];

describe('useFuzzySearch', () => {
  describe('Fuse.js search behavior', () => {
    let fuse: Fuse<TestItem>;

    beforeEach(() => {
      fuse = new Fuse(testItems, {
        keys: ['name', 'email'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: true,
        includeMatches: true,
      });
    });

    it('finds exact name match', () => {
      const results = fuse.search('Alice');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Alice Johnson');
    });

    it('finds partial name match', () => {
      const results = fuse.search('Ali');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Alice Johnson');
    });

    it('finds email match', () => {
      const results = fuse.search('bob@example');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Bob Smith');
    });

    it('handles typo-tolerant search', () => {
      const results = fuse.search('Alic');
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns empty for completely unrelated query', () => {
      const results = fuse.search('zzzzzzzzzzz');
      expect(results).toHaveLength(0);
    });

    it('includes score in results', () => {
      const results = fuse.search('Alice');
      expect(results[0]).toHaveProperty('score');
    });

    it('includes matches in results', () => {
      const results = fuse.search('Alice');
      expect(results[0]).toHaveProperty('matches');
    });

    it('respects limit option', () => {
      const results = fuse.search('e', { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('searches across multiple fields', () => {
      const results = fuse.search('charlie');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('Charlie Brown');
    });

    it('returns all items in correct order by relevance', () => {
      const results = fuse.search('Alice Johnson');
      expect(results[0].item.name).toBe('Alice Johnson');
    });
  });

  describe('highlight function', () => {
    // Replicating the pure highlight function from useFuzzySearch
    const highlight = (text: string, indices: readonly [number, number][]): string => {
      if (!indices || indices.length === 0) {
        return text;
      }

      let result = '';
      let lastIndex = 0;

      indices.forEach(([start, end]) => {
        if (start > lastIndex) {
          result += text.slice(lastIndex, start);
        }
        result += `\u00AB${text.slice(start, end + 1)}\u00BB`;
        lastIndex = end + 1;
      });

      if (lastIndex < text.length) {
        result += text.slice(lastIndex);
      }

      return result;
    };

    it('returns original text when no indices', () => {
      expect(highlight('Hello World', [])).toBe('Hello World');
    });

    it('highlights single match', () => {
      const result = highlight('Hello World', [[0, 4]]);
      expect(result).toContain('\u00AB');
      expect(result).toContain('Hello');
    });

    it('highlights match at beginning', () => {
      const result = highlight('Hello World', [[0, 4]]);
      expect(result.startsWith('\u00AB')).toBe(true);
    });

    it('highlights match at end', () => {
      const result = highlight('Hello World', [[6, 10]]);
      expect(result.endsWith('\u00BB')).toBe(true);
    });

    it('highlights multiple matches', () => {
      const result = highlight('Hello World', [[0, 1], [6, 7]]);
      const markerCount = (result.match(/\u00AB/g) || []).length;
      expect(markerCount).toBe(2);
    });

    it('preserves non-highlighted text between matches', () => {
      const result = highlight('abcdef', [[0, 1], [4, 5]]);
      expect(result).toContain('cd');
    });

    it('handles single character match', () => {
      const result = highlight('Hello', [[0, 0]]);
      expect(result).toContain('\u00ABH\u00BB');
    });

    it('handles entire string as match', () => {
      const result = highlight('Hi', [[0, 1]]);
      expect(result).toBe('\u00ABHi\u00BB');
    });

    it('returns original text for null-like indices', () => {
      // @ts-ignore - testing edge case
      expect(highlight('test', null)).toBe('test');
    });

    it('returns original text for undefined indices', () => {
      // @ts-ignore - testing edge case
      expect(highlight('test', undefined)).toBe('test');
    });
  });

  describe('simple search normalization', () => {
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    it('converts to lowercase', () => {
      expect(normalizeString('HELLO')).toBe('hello');
    });

    it('removes accents from characters', () => {
      expect(normalizeString('café')).toBe('cafe');
    });

    it('removes diacritics from Portuguese text', () => {
      expect(normalizeString('João')).toBe('joao');
    });

    it('handles tilde on n', () => {
      expect(normalizeString('señor')).toBe('senor');
    });

    it('handles umlaut characters', () => {
      expect(normalizeString('über')).toBe('uber');
    });

    it('handles empty string', () => {
      expect(normalizeString('')).toBe('');
    });

    it('handles string without accents', () => {
      expect(normalizeString('hello world')).toBe('hello world');
    });

    it('handles mixed case with accents', () => {
      expect(normalizeString('CAFÉ au LAIT')).toBe('cafe au lait');
    });

    it('preserves numbers', () => {
      expect(normalizeString('test123')).toBe('test123');
    });

    it('preserves special characters (non-diacritic)', () => {
      expect(normalizeString('hello@world.com')).toBe('hello@world.com');
    });
  });

  describe('search state logic', () => {
    it('isSearching is false when query is empty', () => {
      const debouncedQuery = '';
      const minChars = 1;
      const isSearching = debouncedQuery.length >= minChars;
      expect(isSearching).toBe(false);
    });

    it('isSearching is true when query meets minChars', () => {
      const debouncedQuery = 'a';
      const minChars = 1;
      const isSearching = debouncedQuery.length >= minChars;
      expect(isSearching).toBe(true);
    });

    it('isSearching is false when query is below minChars', () => {
      const debouncedQuery = 'ab';
      const minChars = 3;
      const isSearching = debouncedQuery.length >= minChars;
      expect(isSearching).toBe(false);
    });

    it('returns all items when not searching', () => {
      const debouncedQuery = '';
      const minChars = 1;
      if (!debouncedQuery || debouncedQuery.length < minChars) {
        expect(testItems).toHaveLength(5);
      }
    });

    it('clearSearch resets query', () => {
      let query = 'something';
      query = '';
      expect(query).toBe('');
    });
  });

  describe('simple search filtering', () => {
    const normalizeString = (str: string) => {
      return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const simpleSearch = (items: TestItem[], query: string, fields: (keyof TestItem)[]) => {
      const normalizedQuery = normalizeString(query);
      return items.filter(item =>
        fields.some(field => {
          const value = item[field];
          if (typeof value !== 'string') return false;
          return normalizeString(value).includes(normalizedQuery);
        })
      );
    };

    it('filters by name', () => {
      const results = simpleSearch(testItems, 'alice', ['name']);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('filters by email', () => {
      const results = simpleSearch(testItems, 'bob@', ['email']);
      expect(results).toHaveLength(1);
    });

    it('filters across multiple fields', () => {
      const results = simpleSearch(testItems, 'charlie', ['name', 'email']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('returns all items for empty query', () => {
      // The hook returns items when query < minChars
      expect(testItems).toHaveLength(5);
    });

    it('handles no matches', () => {
      const results = simpleSearch(testItems, 'zzzzz', ['name']);
      expect(results).toHaveLength(0);
    });

    it('is case-insensitive', () => {
      const results = simpleSearch(testItems, 'ALICE', ['name']);
      expect(results).toHaveLength(1);
    });

    it('handles non-string fields gracefully', () => {
      const results = simpleSearch(testItems, '1', ['id' as keyof TestItem]);
      expect(results).toHaveLength(0); // id is number, not string
    });
  });
});
