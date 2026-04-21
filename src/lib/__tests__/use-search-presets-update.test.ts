import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchPresets } from '@/hooks/useSearchPresets';
import { dedupeNameAgainst } from '@/lib/searchPresetTransport';

describe('useSearchPresets.updatePreset preservation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('preserves id, createdAt, usageCount, lastUsedAt, isFavorite when renaming', () => {
    const { result } = renderHook(() => useSearchPresets('test-rename'));

    act(() => {
      result.current.savePreset({
        name: 'Original',
        filters: { tag: ['x'] },
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });
    const original = result.current.presets[0];
    act(() => {
      result.current.toggleFavorite(original.id);
      result.current.markAsUsed(original.id);
      result.current.markAsUsed(original.id);
    });

    const beforeUpdate = result.current.presets[0];
    expect(beforeUpdate.isFavorite).toBe(true);
    expect(beforeUpdate.usageCount).toBe(2);

    act(() => {
      result.current.updatePreset(original.id, { name: 'Renamed' });
    });

    const after = result.current.presets[0];
    expect(after.id).toBe(original.id);
    expect(after.createdAt).toBe(original.createdAt);
    expect(after.name).toBe('Renamed');
    expect(after.isFavorite).toBe(true);
    expect(after.usageCount).toBe(2);
    expect(after.lastUsedAt).toBe(beforeUpdate.lastUsedAt);
    expect(after.updatedAt).toBeDefined();
  });

  it('preserves stats when updating filters', () => {
    const { result } = renderHook(() => useSearchPresets('test-filters'));
    act(() => {
      result.current.savePreset({
        name: 'P',
        filters: { canal: ['email'] },
        sortBy: '',
        sortOrder: 'desc',
      });
    });
    const p = result.current.presets[0];
    act(() => {
      result.current.toggleFavorite(p.id);
      result.current.markAsUsed(p.id);
    });

    act(() => {
      result.current.updatePreset(p.id, {
        filters: { canal: ['whatsapp'] },
        sortBy: 'date',
        sortOrder: 'asc',
      });
    });

    const after = result.current.presets[0];
    expect(after.filters.canal).toEqual(['whatsapp']);
    expect(after.sortBy).toBe('date');
    expect(after.sortOrder).toBe('asc');
    expect(after.isFavorite).toBe(true);
    expect(after.usageCount).toBe(1);
    expect(after.id).toBe(p.id);
    expect(after.createdAt).toBe(p.createdAt);
  });

  it('does not affect other presets when updating one', () => {
    const { result } = renderHook(() => useSearchPresets('test-multi'));
    act(() => {
      result.current.savePreset({ name: 'A', filters: {}, sortBy: '', sortOrder: 'desc' });
      result.current.savePreset({ name: 'B', filters: {}, sortBy: '', sortOrder: 'desc' });
    });
    const [b, a] = result.current.presets;
    act(() => {
      result.current.updatePreset(a.id, { name: 'A renamed' });
    });
    const updatedB = result.current.presets.find(p => p.id === b.id);
    expect(updatedB?.name).toBe('B');
    expect(result.current.presets.length).toBe(2);
  });

  it('dedupeNameAgainst returns suffix on collision', () => {
    expect(dedupeNameAgainst(['A', 'B'], 'A')).toBe('A (2)');
    expect(dedupeNameAgainst(['A', 'A (2)'], 'A')).toBe('A (3)');
    expect(dedupeNameAgainst(['A'], 'C')).toBe('C');
  });
});
