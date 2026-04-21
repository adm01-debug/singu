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
