import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className utility)', () => {
  it('merges simple classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
  });

  it('handles true conditional', () => {
    expect(cn('base', true && 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('handles undefined values', () => {
    expect(cn('base', undefined)).toBe('base');
  });

  it('handles null values', () => {
    expect(cn('base', null)).toBe('base');
  });

  it('handles empty string', () => {
    expect(cn('')).toBe('');
  });

  it('handles no arguments', () => {
    expect(cn()).toBe('');
  });

  it('merges multiple tailwind utilities correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500', 'p-4', 'p-8');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('p-8');
    expect(result).not.toContain('p-4');
  });

  it('handles array input', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('handles object input', () => {
    expect(cn({ 'bg-red-500': true, 'text-white': false })).toBe('bg-red-500');
  });

  it('handles deeply nested inputs', () => {
    expect(cn('a', ['b', ['c']])).toBe('a b c');
  });
});
