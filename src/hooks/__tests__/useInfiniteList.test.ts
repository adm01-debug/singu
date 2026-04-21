import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteList } from '../useInfiniteList';

function makeItems(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useInfiniteList', () => {
  it('sem persistKey: nunca toca sessionStorage', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem');
    const getSpy = vi.spyOn(Storage.prototype, 'getItem');
    const { result } = renderHook(() => useInfiniteList(makeItems(100), 10, []));
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.visible).toHaveLength(10);
    expect(setSpy).not.toHaveBeenCalled();
    expect(getSpy).not.toHaveBeenCalled();
  });

  it('com persistKey e cache válido: hidrata count inicial', () => {
    sessionStorage.setItem('k1', '30');
    const { result } = renderHook(() =>
      useInfiniteList(makeItems(100), 10, [], { persistKey: 'k1' })
    );
    expect(result.current.visible).toHaveLength(30);
  });

  it('cache inválido: usa pageSize', () => {
    sessionStorage.setItem('k2', 'foo');
    const { result } = renderHook(() =>
      useInfiniteList(makeItems(100), 10, [], { persistKey: 'k2' })
    );
    expect(result.current.visible).toHaveLength(10);
  });

  it('cache menor que pageSize: usa pageSize', () => {
    sessionStorage.setItem('k3', '3');
    const { result } = renderHook(() =>
      useInfiniteList(makeItems(100), 10, [], { persistKey: 'k3' })
    );
    expect(result.current.visible).toHaveLength(10);
  });

  it('loadMore grava em sessionStorage após debounce', () => {
    const { result } = renderHook(() =>
      useInfiniteList(makeItems(100), 10, [], { persistKey: 'k4' })
    );
    act(() => { result.current.loadMore(); });
    act(() => { vi.advanceTimersByTime(250); });
    expect(sessionStorage.getItem('k4')).toBe('20');
  });

  it('mudança em deps zera count e limpa cache', () => {
    sessionStorage.setItem('k5', '40');
    let dep = 'a';
    const { result, rerender } = renderHook(() =>
      useInfiniteList(makeItems(100), 10, [dep], { persistKey: 'k5' })
    );
    expect(result.current.visible).toHaveLength(40);

    dep = 'b';
    rerender();
    act(() => { vi.advanceTimersByTime(0); });
    expect(result.current.visible).toHaveLength(10);
    expect(sessionStorage.getItem('k5')).toBeNull();
  });

  it('sessionStorage indisponível (throw): hook não quebra', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() =>
      useInfiniteList(makeItems(50), 10, [], { persistKey: 'k6' })
    );
    expect(result.current.visible).toHaveLength(10);
    act(() => { result.current.loadMore(); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.visible).toHaveLength(20);
  });
});
