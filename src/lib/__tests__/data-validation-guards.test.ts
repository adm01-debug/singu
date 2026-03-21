/**
 * Testes de validação e guardas de dados — verifica null-safety,
 * type guards e normalizações usadas pelo sistema.
 */
import { describe, it, expect } from 'vitest';

// Reproduz guardas usados em todo o sistema
function safeArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  return value;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

function safeString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

function safeJSON<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; }
    catch { return fallback; }
  }
  return fallback;
}

function normalizeContactName(first: string | null | undefined, last: string | null | undefined): string {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!f && !l) return 'Contato Sem Nome';
  return `${f} ${l}`.trim();
}

function clampScore(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function sanitizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

describe('Safe Array Guard', () => {
  it('returns empty array for null', () => expect(safeArray(null)).toEqual([]));
  it('returns empty array for undefined', () => expect(safeArray(undefined)).toEqual([]));
  it('returns the array for valid input', () => expect(safeArray([1, 2, 3])).toEqual([1, 2, 3]));
  it('returns empty for non-array values', () => expect(safeArray('not array' as any)).toEqual([]));
  it('handles empty arrays', () => expect(safeArray([])).toEqual([]));
  it('handles nested arrays', () => expect(safeArray([[1], [2]])).toEqual([[1], [2]]));
});

describe('Safe Number Guard', () => {
  it('returns number for valid number', () => expect(safeNumber(42)).toBe(42));
  it('returns fallback for null', () => expect(safeNumber(null)).toBe(0));
  it('returns fallback for undefined', () => expect(safeNumber(undefined)).toBe(0));
  it('parses numeric strings', () => expect(safeNumber('42')).toBe(42));
  it('returns fallback for NaN strings', () => expect(safeNumber('abc')).toBe(0));
  it('returns custom fallback', () => expect(safeNumber(null, 5)).toBe(5));
  it('handles zero', () => expect(safeNumber(0)).toBe(0));
  it('handles negative numbers', () => expect(safeNumber(-10)).toBe(-10));
  it('handles Infinity', () => expect(safeNumber(Infinity)).toBe(Infinity));
  it('handles float', () => expect(safeNumber(3.14)).toBeCloseTo(3.14));
});

describe('Safe String Guard', () => {
  it('returns string for valid string', () => expect(safeString('hello')).toBe('hello'));
  it('returns fallback for null', () => expect(safeString(null)).toBe(''));
  it('returns fallback for undefined', () => expect(safeString(undefined)).toBe(''));
  it('converts number to string', () => expect(safeString(42)).toBe('42'));
  it('returns custom fallback', () => expect(safeString(null, 'N/A')).toBe('N/A'));
  it('handles empty string', () => expect(safeString('')).toBe(''));
  it('handles boolean', () => expect(safeString(true)).toBe('true'));
});

describe('Safe JSON Guard', () => {
  it('returns object for valid object', () => {
    expect(safeJSON({ a: 1 }, {})).toEqual({ a: 1 });
  });
  it('returns fallback for null', () => {
    expect(safeJSON(null, { default: true })).toEqual({ default: true });
  });
  it('parses valid JSON string', () => {
    expect(safeJSON('{"a":1}', {})).toEqual({ a: 1 });
  });
  it('returns fallback for invalid JSON string', () => {
    expect(safeJSON('invalid', {})).toEqual({});
  });
  it('returns fallback for undefined', () => {
    expect(safeJSON(undefined, [])).toEqual([]);
  });
  it('handles array values', () => {
    expect(safeJSON([1, 2, 3], [])).toEqual([1, 2, 3]);
  });
});

describe('normalizeContactName', () => {
  it('joins first and last name', () => {
    expect(normalizeContactName('João', 'Silva')).toBe('João Silva');
  });
  it('handles null first name', () => {
    expect(normalizeContactName(null, 'Silva')).toBe('Silva');
  });
  it('handles null last name', () => {
    expect(normalizeContactName('João', null)).toBe('João');
  });
  it('returns fallback for both null', () => {
    expect(normalizeContactName(null, null)).toBe('Contato Sem Nome');
  });
  it('trims whitespace', () => {
    expect(normalizeContactName('  João  ', '  Silva  ')).toBe('João Silva');
  });
  it('handles empty strings', () => {
    expect(normalizeContactName('', '')).toBe('Contato Sem Nome');
  });
});

describe('clampScore', () => {
  it('returns value within range', () => expect(clampScore(50)).toBe(50));
  it('clamps to min', () => expect(clampScore(-10)).toBe(0));
  it('clamps to max', () => expect(clampScore(150)).toBe(100));
  it('handles boundary min', () => expect(clampScore(0)).toBe(0));
  it('handles boundary max', () => expect(clampScore(100)).toBe(100));
  it('handles custom range', () => expect(clampScore(5, 1, 10)).toBe(5));
  it('clamps to custom max', () => expect(clampScore(15, 1, 10)).toBe(10));
});

describe('isValidEmail', () => {
  it('accepts valid email', () => expect(isValidEmail('user@example.com')).toBe(true));
  it('accepts email with dots', () => expect(isValidEmail('a.b@c.d.e')).toBe(true));
  it('rejects no @', () => expect(isValidEmail('userexample.com')).toBe(false));
  it('rejects no domain', () => expect(isValidEmail('user@')).toBe(false));
  it('rejects spaces', () => expect(isValidEmail('user @example.com')).toBe(false));
  it('rejects empty', () => expect(isValidEmail('')).toBe(false));
});

describe('isValidPhone', () => {
  it('accepts BR phone with DDD', () => expect(isValidPhone('(11) 99999-9999')).toBe(true));
  it('accepts clean digits', () => expect(isValidPhone('11999999999')).toBe(true));
  it('accepts international', () => expect(isValidPhone('+5511999999999')).toBe(true));
  it('rejects too short', () => expect(isValidPhone('123')).toBe(false));
  it('rejects empty', () => expect(isValidPhone('')).toBe(false));
  it('rejects too long', () => expect(isValidPhone('1234567890123456')).toBe(false));
});

describe('sanitizeTag', () => {
  it('lowercases', () => expect(sanitizeTag('VIP')).toBe('vip'));
  it('trims', () => expect(sanitizeTag('  tag  ')).toBe('tag'));
  it('replaces spaces with hyphens', () => expect(sanitizeTag('high value')).toBe('high-value'));
  it('handles multiple spaces', () => expect(sanitizeTag('a  b  c')).toBe('a-b-c'));
  it('handles already clean tag', () => expect(sanitizeTag('clean')).toBe('clean'));
  it('handles accented characters', () => expect(sanitizeTag('Ação')).toBe('ação'));
});
