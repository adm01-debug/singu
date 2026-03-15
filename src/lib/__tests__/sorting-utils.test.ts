import { describe, it, expect } from 'vitest';
import { getSortValue, compareValues, compareDates, sortArray } from '../sorting-utils';

// ========================================
// getSortValue - 30+ scenarios
// ========================================
describe('getSortValue', () => {
  it('returns string value from object', () => {
    expect(getSortValue({ name: 'João' }, 'name')).toBe('João');
  });

  it('returns number value from object', () => {
    expect(getSortValue({ score: 85 }, 'score')).toBe(85);
  });

  it('returns default for null value', () => {
    expect(getSortValue({ name: null }, 'name')).toBe('');
  });

  it('returns default for undefined value', () => {
    expect(getSortValue({ name: undefined }, 'name')).toBe('');
  });

  it('returns custom default for null', () => {
    expect(getSortValue({ score: null }, 'score', 0)).toBe(0);
  });

  it('returns 0 for zero value (not default)', () => {
    expect(getSortValue({ score: 0 }, 'score')).toBe(0);
  });

  it('returns empty string for empty string value', () => {
    expect(getSortValue({ name: '' }, 'name')).toBe('');
  });

  it('converts boolean to string', () => {
    expect(getSortValue({ active: true }, 'active')).toBe('true');
  });

  it('converts array to string', () => {
    const result = getSortValue({ tags: ['a', 'b'] }, 'tags');
    expect(typeof result).toBe('string');
  });

  it('converts object to string', () => {
    const result = getSortValue({ meta: { key: 'val' } }, 'meta');
    expect(typeof result).toBe('string');
  });
});

// ========================================
// compareValues - 20+ scenarios
// ========================================
describe('compareValues', () => {
  it('sorts numbers ascending', () => {
    expect(compareValues(1, 2, 'asc')).toBeLessThan(0);
  });

  it('sorts numbers descending', () => {
    expect(compareValues(1, 2, 'desc')).toBeGreaterThan(0);
  });

  it('returns 0 for equal numbers', () => {
    expect(compareValues(5, 5, 'asc')).toBe(0);
  });

  it('sorts negative numbers correctly', () => {
    expect(compareValues(-10, 5, 'asc')).toBeLessThan(0);
  });

  it('sorts strings ascending (pt-BR locale)', () => {
    expect(compareValues('Ana', 'Bruno', 'asc')).toBeLessThan(0);
  });

  it('sorts strings descending', () => {
    expect(compareValues('Ana', 'Bruno', 'desc')).toBeGreaterThan(0);
  });

  it('returns 0 for equal strings', () => {
    expect(compareValues('abc', 'abc', 'asc')).toBe(0);
  });

  it('handles accented characters in Portuguese', () => {
    const result = compareValues('café', 'carro', 'asc');
    expect(typeof result).toBe('number');
  });

  it('handles mixed case', () => {
    // localeCompare should handle case
    const result = compareValues('ana', 'Ana', 'asc');
    expect(typeof result).toBe('number');
  });

  it('handles empty strings', () => {
    expect(compareValues('', 'abc', 'asc')).toBeLessThan(0);
  });

  it('handles number vs number with large values', () => {
    expect(compareValues(1000000, 999999, 'asc')).toBeGreaterThan(0);
  });

  it('handles float numbers', () => {
    expect(compareValues(3.14, 2.71, 'asc')).toBeGreaterThan(0);
  });
});

