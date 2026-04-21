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

});

const PERPAGE_KEY = 'singu-interactions-perPage-v1';
const VIEW_KEY = 'singu-interactions-view-v1';
const SORT_KEY = 'singu-interactions-sort-v1';

describe('useInteractionsAdvancedFilter — preferências persistidas', () => {
  beforeEach(() => localStorage.clear());

  it('hidrata perPage do cache quando ausente da URL', () => {
    localStorage.setItem(PERPAGE_KEY, '50');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.perPage).toBe(50);
  });

  it('URL ganha sobre cache para perPage e cache é reescrito', () => {
    localStorage.setItem(PERPAGE_KEY, '50');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?perPage=10'),
    });
    expect(result.current.filters.perPage).toBe(10);
    expect(localStorage.getItem(PERPAGE_KEY)).toBe('10');
  });

  it('hidrata view=by-contact do cache', () => {
    localStorage.setItem(VIEW_KEY, 'by-contact');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.view).toBe('by-contact');
  });

  it('hidrata sort=oldest do cache', () => {
    localStorage.setItem(SORT_KEY, 'oldest');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.sort).toBe('oldest');
  });

  it('setFilter("perPage", 50) grava no localStorage', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => result.current.setFilter('perPage', 50));
    expect(localStorage.getItem(PERPAGE_KEY)).toBe('50');
  });

  it('setFilter("view", "by-company") grava no localStorage', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => result.current.setFilter('view', 'by-company'));
    expect(localStorage.getItem(VIEW_KEY)).toBe('by-company');
  });

  it('setFilter("sort", "relevance") grava no localStorage', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => result.current.setFilter('sort', 'relevance'));
    expect(localStorage.getItem(SORT_KEY)).toBe('relevance');
  });

  it('cache inválido é ignorado e mantém defaults', () => {
    localStorage.setItem(PERPAGE_KEY, '999');
    localStorage.setItem(VIEW_KEY, 'foo');
    localStorage.setItem(SORT_KEY, 'bar');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.perPage).toBe(25);
    expect(result.current.filters.view).toBe('list');
    expect(result.current.filters.sort).toBe('recent');
  });

  it('defaults explícitos no cache não são hidratados', () => {
    localStorage.setItem(PERPAGE_KEY, '25');
    localStorage.setItem(VIEW_KEY, 'list');
    localStorage.setItem(SORT_KEY, 'recent');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.perPage).toBe(25);
    expect(result.current.filters.view).toBe('list');
    expect(result.current.filters.sort).toBe('recent');
  });
});
