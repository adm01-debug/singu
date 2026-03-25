import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGlobalSearch } from '../useGlobalSearch';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'test-user-123' } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/lib/logger', () => ({ logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn(), table: vi.fn(), group: vi.fn(), groupEnd: vi.fn() } }));
vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }) }));

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial closed state', () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(result.current.isOpen).toBe(false);
  });

  it('should export all functions', () => {
    const { result } = renderHook(() => useGlobalSearch());
    expect(typeof result.current.openSearch).toBe('function');
    expect(typeof result.current.closeSearch).toBe('function');
    expect(typeof result.current.toggleSearch).toBe('function');
    expect(typeof result.current.setIsOpen).toBe('function');
  });

  it('should open search', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.openSearch();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should close search', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.openSearch();
    });
    act(() => {
      result.current.closeSearch();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle search', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.toggleSearch();
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.toggleSearch();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should set isOpen directly', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      result.current.setIsOpen(true);
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      result.current.setIsOpen(false);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should respond to Ctrl+K keyboard event', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should respond to Meta+K keyboard event', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    });
    expect(result.current.isOpen).toBe(true);
  });

  it('should not respond to K without modifier', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should toggle on repeated Ctrl+K', () => {
    const { result } = renderHook(() => useGlobalSearch());
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.isOpen).toBe(true);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });
    expect(result.current.isOpen).toBe(false);
  });
});