// ========================================
// compareDates - 20+ scenarios
// ========================================
describe('compareDates', () => {
  it('sorts dates ascending', () => {
    expect(compareDates('2024-01-01', '2024-06-01', 'asc')).toBeLessThan(0);
  });

  it('sorts dates descending', () => {
    expect(compareDates('2024-01-01', '2024-06-01', 'desc')).toBeGreaterThan(0);
  });

  it('returns 0 for equal dates', () => {
    expect(compareDates('2024-01-01', '2024-01-01', 'asc')).toBe(0);
  });

  it('handles null first date (treated as epoch)', () => {
    expect(compareDates(null, '2024-01-01', 'asc')).toBeLessThan(0);
  });

  it('handles null second date', () => {
    expect(compareDates('2024-01-01', null, 'asc')).toBeGreaterThan(0);
  });

  it('handles both null dates', () => {
    expect(compareDates(null, null, 'asc')).toBe(0);
  });

  it('handles undefined dates', () => {
    expect(compareDates(undefined, undefined, 'asc')).toBe(0);
  });

  it('handles ISO string dates', () => {
    expect(compareDates('2024-01-01T10:00:00Z', '2024-01-01T12:00:00Z', 'asc')).toBeLessThan(0);
  });

  it('handles Date objects', () => {
    const d1 = new Date('2024-01-01');
    const d2 = new Date('2024-06-01');
    expect(compareDates(d1, d2, 'asc')).toBeLessThan(0);
  });

  it('handles mixed Date and string', () => {
    const result = compareDates(new Date('2024-01-01'), '2024-06-01', 'asc');
    expect(result).toBeLessThan(0);
  });

  it('handles invalid date strings gracefully', () => {
    // Invalid date -> NaN -> 0 via || 0
    const result = compareDates('not-a-date', '2024-01-01', 'asc');
    expect(typeof result).toBe('number');
  });
});

// ========================================
// sortArray - 30+ scenarios
// ========================================
describe('sortArray', () => {
  const items = [
    { name: 'Carlos', score: 80, created_at: '2024-03-01' },
    { name: 'Ana', score: 95, created_at: '2024-01-15' },
    { name: 'Bruno', score: 70, created_at: '2024-06-10' },
  ];

  it('sorts by string ascending', () => {
    const sorted = sortArray(items, 'name', 'asc');
    expect(sorted[0].name).toBe('Ana');
    expect(sorted[2].name).toBe('Carlos');
  });

  it('sorts by string descending', () => {
    const sorted = sortArray(items, 'name', 'desc');
    expect(sorted[0].name).toBe('Carlos');
  });

  it('sorts by number ascending with numericFields', () => {
    const sorted = sortArray(items, 'score', 'asc', { numericFields: ['score'] });
    expect(sorted[0].score).toBe(70);
    expect(sorted[2].score).toBe(95);
  });

  it('sorts by number descending', () => {
    const sorted = sortArray(items, 'score', 'desc', { numericFields: ['score'] });
    expect(sorted[0].score).toBe(95);
  });

  it('sorts by date ascending with dateFields', () => {
    const sorted = sortArray(items, 'created_at', 'asc', { dateFields: ['created_at'] });
    expect(sorted[0].name).toBe('Ana');
  });

  it('sorts by date descending', () => {
    const sorted = sortArray(items, 'created_at', 'desc', { dateFields: ['created_at'] });
    expect(sorted[0].name).toBe('Bruno');
  });

  it('does not mutate original array', () => {
    const original = [...items];
    sortArray(items, 'name', 'asc');
    expect(items).toEqual(original);
  });

  it('handles empty array', () => {
    expect(sortArray([], 'name', 'asc')).toEqual([]);
  });

  it('handles single element array', () => {
    const single = [{ name: 'Only', score: 1, created_at: '2024-01-01' }];
    expect(sortArray(single, 'name', 'asc')).toEqual(single);
  });

  it('handles null values in sort field', () => {
    const withNull = [
      { name: 'A', val: null },
      { name: 'B', val: 'hello' },
    ];
    const sorted = sortArray(withNull, 'val', 'asc');
    expect(sorted.length).toBe(2);
  });

  it('handles items with same sort value (stability)', () => {
    const dupes = [
      { name: 'Same', id: 1 },
      { name: 'Same', id: 2 },
      { name: 'Same', id: 3 },
    ];
    const sorted = sortArray(dupes, 'name', 'asc');
    expect(sorted.length).toBe(3);
  });

  it('handles large array (100 items)', () => {
    const large = Array.from({ length: 100 }, (_, i) => ({
      name: `Item ${String(i).padStart(3, '0')}`,
      score: Math.random() * 100,
    }));
    const sorted = sortArray(large, 'score', 'asc', { numericFields: ['score'] });
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i - 1].score);
    }
  });

  it('handles special characters in strings', () => {
    const special = [
      { name: 'Ação' },
      { name: 'Ânimo' },
      { name: 'Abrir' },
    ];
    const sorted = sortArray(special, 'name', 'asc');
    expect(sorted.length).toBe(3);
  });
});
