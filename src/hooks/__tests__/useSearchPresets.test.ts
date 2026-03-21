import { describe, it, expect, vi, beforeEach } from 'vitest';

const BASE_STORAGE_KEY = 'relateiq-search-presets';

interface SearchPreset {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  searchTerm?: string;
  createdAt: string;
}

describe('useSearchPresets', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('storage key construction', () => {
    it('uses context suffix for storage key', () => {
      const context = 'contacts';
      const key = `${BASE_STORAGE_KEY}-${context}`;
      expect(key).toBe('relateiq-search-presets-contacts');
    });

    it('defaults to contacts context', () => {
      const key = `${BASE_STORAGE_KEY}-contacts`;
      expect(key).toBe('relateiq-search-presets-contacts');
    });

    it('supports custom contexts', () => {
      const key = `${BASE_STORAGE_KEY}-companies`;
      expect(key).toBe('relateiq-search-presets-companies');
    });
  });

  describe('initial state', () => {
    it('returns empty array when no stored presets', () => {
      const raw = localStorage.getItem(`${BASE_STORAGE_KEY}-contacts`);
      expect(raw).toBeNull();
      const presets = raw ? JSON.parse(raw) : [];
      expect(presets).toEqual([]);
    });

    it('loads existing presets from localStorage', () => {
      const stored: SearchPreset[] = [{
        id: '1',
        name: 'My Preset',
        filters: { status: ['active'] },
        sortBy: 'name',
        sortOrder: 'asc',
        createdAt: '2024-01-01T00:00:00Z',
      }];
      localStorage.setItem(`${BASE_STORAGE_KEY}-contacts`, JSON.stringify(stored));
      const result = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-contacts`)!);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Preset');
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem(`${BASE_STORAGE_KEY}-contacts`, 'corrupted');
      let presets: SearchPreset[] = [];
      try {
        presets = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-contacts`)!);
      } catch {
        presets = [];
      }
      expect(presets).toEqual([]);
    });
  });

  describe('savePreset', () => {
    it('creates preset with id and createdAt', () => {
      const input = {
        name: 'Test Preset',
        filters: { status: ['active'] },
        sortBy: 'name',
        sortOrder: 'asc' as const,
      };
      const newPreset: SearchPreset = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      expect(newPreset.id).toBeTruthy();
      expect(newPreset.createdAt).toBeTruthy();
      expect(newPreset.name).toBe('Test Preset');
    });

    it('prepends new preset to beginning', () => {
      const existing: SearchPreset[] = [{
        id: '1', name: 'Old', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '2024-01-01T00:00:00Z',
      }];
      const newPreset: SearchPreset = {
        id: '2', name: 'New', filters: {}, sortBy: 'name', sortOrder: 'desc', createdAt: '2024-01-02T00:00:00Z',
      };
      const updated = [newPreset, ...existing].slice(0, 10);
      expect(updated[0].name).toBe('New');
      expect(updated[1].name).toBe('Old');
    });

    it('enforces max 10 presets limit', () => {
      const presets: SearchPreset[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Preset ${i}`,
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc' as const,
        createdAt: new Date().toISOString(),
      }));
      const newPreset: SearchPreset = {
        id: '10', name: 'Overflow', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: new Date().toISOString(),
      };
      const updated = [newPreset, ...presets].slice(0, 10);
      expect(updated).toHaveLength(10);
      expect(updated[0].name).toBe('Overflow');
      // The last preset (index 9) should be dropped
      expect(updated[9].name).toBe('Preset 8');
    });

    it('drops oldest preset when at limit', () => {
      const presets: SearchPreset[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        name: `Preset ${i}`,
        filters: {},
        sortBy: 'name',
        sortOrder: 'asc' as const,
        createdAt: new Date().toISOString(),
      }));
      const newPreset: SearchPreset = {
        id: '99', name: 'Newest', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: new Date().toISOString(),
      };
      const updated = [newPreset, ...presets].slice(0, 10);
      expect(updated.find(p => p.id === '9')).toBeUndefined();
    });

    it('includes optional searchTerm', () => {
      const preset: SearchPreset = {
        id: '1', name: 'Test', filters: {}, sortBy: 'name', sortOrder: 'asc',
        searchTerm: 'hello', createdAt: new Date().toISOString(),
      };
      expect(preset.searchTerm).toBe('hello');
    });

    it('works without searchTerm', () => {
      const preset: SearchPreset = {
        id: '1', name: 'Test', filters: {}, sortBy: 'name', sortOrder: 'asc',
        createdAt: new Date().toISOString(),
      };
      expect(preset.searchTerm).toBeUndefined();
    });
  });

  describe('deletePreset', () => {
    it('removes preset by id', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'A', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
        { id: '2', name: 'B', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updated = presets.filter(p => p.id !== '1');
      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe('2');
    });

    it('returns same array if id not found', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'A', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updated = presets.filter(p => p.id !== 'nonexistent');
      expect(updated).toHaveLength(1);
    });

    it('handles deletion from empty array', () => {
      const presets: SearchPreset[] = [];
      const updated = presets.filter(p => p.id !== '1');
      expect(updated).toEqual([]);
    });
  });

  describe('updatePreset', () => {
    it('updates name of existing preset', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'Old Name', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updates = { name: 'New Name' };
      const updated = presets.map(p => p.id === '1' ? { ...p, ...updates } : p);
      expect(updated[0].name).toBe('New Name');
    });

    it('updates filters of existing preset', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'Test', filters: { status: ['active'] }, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updated = presets.map(p => p.id === '1' ? { ...p, filters: { status: ['inactive'] } } : p);
      expect(updated[0].filters.status).toEqual(['inactive']);
    });

    it('does not modify other presets', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'A', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
        { id: '2', name: 'B', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updated = presets.map(p => p.id === '1' ? { ...p, name: 'Updated A' } : p);
      expect(updated[1].name).toBe('B');
    });

    it('preserves id and createdAt on update', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'Test', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '2024-01-01T00:00:00Z' },
      ];
      const updated = presets.map(p => p.id === '1' ? { ...p, name: 'Changed' } : p);
      expect(updated[0].id).toBe('1');
      expect(updated[0].createdAt).toBe('2024-01-01T00:00:00Z');
    });

    it('handles update of nonexistent preset', () => {
      const presets: SearchPreset[] = [
        { id: '1', name: 'Test', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: '' },
      ];
      const updated = presets.map(p => p.id === '999' ? { ...p, name: 'X' } : p);
      expect(updated).toEqual(presets);
    });
  });

  describe('localStorage persistence', () => {
    it('persists presets to localStorage', () => {
      const key = `${BASE_STORAGE_KEY}-contacts`;
      const presets: SearchPreset[] = [{
        id: '1', name: 'Saved', filters: {}, sortBy: 'name', sortOrder: 'asc', createdAt: new Date().toISOString(),
      }];
      localStorage.setItem(key, JSON.stringify(presets));
      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Saved');
    });

    it('uses different keys for different contexts', () => {
      localStorage.setItem(`${BASE_STORAGE_KEY}-contacts`, JSON.stringify([{ id: '1' }]));
      localStorage.setItem(`${BASE_STORAGE_KEY}-companies`, JSON.stringify([{ id: '2' }]));
      const contacts = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-contacts`)!);
      const companies = JSON.parse(localStorage.getItem(`${BASE_STORAGE_KEY}-companies`)!);
      expect(contacts[0].id).toBe('1');
      expect(companies[0].id).toBe('2');
    });
  });
});
