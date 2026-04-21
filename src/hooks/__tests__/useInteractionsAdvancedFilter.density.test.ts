import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

const DENSITY_KEY = 'singu-interactions-density-v1';

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initial] }, children);
}

describe('useInteractionsAdvancedFilter — densidade', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default: sem ?density, filters.density === comfortable', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.density).toBe('comfortable');
  });

  it('?density=compact → filters.density === compact', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?density=compact'),
    });
    expect(result.current.filters.density).toBe('compact');
  });

  it('?density=foo → fallback comfortable', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?density=foo'),
    });
    expect(result.current.filters.density).toBe('comfortable');
  });

  it('setFilter("density","compact") aplica compact', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => result.current.setFilter('density', 'compact'));
    expect(result.current.filters.density).toBe('compact');
    expect(localStorage.getItem(DENSITY_KEY)).toBe('compact');
  });

  it('setFilter("density","comfortable") volta ao default', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?density=compact'),
    });
    act(() => result.current.setFilter('density', 'comfortable'));
    expect(result.current.filters.density).toBe('comfortable');
  });

  it('mudar density não conta em activeCount', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.activeCount).toBe(0);
    act(() => result.current.setFilter('density', 'compact'));
    expect(result.current.activeCount).toBe(0);
  });

  it('mudar density reseta page para 1', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=4'),
    });
    expect(result.current.filters.page).toBe(4);
    act(() => result.current.setFilter('density', 'compact'));
    expect(result.current.filters.page).toBe(1);
  });
});
