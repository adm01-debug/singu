import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';

const KEY = 'channel-applied-canais';

function wrapperFor(initial: string) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initial] }, children);
}

describe('useInteractionsAdvancedFilter — persistência de canais', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hidrata canais do localStorage quando URL não tem ?canais=', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ canais: ['email', 'whatsapp'], ts: Date.now() })
    );
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.canais).toEqual(['email', 'whatsapp']);
  });

  it('NÃO hidrata quando URL já tem ?canais= (URL ganha)', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ canais: ['email', 'whatsapp'], ts: Date.now() })
    );
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?canais=call'),
    });
    expect(result.current.filters.canais).toEqual(['call']);
  });

  it('persiste no localStorage quando setFilter("canais", [...]) é chamado', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    act(() => {
      result.current.setFilter('canais', ['email', 'note']);
    });
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).canais).toEqual(['email', 'note']);
  });

  it('limpa localStorage quando setFilter("canais", []) é chamado', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?canais=email'),
    });
    act(() => {
      result.current.setFilter('canais', []);
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('não hidrata se o cache estiver vazio/inválido', () => {
    localStorage.setItem(KEY, '{garbage');
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.canais).toEqual([]);
  });
});

describe('useInteractionsAdvancedFilter — paginação e datas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults: page=1 e perPage=25', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.perPage).toBe(25);
  });

  it('parsa page e perPage da URL', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=3&perPage=50'),
    });
    expect(result.current.filters.page).toBe(3);
    expect(result.current.filters.perPage).toBe(50);
  });

  it('valores inválidos caem em defaults', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=abc&perPage=7'),
    });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.perPage).toBe(25);
  });

  it('setFilter("q", ...) reseta page para 1', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=4'),
    });
    expect(result.current.filters.page).toBe(4);
    act(() => { result.current.setFilter('q', 'foo'); });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.q).toBe('foo');
  });

  it('setFilter("de", ...) reseta page para 1', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=5'),
    });
    act(() => { result.current.setFilter('de', new Date('2025-01-01')); });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.de).toBeInstanceOf(Date);
  });

  it('setFilter("ate", ...) reseta page para 1', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=2'),
    });
    act(() => { result.current.setFilter('ate', new Date('2025-12-31')); });
    expect(result.current.filters.page).toBe(1);
  });

  it('setFilter("perPage", ...) reseta page para 1', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=6'),
    });
    act(() => { result.current.setFilter('perPage', 50); });
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.perPage).toBe(50);
  });

  it('setFilter("page", N) NÃO altera outros filtros', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?q=hello&canais=email'),
    });
    act(() => { result.current.setFilter('page', 3); });
    expect(result.current.filters.page).toBe(3);
    expect(result.current.filters.q).toBe('hello');
    expect(result.current.filters.canais).toEqual(['email']);
  });

  it('applyDateRange aceita ordem correta sem swap', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    let swapped = true;
    act(() => {
      swapped = result.current.applyDateRange(new Date('2025-01-01'), new Date('2025-01-31'));
    });
    expect(swapped).toBe(false);
    expect(result.current.filters.de?.toISOString().slice(0, 10)).toBe('2025-01-01');
    expect(result.current.filters.ate?.toISOString().slice(0, 10)).toBe('2025-01-31');
  });

  it('applyDateRange faz swap quando de > ate', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes'),
    });
    let swapped = false;
    act(() => {
      swapped = result.current.applyDateRange(new Date('2025-12-31'), new Date('2025-01-01'));
    });
    expect(swapped).toBe(true);
    expect(result.current.filters.de?.toISOString().slice(0, 10)).toBe('2025-01-01');
    expect(result.current.filters.ate?.toISOString().slice(0, 10)).toBe('2025-12-31');
  });

  it('applyDateRange zera page', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?page=4'),
    });
    act(() => {
      result.current.applyDateRange(new Date('2025-01-01'), new Date('2025-01-31'));
    });
    expect(result.current.filters.page).toBe(1);
  });

  it('applyDateRange(undefined, undefined) limpa as datas', () => {
    const { result } = renderHook(() => useInteractionsAdvancedFilter(), {
      wrapper: wrapperFor('/interacoes?de=2025-01-01&ate=2025-12-31'),
    });
    act(() => {
      result.current.applyDateRange(undefined, undefined);
    });
    expect(result.current.filters.de).toBeUndefined();
    expect(result.current.filters.ate).toBeUndefined();
  });
});
