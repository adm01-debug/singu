import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initial] }, children);
}

describe('useInteractionsAdvancedFilter.applyAll', () => {
  it('replaces previous filters (canais cleared when not in next)', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?canais=email&q=hello'),
    });
    expect(result.current.filters.canais).toEqual(['email']);
    act(() => {
      result.current.applyAll({ company: 'Acme' });
    });
    expect(result.current.filters.canais).toEqual([]);
    expect(result.current.filters.q).toBe('');
    expect(result.current.filters.company).toBe('Acme');
  });

  it('applyAll({}) clears all known filter keys', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?q=x&contact=c1&company=co1&canais=email,call&direcao=inbound&sort=oldest'),
    });
    expect(result.current.activeCount).toBeGreaterThan(0);
    act(() => {
      result.current.applyAll({});
    });
    expect(result.current.filters.q).toBe('');
    expect(result.current.filters.contact).toBe('');
    expect(result.current.filters.company).toBe('');
    expect(result.current.filters.canais).toEqual([]);
    expect(result.current.filters.direcao).toBe('all');
    expect(result.current.filters.sort).toBe('recent');
  });

  it('omits default values (direcao=all, sort=recent) from URL', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?direcao=inbound&sort=oldest'),
    });
    act(() => {
      result.current.applyAll({ direcao: 'all', sort: 'recent', q: 'test' });
    });
    expect(result.current.filters.direcao).toBe('all');
    expect(result.current.filters.sort).toBe('recent');
    expect(result.current.filters.q).toBe('test');
  });

  it('multiple successive applyAll calls do not accumulate stale state', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => {
      result.current.applyAll({ q: 'first', canais: ['email'] });
    });
    expect(result.current.filters.q).toBe('first');
    expect(result.current.filters.canais).toEqual(['email']);

    act(() => {
      result.current.applyAll({ company: 'Acme' });
    });
    expect(result.current.filters.q).toBe('');
    expect(result.current.filters.canais).toEqual([]);
    expect(result.current.filters.company).toBe('Acme');
  });

  it('handles date filters correctly', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    const de = new Date('2025-01-01T00:00:00.000Z');
    act(() => {
      result.current.applyAll({ de });
    });
    expect(result.current.filters.de).toBeInstanceOf(Date);
  });
});
